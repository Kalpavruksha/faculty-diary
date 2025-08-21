import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dbConnect from '../../../lib/db';
import User from '../../../models/User';
import { sendEmail } from '../../../lib/email';

// JWT secret from env
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract email from request body or token
    let userEmail = '';
    
    // Try to get from authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
        userEmail = decoded.email;
      } catch (tokenError) {
        console.error('Token verification failed:', tokenError);
      }
    }
    
    // If not found in header, check request body
    if (!userEmail && req.body.email) {
      userEmail = req.body.email;
    }
    
    // Try to get from cookies as well
    if (!userEmail && req.cookies?.token) {
      try {
        const decoded = jwt.verify(req.cookies.token, JWT_SECRET) as { id: string; email: string; role: string };
        userEmail = decoded.email;
      } catch (cookieError) {
        console.error('Cookie token verification failed:', cookieError);
      }
    }
    
    if (!userEmail) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { currentPassword, newPassword } = req.body;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Connect to the database
    await dbConnect();
    
    // Find the user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    user.password = hashedPassword;
    await user.save();
    
    // Send password change confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Changed Successfully',
        html: `
          <h1>Password Changed</h1>
          <p>Dear ${user.name},</p>
          <p>Your password has been changed successfully.</p>
          <p>If you did not make this change, please contact the administrator immediately.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send password change confirmation email:', emailError);
      // Continue even if email sending fails
    }

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      error: 'Failed to change password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 