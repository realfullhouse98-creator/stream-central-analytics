const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Get MongoDB URI from environment variables
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'MongoDB connection not configured' })
            };
        }

        // Parse the incoming data
        const analyticsData = JSON.parse(event.body);
        
        // Connect to MongoDB
        const client = new MongoClient(mongoURI);
        await client.connect();
        
        // Get database and collection
        const database = client.db('stream_central_analytics');
        const collection = database.collection('visitor_analytics');
        
        // Add timestamp and ID
        const document = {
            ...analyticsData,
            timestamp: new Date(),
            sessionId: context.awsRequestId // Unique ID for this request
        };
        
        // Insert into MongoDB
        const result = await collection.insertOne(document);
        
        // Close connection
        await client.close();
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                insertedId: result.insertedId,
                message: 'Data stored successfully' 
            })
        };
        
    } catch (error) {
        console.error('MongoDB Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to store data',
                details: error.message 
            })
        };
    }
};
