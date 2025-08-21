// Test MongoDB connection - writes to both console and file
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Create a log file that we can check
const logFile = path.resolve(__dirname, '../mongo-test-log.txt');
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

function log(message) {
  const line = `${new Date().toISOString()}: ${message}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

const uri = 'mongodb://localhost:27017/test';
log(`Testing connection to: ${uri}`);

async function main() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 second timeout
    connectTimeoutMS: 5000,
  });

  try {
    log('Attempting connection...');
    await client.connect();
    log('Connected successfully to MongoDB server');
    
    const db = client.db('test');
    const ping = await db.command({ ping: 1 });
    log(`Ping result: ${JSON.stringify(ping)}`);
    
    log('Connection test successful!');
  } catch (err) {
    log(`CONNECTION ERROR: ${err.message}`);
    log(`Stack: ${err.stack}`);
    if (err.code) {
      log(`Error code: ${err.code}`);
    }
  } finally {
    await client.close();
    log('Connection closed');
  }
}

main().catch(err => log(`Fatal error: ${err.message}`)); 