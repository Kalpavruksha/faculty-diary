// Use your MongoDB Compass connection string to populate the database
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log("STARTING DATABASE INITIALIZATION SCRIPT");
console.log("======================================");

// Create a log file
const logFile = path.resolve(__dirname, '../compass-init-log.txt');
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

function log(message) {
  const line = `${new Date().toISOString()}: ${message}`;
  console.log('=====================');
  console.log(line);
  console.log('=====================');
  fs.appendFileSync(logFile, line + '\n');
}

log('=== MongoDB Compass Connection Initialization ===');

// Get the MongoDB Atlas password from the command line
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Base connection string (need to replace the password)
let baseUri = 'mongodb+srv://beshu:<db_password>@cluster0.2iund8b.mongodb.net/work-diary?retryWrites=true&w=majority&appName=Cluster0';

rl.question('Enter your MongoDB Atlas password: ', (password) => {
  // Replace the password placeholder with the actual password
  const compassUri = baseUri.replace('<db_password>', password);
  
  log(`Using connection string with provided password`);
  
  // Initialize the database
  initializeDatabase(compassUri).then(() => {
    rl.close();
  }).catch(err => {
    log(`FATAL ERROR: ${err.message}`);
    log(`${err.stack}`);
    rl.close();
  });
});

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function initializeDatabase(uri) {
  log('Initializing database...');
  const client = new MongoClient(uri);
  
  try {
    log('Attempting to connect to MongoDB Atlas...');
    await client.connect();
    log('Connected successfully to MongoDB Atlas!');
    
    // Extract database name from URI or use default
    let dbName = 'work-diary';
    if (uri.includes('/')) {
      const uriParts = uri.split('/');
      if (uriParts.length > 3) {
        dbName = uriParts[3].split('?')[0];
      }
    }
    
    const db = client.db(dbName);
    log(`Using database: ${dbName}`);
    
    // Drop existing collections
    log('Dropping existing collections (if any)...');
    try {
      const collections = await db.listCollections().toArray();
      for (const collection of collections) {
        await db.collection(collection.name).drop();
        log(`Dropped collection: ${collection.name}`);
      }
    } catch (err) {
      log(`Note on collection dropping: ${err.message}`);
    }
    
    // Insert sample users
    log('Creating sample users...');
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
    
    // Create a map of email to ID for referencing
    const userMap = {};
    users.forEach(user => {
      userMap[user.email] = user._id;
    });
    
    // Create work diary entries
    log('Creating work diary entries...');
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
    
    // Create timetables
    log('Creating timetables...');
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
    
    log('Database initialization completed successfully!');
    log('You can now check your data in MongoDB Atlas');
    
  } catch (err) {
    log(`ERROR: ${err.message}`);
    log(`${err.stack}`);
  } finally {
    await client.close();
    log('Connection closed');
  }
} 