import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import User from '../../../models/User';
import dbConnect from '../../../lib/db';
import { sendEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Connecting to database for password reset request...');
    await dbConnect();
    console.log('Database connected for password reset request');

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log(`Processing password reset request for email: ${email}`);
    const user = await User.findOne({ email });
    
    // We'll always return success even if the email doesn't exist
    // This prevents user enumeration attacks
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return res.status(200).json({ message: 'If your email exists in our system, you will receive a password reset link shortly' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.headers.origin}`;
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    console.log(`Reset URL generated: ${resetUrl}`);

    // Send email
    try {
      console.log(`Sending password reset email to: ${user.email}`);
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset</h1>
          <p>Dear ${user.name},</p>
          <p>You requested a password reset. Click the button below to reset your password. This link will expire in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #6a3093; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; margin-bottom: 15px;">Reset Password</a>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
        `
      });
      console.log(`Password reset email sent to: ${user.email}`);
    } catch (emailError: any) {
      console.error(`Failed to send password reset email to ${user.email}:`, emailError);
      return res.status(500).json({ error: 'Failed to send password reset email. Please try again later.' });
    }

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    res.status(500).json({ 
      error: 'Failed to process password reset request', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
} 