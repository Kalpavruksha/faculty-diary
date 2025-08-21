import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  // Get email credentials from environment variables
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  if (!emailUser || !emailPassword) {
    console.warn('Email sending skipped - missing email credentials');
    return;
  }
  
  console.log(`Sending email to ${to} with subject "${subject}"`);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

  const mailOptions = {
    from: emailUser,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export const sendWorkDiaryConfirmation = async (to: string, facultyName: string, date: string) => {
  const subject = 'Work Diary Entry Confirmation';
  const html = `
    <h1>Work Diary Entry Confirmation</h1>
    <p>Dear ${facultyName},</p>
    <p>Your work diary entry for ${date} has been successfully submitted.</p>
    <p>Thank you for your contribution.</p>
  `;

  return sendEmail({ to, subject, html });
};

export const sendPasswordResetEmail = async (to: string, resetToken: string) => {
  const subject = 'Password Reset Request';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const html = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${appUrl}/reset-password?token=${resetToken}">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  return sendEmail({ to, subject, html });
}; 