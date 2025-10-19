
import { MongoClient } from 'mongodb';

export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      return response.status(500).json({ 
        error: 'MongoDB connection not configured',
        details: 'MONGODB_URI environment variable missing'
      });
    }

    // Parse the incoming data
    const analyticsData = request.body;
    
    // Connect to MongoDB
    const client = new MongoClient(mongoURI);
    await client.connect();
    
    // Get database and collection
    const database = client.db('stream_central_analytics');
    const collection = database.collection('visitor_analytics');
    
    // Add timestamp
    const document = {
      ...analyticsData,
      timestamp: new Date(),
      platform: 'vercel',
      deployedAt: '2024'
    };
    
    // Insert into MongoDB
    const result = await collection.insertOne(document);
    
    // Close connection
    await client.close();
    
    return response.status(200).json({ 
      success: true, 
      insertedId: result.insertedId,
      message: 'Data stored successfully in MongoDB',
      platform: 'Vercel + MongoDB Atlas'
    });
    
  } catch (error) {
    console.error('MongoDB Error:', error);
    return response.status(500).json({ 
      error: 'Failed to store data',
      details: error.message,
      platform: 'Vercel'
    });
  }
}
