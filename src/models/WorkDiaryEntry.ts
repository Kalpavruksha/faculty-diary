import mongoose from 'mongoose';

const workDiaryEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  activities: {
    type: String,
    required: true,
  },
  task: {
    type: String,
    required: true,
  },
  hours: {
    type: Number,
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
}, {
  timestamps: true,
});

workDiaryEntrySchema.pre('save', function(next) {
  if (this.status) {
    // @ts-ignore - We know this is safe as we're just converting to lowercase
    this.status = this.status.toLowerCase();
  }
  next();
});

export default mongoose.models.WorkDiaryEntry || mongoose.model('WorkDiaryEntry', workDiaryEntrySchema); 