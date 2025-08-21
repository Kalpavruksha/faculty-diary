import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/db';
import WorkDiaryEntry from '../../../models/WorkDiaryEntry';
import User from '../../../models/User';
import { sendEmail } from '../../../lib/email';

// JWT secret from env
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend request type to include user info
interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Authentication middleware
const authenticate = async (req: AuthenticatedRequest, res: NextApiResponse): Promise<boolean> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Check if token is in cookies instead
      const token = req.cookies?.token;
      
      if (!token) {
        res.status(401).json({ error: 'No authentication token provided' });
        return false;
      }
      
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
      req.user = decoded;
      return true;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.user = decoded;
    return true;
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return false;
  }
};

export default async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  // Alternative authentication - check if we have a user in the session
  // This is for compatibility with both custom JWT and Next Auth approaches
  let userInfo: { id?: string; email?: string; name?: string; role?: string } = {};
  
  try {
    // Extract authentication info from the request
    const authHeader = req.headers.authorization;
    const cookies = req.cookies;
    
    // Try to get user from authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      userInfo = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    } 
    // Try to get user from cookie token
    else if (cookies?.token) {
      userInfo = jwt.verify(cookies.token, JWT_SECRET) as { id: string; email: string; role: string };
    } 
    // Try to get user from request body
    else if (req.body?.email) {
      await dbConnect();
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        userInfo = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    }
    
    // If we still don't have user info, return unauthorized
    if (!userInfo.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Connect to database
    await dbConnect();
    
    switch (req.method) {
      case 'POST':
        try {
          const { date, activities, task, hours, totalStudents, present, absent } = req.body;
          
          // Get user from database using email
          const user = await User.findOne({ email: userInfo.email });
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }
          
          // Create the work diary entry with explicitly lowercase status
          const entry = await WorkDiaryEntry.create({
            user: user._id,
            date,
            activities,
            task,
            hours,
            totalStudents: parseInt(totalStudents),
            presentStudents: parseInt(present),
            absentStudents: parseInt(absent),
            status: 'pending' // Always use lowercase for new entries
          });
          
          // Send email notification
          try {
            await sendEmail({
              to: user.email,
              subject: 'Work Diary Entry Submitted',
              html: `
                <h1>Work Diary Entry Submitted</h1>
                <p>Dear ${user.name},</p>
                <p>Your work diary entry for ${new Date(date).toLocaleDateString()} has been submitted.</p>
                <p>Task: ${task}</p>
                <p>Total Students: ${totalStudents}</p>
                <p>Present: ${present}</p>
                <p>Absent: ${absent}</p>
                <p>Status: pending</p>
              `,
            });
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // Continue even if email sending fails
          }
          
          res.status(201).json({
            success: true,
            data: entry
          });
        } catch (error: any) {
          console.error('Error creating work diary entry:', error);
          res.status(400).json({ 
            success: false,
            error: error.message || 'Failed to create work diary entry'
          });
        }
        break;
        
      case 'GET':
        try {
          // Get user from database using email
          const user = await User.findOne({ email: userInfo.email });
          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }
          
          const entries = await WorkDiaryEntry.find({ user: user._id })
            .sort({ date: -1 });
            
          res.status(200).json({
            success: true,
            count: entries.length,
            data: entries
          });
        } catch (error: any) {
          res.status(400).json({ 
            success: false,
            error: error.message || 'Failed to fetch work diary entries'
          });
        }
        break;
        
      default:
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Work diary API error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 