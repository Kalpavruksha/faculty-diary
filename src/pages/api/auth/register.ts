import { NextApiRequest, NextApiResponse } from 'next';
import User from '../../../models/User';
import { sendEmail } from '../../../lib/email';
import dbConnect from '../../../lib/db';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate input data
    const { name, email, password } = req.body;
    let { department, role } = req.body;
    
    if (!name || !email || !password) {
      console.error('Registration validation failed: Missing required fields');
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Only require department for faculty role
    if (role === 'faculty' && !department) {
      console.error('Registration validation failed: Department required for faculty');
      return res.status(400).json({ error: 'Department is required for faculty members' });
    }
    
    // Set default department for admin
    if (role === 'admin' && !department) {
      department = 'Administration';
    }
    
    if (password.length < 6) {
      console.error('Registration validation failed: Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Connect to database first
    console.log('Attempting to connect to database for registration...');
    
    try {
      await dbConnect();
      console.log('Database connected for registration');
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ 
        error: 'Failed to connect to database', 
        details: dbError.message 
      });
    }
    
    // Check MongoDB connection state after connecting
    const connectionState = mongoose.connection.readyState;
    if (connectionState !== 1) {
      console.error(`MongoDB connection not ready. State: ${connectionState}`);
      return res.status(500).json({ error: 'Database connection not ready' });
    }
    
    console.log(`Processing registration for ${email} with role ${role}`);

    // Check if user already exists
    console.log(`Checking if user ${email} already exists...`);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User ${email} already exists`);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Restrict admin registration to only one admin
    let adminWarning = null;
    let originalRole = role;
    
    if (role === 'admin') {
      try {
        console.log('Admin registration requested, checking if admin already exists...');
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
          console.log('Admin already exists, converting role to faculty');
          adminWarning = 'An admin already exists. Your account has been created as faculty instead.';
          role = 'faculty'; // Change role to faculty instead of blocking registration
          
          // If we changed to faculty, but no department was provided, set a default
          if (!department || department === 'Administration') {
            department = 'Computer Science'; // Default department
            adminWarning += ' You have been assigned to the Computer Science department.';
          }
        }
      } catch (adminCheckError) {
        console.error('Error checking for existing admin:', adminCheckError);
        // Continue with registration as faculty if there's an error
        role = 'faculty';
        department = department || 'Computer Science';
        adminWarning = 'Unable to verify admin status. Your account has been created as faculty.';
      }
    }

    // Create new user with validated data
    console.log(`Creating new user: ${name}, ${email}, role: ${role}, department: ${department}`);
    
    try {
      const user = await User.create({
        name,
        email,
        password,
        department,
        role,
      });
      
      console.log(`User created with ID: ${user._id}`);

      // Try to send welcome email, but don't fail registration if email fails
      try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
          console.log(`Sending welcome email to ${email}...`);
          await sendEmail({
            to: user.email,
            subject: 'Welcome to Work Diary Portal',
            html: `
              <h1>Welcome to Work Diary Portal</h1>
              <p>Dear ${user.name},</p>
              <p>Your account has been successfully created.</p>
              <p>You can now log in to the portal and start submitting your work diary entries.</p>
              ${adminWarning ? `<p><strong>Note:</strong> ${adminWarning}</p>` : ''}
            `,
          });
          console.log(`Welcome email sent to ${email}`);
        } else {
          console.log('Email credentials not found, skipping welcome email');
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Continue with registration even if email fails
      }

      console.log(`Registration successful for ${email}`);
      
      // Return success with clear indication if role was changed
      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department
        },
        warning: adminWarning,
        roleChanged: originalRole !== role
      });
    } catch (userCreationError: any) {
      console.error('Error creating user:', userCreationError);
      
      // Handle specific MongoDB errors
      if (userCreationError.name === 'MongoServerError' && userCreationError.code === 11000) {
        return res.status(400).json({ error: 'Email address is already in use' });
      }
      
      return res.status(500).json({ 
        error: userCreationError.message || 'Failed to create user account',
        type: userCreationError.name
      });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    
    res.status(500).json({ 
      error: 'Registration failed. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 