import AWS from 'aws-sdk';

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = 'coloring-pages-1';

// Get all categories from S3
export async function getCategories() {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Delimiter: '/'
    };

    const data = await s3.listObjectsV2(params).promise();
    
    // Get folders (CommonPrefixes)
    const categoryPromises = data.CommonPrefixes.map(async (prefix) => {
      const categoryName = prefix.Prefix.slice(0, -1); // Remove trailing slash
      
      // Get cover image and count pages
      const categoryParams = {
        Bucket: BUCKET_NAME,
        Prefix: prefix.Prefix
      };
      
      const categoryData = await s3.listObjectsV2(categoryParams).promise();
      
      // Find cover image (look for files with 'cover' or the colored image)
      const coverImage = categoryData.Contents.find(item => {
        const key = item.Key.toLowerCase();
        return key.includes('cover') || key.includes('category') || 
               (key.endsWith('.jpg') || key.endsWith('.png')) && 
               !key.includes('page') && categoryData.Contents.length > 5;
      });
      
      // Count actual coloring pages (exclude cover)
      const pageCount = categoryData.Contents.filter(item => {
        const key = item.Key.toLowerCase();
        return (key.endsWith('.jpg') || key.endsWith('.png') || key.endsWith('.pdf')) &&
               !key.includes('cover') && !key.includes('category');
      }).length;
      
      return {
        id: categoryName.replace(/\s+/g, '-').toLowerCase(),
        name: categoryName,
        slug: categoryName.replace(/\s+/g, '-').toLowerCase(),
        coverImage: coverImage ? `https://${BUCKET_NAME}.s3.amazonaws.com/${coverImage.Key}` : '/api/placeholder/400/400',
        pageCount: pageCount
      };
    });
    
    const categories = await Promise.all(categoryPromises);
    return categories.filter(cat => cat.pageCount > 0).sort((a, b) => a.name.localeCompare(b.name));
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
// Get All pages
export async function getAllPages() {
  try {
    const categories = await getCategories();
    const allPagesPromises = categories.map(async (category) => {
      const { pages } = await getCategoryPages(category.slug);
      return pages.map(page => ({
        ...page,
        category: category.name,
        categorySlug: category.slug
      }));
    });
    
    const allPagesArrays = await Promise.all(allPagesPromises);
    return allPagesArrays.flat(); // Flatten the array of arrays
    
  } catch (error) {
    console.error('Error fetching all pages:', error);
    return [];
  }
}

// Get pages for a specific category
export async function getCategoryPages(categorySlug) {
  try {
    // First, get all categories to find the exact name
    const allCategories = await getCategories();
    const exactCategory = allCategories.find(cat => cat.slug === categorySlug);
    
    if (!exactCategory) {
      return { category: null, pages: [] };
    }
    
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: `${exactCategory.name}/`
    };
    
    const data = await s3.listObjectsV2(params).promise();
    
    // Filter and format pages
    const pages = data.Contents
      .filter(item => {
        const key = item.Key.toLowerCase();
        return (key.endsWith('.jpg') || key.endsWith('.png') || key.endsWith('.pdf')) &&
               !key.includes('cover') && !key.includes('category');
      })
      .map((item, index) => {
        const fileName = item.Key.split('/').pop();
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        const readableName = nameWithoutExt
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return {
          id: `${categorySlug}-page-${index + 1}`,
          name: readableName,
          fileName: fileName,
          thumbnailUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${item.Key}`,
          downloadUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${item.Key}`,
          s3Key: item.Key
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return {
      category: exactCategory,
      pages: pages
    };
    
  } catch (error) {
    console.error('Error fetching category pages:', error);
    return { category: null, pages: [] };
  }

}
