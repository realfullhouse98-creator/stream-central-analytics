import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('🔍 Testing MongoDB connection...');
  
  // Check if MONGODB_URI exists
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ 
      error: '❌ MONGODB_URI environment variable is missing',
      suggestion: 'Check Vercel project settings → Environment Variables'
    });
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('📡 Attempting to connect to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('stream_central_analytics');
    
    // Test the connection by counting documents
    const count = await db.collection('visitor_analytics').countDocuments();
    
    console.log(`📊 Found ${count} documents in visitor_analytics`);
    
    res.status(200).json({ 
      message: '✅ MongoDB Connection SUCCESSFUL!',
      documentCount: count,
      database: 'stream_central_analytics',
      collection: 'visitor_analytics',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ MongoDB Connection FAILED:', error.message);
    res.status(500).json({ 
      error: '❌ MongoDB Connection FAILED',
      details: error.message,
      suggestion: 'Check MONGODB_URI format and MongoDB Atlas IP whitelist'
    });
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}
