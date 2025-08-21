import { NextApiRequest, NextApiResponse } from 'next';
import User from '../../../models/User';
import dbConnect from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash the password manually since we're directly setting it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Set the hashed password instead of the plain text password
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: true });

    // Send password reset confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Successful',
        html: `
          <h1>Password Reset Successful</h1>
          <p>Dear ${user.name},</p>
          <p>Your password has been reset successfully.</p>
          <p>You can now log in with your new password.</p>
          <p>If you did not request this change, please contact the administrator immediately.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send password reset confirmation email:', emailError);
      // Continue even if email sending fails
    }

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      error: 'Failed to reset password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 