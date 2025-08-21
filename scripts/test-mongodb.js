// Script to test MongoDB connection directly
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI environment variable is not defined');
  process.exit(1);
}

console.log('MongoDB URI found in environment variables');
console.log(`URI: ${mongoUri.substring(0, 20)}...`);

async function testConnection() {
  console.log('Attempting to connect to MongoDB...');
  const client = new MongoClient(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 seconds timeout for connection test
  });

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    // Test DB access
    const adminDb = client.db().admin();
    const result = await adminDb.listDatabases();
    console.log('Databases:');
    result.databases.forEach(db => {
      console.log(` - ${db.name}`);
    });
    
    console.log('Connection test successful!');
  } catch (error) {
    console.error('MongoDB connection test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

testConnection(); 