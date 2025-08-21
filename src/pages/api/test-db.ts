import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Testing database connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 20)}...` : 'Not defined');
    
    await dbConnect();
    
    // Check connection state
    const connectionState = mongoose.connection.readyState;
    const stateLabels = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized'
    };
    
    console.log(`MongoDB connection state: ${stateLabels[connectionState as keyof typeof stateLabels]}`);
    
    // Prepare response data
    const responseData: any = { 
      status: 'success', 
      connection: stateLabels[connectionState as keyof typeof stateLabels],
    };
    
    // Only try to list databases if we're connected
    if (connectionState === 1 && mongoose.connection.db) {
      try {
        responseData.databases = (await mongoose.connection.db.admin().listDatabases()).databases.map(db => db.name);
      } catch (dbListError) {
        console.error('Error listing databases:', dbListError);
        responseData.databasesError = 'Failed to list databases';
      }
    }
    
    res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 