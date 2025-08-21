import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkDiary extends Document {
  facultyId: mongoose.Types.ObjectId;
  date: Date;
  tasksDone: string;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  status: 'pending' | 'approved' | 'rejected';
  department: string;
}

const workDiarySchema = new Schema<IWorkDiary>({
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  tasksDone: {
    type: String,
    required: true,
  },
  totalStudents: {
    type: Number,
    required: true,
  },
  presentStudents: {
    type: Number,
    required: true,
  },
  absentStudents: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  department: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export const WorkDiary = mongoose.models.WorkDiary || mongoose.model<IWorkDiary>('WorkDiary', workDiarySchema); 