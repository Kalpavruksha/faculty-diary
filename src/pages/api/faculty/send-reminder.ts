import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { sendSMS, sendNotification } from '../../../lib/twilio';
import Timetable from '../../../models/Timetable';
import User from '../../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { classId, notificationType = 'sms' } = req.body;
    const facultyPhone = process.env.FACULTY_PHONE; // Get from env
    
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }
    
    if (!facultyPhone) {
      return res.status(400).json({ error: 'Faculty phone number is not configured' });
    }
    
    // Get the class details
    const classDetails = await Timetable.findById(classId).populate('faculty', 'name email');
    if (!classDetails) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Format date for the message
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Create reminder message
    const message = `You have a ${classDetails.subject} class on ${formattedDate} at ${classDetails.startTime} in ${classDetails.room}.`;
    
    // Send notification based on type
    const result = await sendNotification(
      facultyPhone, 
      message, 
      notificationType as 'sms' | 'call' | 'both',
      'Class Reminder'
    );
    
    if (notificationType === 'sms' && result.sms && !result.sms.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to send SMS reminder',
        details: result.sms.errorMessage || 'Unknown error'
      });
    }
    
    if (notificationType === 'call' && result.call && !result.call.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to make reminder call',
        details: result.call.errorMessage || 'Unknown error'
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Class reminder sent successfully',
      details: {
        to: facultyPhone,
        class: classDetails.subject,
        time: classDetails.startTime,
        room: classDetails.room,
        method: notificationType,
        result
      }
    });
  } catch (error: any) {
    console.error('Failed to send class reminder:', error);
    res.status(500).json({ 
      error: 'Failed to send class reminder',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 