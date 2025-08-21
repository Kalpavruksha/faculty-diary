const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Create a log file
const logFile = path.resolve(__dirname, '../db-init-log.txt');
function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

// Clear existing log
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}
log('=== Database Initialization Log ===');

// Load environment variables
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  log('Loaded .env.local file');
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  log('Loaded .env file');
} else {
  log('No .env file found, using default connection string');
}

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/work-diary';
log(`Using MongoDB URI: ${uri}`);
log('Starting DB script...');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 seconds timeout
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    retryReads: true
  });
  try {
    log('Attempting to connect to MongoDB...');
    await client.connect();
    log('Connected to MongoDB!');
    
    // Extract database name from URI
    const dbName = uri.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    log(`Using database: ${dbName}`);

    // Drop existing collections to start fresh
    log('Dropping existing collections...');
    try {
      const collections = await db.listCollections().toArray();
      for (const collection of collections) {
        await db.collection(collection.name).drop();
        log(`Dropped collection: ${collection.name}`);
      }
    } catch (err) {
      log('No collections to drop or error dropping collections: ' + err.message);
    }

    // Users collection
    log('Inserting users...');
    const hashedPassword = await hashPassword('password123');
    
    const users = [
      {
        _id: new ObjectId(),
        name: 'Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        department: 'head',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'Faculty1',
        email: 'faculty1@college.edu',
        password: hashedPassword,
        department: 'Computer Science',
        role: 'faculty',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'Faculty2',
        email: 'faculty2@college.edu',
        password: hashedPassword,
        department: 'Electronics',
        role: 'faculty',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'Faculty3',
        email: 'faculty3@college.edu',
        password: hashedPassword,
        department: 'Civil Engineering',
        role: 'faculty',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const usersResult = await db.collection('users').insertMany(users);
    log(`Users inserted: ${usersResult.insertedCount}`);

    // Create a map of email to user ID for reference
    const userMap = {};
    users.forEach(user => {
      userMap[user.email] = user._id;
    });

    // Work Diary Entries collection
    log('Inserting work diary entries...');
    const entriesResult = await db.collection('workdiaryentries').insertMany([
      {
        user: userMap['faculty1@college.edu'],
        date: new Date(),
        activities: 'Taught Data Structures',
        task: 'Lecture on Linked Lists',
        hours: 2,
        totalStudents: 60,
        present: 58,
        absent: 2,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user: userMap['faculty2@college.edu'],
        date: new Date(),
        activities: 'Lab on Digital Circuits',
        task: 'Practical on Flip-Flops',
        hours: 3,
        totalStudents: 50,
        present: 48,
        absent: 2,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user: userMap['faculty3@college.edu'],
        date: new Date(),
        activities: 'Surveying Field Work',
        task: 'Leveling Exercise',
        hours: 4,
        totalStudents: 40,
        present: 39,
        absent: 1,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    log(`Work diary entries inserted: ${entriesResult.insertedCount}`);

    // Timetables collection
    log('Inserting timetables...');
    const timetablesResult = await db.collection('timetables').insertMany([
      {
        faculty: userMap['faculty1@college.edu'],
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        subject: 'Data Structures',
        room: 'Room 101',
        department: 'Computer Science',
        semester: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        faculty: userMap['faculty2@college.edu'],
        day: 'Tuesday',
        startTime: '10:00',
        endTime: '11:00',
        subject: 'Digital Electronics',
        room: 'Room 202',
        department: 'Electronics',
        semester: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        faculty: userMap['faculty3@college.edu'],
        day: 'Wednesday',
        startTime: '11:00',
        endTime: '12:00',
        subject: 'Surveying',
        room: 'Room 303',
        department: 'Civil Engineering',
        semester: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    log(`Timetables inserted: ${timetablesResult.insertedCount}`);

    log('All collections created with sample data!');
  } catch (err) {
    log('ERROR: ' + err.message);
    log(err.stack);
  } finally {
    await client.close();
    log('MongoDB connection closed.');
  }
}

main();