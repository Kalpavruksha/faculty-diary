const { MongoClient } = require('mongodb');
const fs = require('fs');

// Local MongoDB connection
const uri = 'mongodb://localhost:27017/test';
console.log(`Attempting to connect to: ${uri}`);

async function main() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 second timeout
  });

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    
    const db = client.db('test');
    const collections = await db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    fs.writeFileSync('mongo-error.txt', JSON.stringify(err, null, 2));
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

main().catch(console.error); 