import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

export default async function handler(req, res) {
  const { key } = req.query;
  
  if (!key) {
    return res.status(400).json({ error: 'S3 key required' });
  }

  try {
    const params = {
      Bucket: 'coloring-pages-1',
      Key: decodeURIComponent(key)
    };

    // Get the object from S3
    const s3Object = await s3.getObject(params).promise();
    
    // Set headers to force download
    const fileName = key.split('/').pop();
    res.setHeader('Content-Type', s3Object.ContentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', s3Object.ContentLength);
    
    // Send the file
    res.send(s3Object.Body);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
}