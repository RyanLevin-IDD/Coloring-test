import { getCategories } from '../../lib/s3';

export default async function handler(req, res) {
  try {
    const categories = await getCategories();
    res.status(200).json(categories);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}