import { getAllPages } from '../../lib/s3';

export default async function handler(req, res) {
  const { q } = req.query;
  
  try {
    const allPages = await getAllPages();
    
    if (!q) {
      return res.status(200).json(allPages);
    }
    
    // Filter pages based on search query
    const searchTerm = q.toLowerCase();
    const filteredPages = allPages.filter(page => 
      page.name.toLowerCase().includes(searchTerm) ||
      page.category.toLowerCase().includes(searchTerm)
    );
    
    res.status(200).json(filteredPages);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search pages' });
  }

}
