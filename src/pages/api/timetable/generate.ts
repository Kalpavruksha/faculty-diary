import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Timetable from '../../../models/Timetable';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
];

// Computer Science focused subjects
const CS_SUBJECTS = [
  'Java Programming',
  'SQL Database',
  'DBMS',
  'Data Structures',
  'Algorithms (ADA)',
  'Operating Systems',
  'Computer Networks',
  'Web Technologies',
  'Python Programming',
  'Software Engineering',
  'Discrete Mathematics',
  'Computer Organization',
  'Cloud Computing',
  'Machine Learning',
  'Cyber Security',
  'Mobile Application Development',
  'Computer Graphics',
];

// Other department subjects
const OTHER_SUBJECTS = [
  'Digital Electronics',
  'Structural Analysis',
  'Thermodynamics',
  'Power Systems',
  'Fluid Mechanics',
  'Microprocessors',
  'Machine Design',
  'Control Systems',
  'Industrial Engineering',
  'Biomedical Engineering',
  'Chemical Process Design',
  'Environmental Engineering',
];

const DEPARTMENTS = [
  'Computer Science',
  'Electronics',
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Information Technology',
  'Chemical Engineering',
  'Biotechnology',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let userInfo: { id?: string; email?: string; role?: string } = {};
  let isAuthenticated = false;

  try {
    // Extract authentication info from the request
    const authHeader = req.headers.authorization;
    const cookies = req.cookies;
    
    // Try to get user from authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        userInfo = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
        isAuthenticated = true;
        console.log('User authenticated via Bearer token:', userInfo.email);
      } catch (tokenError) {
        console.error('Token verification failed:', tokenError);
      }
    } 
    // Try to get user from cookie token
    else if (cookies?.token) {
      try {
        userInfo = jwt.verify(cookies.token, JWT_SECRET) as { id: string; email: string; role: string };
        isAuthenticated = true;
        console.log('User authenticated via cookie token:', userInfo.email);
      } catch (cookieError) {
        console.error('Cookie token verification failed:', cookieError);
      }
    }
    // Allow public access for demo purposes (if needed)
    else if (req.body?.generateForDemo === true) {
      isAuthenticated = true;
      console.log('Generating timetables for demo');
    }

    // If not authenticated
    if (!isAuthenticated && !req.body?.generateForDemo) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await dbConnect();

    // Skip admin check for demo generation
    if (!req.body?.generateForDemo && userInfo.email) {
      // Check if user is admin
      const user = await User.findOne({ email: userInfo.email });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized - admin access required' });
      }
    }

    try {
      // Get all faculty members
      const faculty = await User.find({ role: 'faculty' });
      
      if (faculty.length === 0) {
        return res.status(404).json({ error: 'No faculty members found to generate timetables for' });
      }

      console.log(`Generating timetables for ${faculty.length} faculty members`);

      // Shuffle subjects to ensure diversity in the assignments
      const shuffledCSSubjects = [...CS_SUBJECTS].sort(() => 0.5 - Math.random());
      const shuffledOtherSubjects = [...OTHER_SUBJECTS].sort(() => 0.5 - Math.random());
      
      // Track used subject-timeslot combinations to avoid duplicates
      const usedCombinations = new Set();
      
      // Generate timetables for each faculty member
      for (const member of faculty) {
        // Clear existing timetable
        await Timetable.deleteMany({ faculty: member._id });
        
        // Determine if this faculty is computer science based on department
        const isComputerScience = member.department === 'Computer Science' || member.department === 'Information Technology';
        const primarySubjects = isComputerScience ? shuffledCSSubjects : shuffledOtherSubjects;
        const secondarySubjects = isComputerScience ? shuffledOtherSubjects : shuffledCSSubjects;
        
        // Assign 2-3 unique subjects to this faculty member from their primary area
        const facultySubjects = [];
        const numPrimarySubjects = Math.min(Math.floor(Math.random() * 3) + 2, primarySubjects.length);
        
        for (let i = 0; i < numPrimarySubjects; i++) {
          facultySubjects.push(primarySubjects[i % primarySubjects.length]);
        }
        
        // Add 1-2 subjects from secondary area
        const numSecondarySubjects = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numSecondarySubjects; i++) {
          facultySubjects.push(secondarySubjects[i % secondarySubjects.length]);
        }

        // Generate new timetable
        for (const day of DAYS) {
          // Generate 2-3 classes per day
          const numClasses = Math.floor(Math.random() * 2) + 2;
          const selectedSlots = [...TIME_SLOTS]
            .sort(() => 0.5 - Math.random())
            .slice(0, numClasses);

          for (const slot of selectedSlots) {
            // Make sure this combination is unique
            let subject;
            let room;
            let combination;
            let attempts = 0;
            
            do {
              subject = facultySubjects[Math.floor(Math.random() * facultySubjects.length)];
              room = `Room ${Math.floor(Math.random() * 10) + 101}`;
              combination = `${day}-${slot.start}-${room}-${subject}`;
              attempts++;
            } while (usedCombinations.has(combination) && attempts < 10);
            
            // If we can't find a unique combination after 10 tries, just use the last one
            usedCombinations.add(combination);
            
            await Timetable.create({
              faculty: member._id,
              day,
              startTime: slot.start,
              endTime: slot.end,
              subject,
              room,
              department: member.department || DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
              semester: Math.floor(Math.random() * 8) + 1,
            });
          }
        }
      }

      res.status(200).json({ 
        success: true,
        message: 'Timetables generated successfully',
        facultyCount: faculty.length
      });
    } catch (error: any) {
      console.error('Error generating timetables:', error);
      res.status(500).json({ error: error.message });
    }
  } catch (error: any) {
    console.error('Timetable generation API error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 