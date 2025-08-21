import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/db';
import Timetable from '../../../models/Timetable';
import mongoose from 'mongoose';

// JWT secret from env
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await dbConnect();

    // Get user ID from query or token
    let userId = req.query.userId as string;
    
    // If no userId in query, try to get from authorization header
    if (!userId) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
          userId = decoded.id;
        } catch (tokenError) {
          console.error('Token verification failed:', tokenError);
          return res.status(401).json({ error: 'Invalid or expired token' });
        }
      }
    }
    
    // If still no userId, return error
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate userId as a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Fetch timetable entries for the user
    const timetableEntries = await Timetable.find({ faculty: userId })
      .sort({ day: 1, startTime: 1 })
      .lean();

    // Return timetable entries
    res.status(200).json({
      success: true,
      data: timetableEntries
    });
  } catch (error: any) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ 
      error: 'Failed to fetch timetable',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
} 