import { getCategoryPages } from '../../../lib/s3';

export default async function handler(req, res) {
  const { slug } = req.query;
  
  try {
    const data = await getCategoryPages(slug);
    
    if (!data.category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch category data' });
  }
}