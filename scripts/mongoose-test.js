// Test MongoDB connection using Mongoose
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI environment variable is not defined');
  process.exit(1);
}

console.log('MongoDB URI found in environment variables');
console.log(`URI: ${mongoUri.substring(0, 20)}...`);

// Connect to MongoDB
async function testConnection() {
  console.log('Attempting to connect to MongoDB with Mongoose...');
  
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('Mongoose connection successful!');
    console.log('Connection state:', mongoose.connection.readyState);
    
    // Create a simple test schema and model
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const Test = mongoose.model('Test', testSchema);
    
    // Try to find documents to test read access
    const testDocs = await Test.find().limit(1);
    console.log('Database read test:', testDocs.length > 0 ? 'Documents found' : 'No documents found (but connection works)');
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Mongoose connection test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Mongoose connection closed');
    }
  }
}

testConnection(); 