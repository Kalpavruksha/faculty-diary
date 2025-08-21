import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Sending to self for testing
      subject: 'Test Email from Work Diary Portal',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your Work Diary Portal.</p>
        <p>If you're receiving this, your email configuration is working correctly!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Test email sent successfully' });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message });
  }
} 