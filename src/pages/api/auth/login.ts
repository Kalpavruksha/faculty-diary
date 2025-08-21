import { NextApiRequest, NextApiResponse } from 'next';
import { sign } from 'jsonwebtoken';
import User from '../../../models/User';
import dbConnect from '../../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Connect to the database
    console.log('Connecting to database for login...');
    try {
      await dbConnect();
      console.log('Database connected for login');
    } catch (dbError: any) {
      console.error('Database connection error during login:', dbError);
      return res.status(500).json({ 
        error: 'Failed to connect to database. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    console.log(`Attempting login for user: ${email}`);
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: User ${email} not found`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      console.log(`Login failed: Invalid password for ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log(`Login successful for user: ${email}, role: ${user.role}`);
    const token = sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Authentication failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
} 