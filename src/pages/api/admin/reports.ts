import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import WorkDiaryEntry from '../../../models/WorkDiaryEntry';
import User from '../../../models/User';
import { sendEmail } from '../../../lib/email';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let userInfo: { id?: string; email?: string; name?: string; role?: string } = {};
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
    // Try request body as last resort
    else if (req.body?.email) {
      isAuthenticated = true;
      userInfo.email = req.body.email;
      console.log('Using email from request body:', userInfo.email);
    }

    // If still not authenticated
    if (!isAuthenticated || !userInfo.email) {
      console.error('Authentication failed - no valid credentials');
      return res.status(401).json({ error: 'Authentication required' });
    }

    await dbConnect();

    // Check if user is admin
    const user = await User.findOne({ email: userInfo.email });
    if (!user) {
      console.error('User not found:', userInfo.email);
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.role !== 'admin') {
      console.error('User is not an admin:', userInfo.email);
      return res.status(403).json({ error: 'Not authorized' });
    }

    switch (req.method) {
      case 'GET':
        try {
          console.log('Admin fetching reports:', userInfo.email);
          const { date, department } = req.query;
          const query: any = {};

          if (date) {
            const startDate = new Date(date as string);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date as string);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
          }

          // Get all faculty members
          const faculty = await User.find({ role: 'faculty' });
          const facultyIds = faculty.map(f => f._id);

          // Get work diary entries
          const entries = await WorkDiaryEntry.find({
            ...query,
            user: { $in: facultyIds },
          }).populate('user', 'name email department');

          // Group by department
          const reportsByDepartment = entries.reduce((acc: any, entry: any) => {
            const dept = entry.user.department || 'Uncategorized';
            if (!acc[dept]) {
              acc[dept] = [];
            }
            acc[dept].push(entry);
            return acc;
          }, {});

          res.status(200).json(reportsByDepartment);
        } catch (error: any) {
          console.error('Error fetching reports:', error);
          res.status(500).json({ error: error.message });
        }
        break;

      case 'PUT':
        try {
          const { entryId, status, resend } = req.body;

          // Find the entry but don't modify it yet
          const entry = await WorkDiaryEntry.findById(entryId);
          if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
          }

          // Only update the status field, preserving all other fields
          const result = await WorkDiaryEntry.findByIdAndUpdate(
            entryId,
            { status: status.toLowerCase() }, // Ensure lowercase status
            { 
              new: true, // Return the updated document
              runValidators: true // Run validators on update
            }
          );

          if (!result) {
            return res.status(404).json({ error: 'Failed to update entry' });
          }

          // Send email notification
          const faculty = await User.findById(entry.user);
          if (faculty) {
            let emailSubject = `Work Diary Entry ${status.charAt(0).toUpperCase() + status.slice(1)}`;
            let emailContent = `
              <h1>Work Diary Entry ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
              <p>Your work diary entry for ${new Date(entry.date).toLocaleDateString()} has been ${status}.</p>
            `;

            if (resend) {
              emailSubject = 'Work Diary Entry Update Required';
              emailContent = `
                <h1>Work Diary Entry Update Required</h1>
                <p>Dear ${faculty.name},</p>
                <p>Your work diary entry for ${new Date(entry.date).toLocaleDateString()} requires updates.</p>
                <p>Please log in to your account and make the necessary changes.</p>
              `;
            }

            await sendEmail({
              to: faculty.email,
              subject: emailSubject,
              html: emailContent,
            });
          }

          res.status(200).json({
            success: true,
            data: result
          });
        } catch (error: any) {
          console.error('Error updating entry status:', error);
          res.status(500).json({ error: error.message });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Admin reports API error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 