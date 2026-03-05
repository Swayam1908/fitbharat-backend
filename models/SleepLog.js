const mongoose = require('mongoose');

const sleepLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    bedtime: {
      type: Date,
      required: [true, 'Bedtime is required'],
    },
    wakeTime: {
      type: Date,
      required: [true, 'Wake time is required'],
    },
    duration: {
      type: Number, // in hours, auto-calculated
      min: 0,
    },
    quality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      required: [true, 'Sleep quality is required'],
    },
    qualityScore: {
      type: Number,
      min: 1,
      max: 10,
    },
    interruptions: {
      type: Number,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate duration before save
sleepLogSchema.pre('save', function (next) {
  if (this.bedtime && this.wakeTime) {
    const durationMs = this.wakeTime.getTime() - this.bedtime.getTime();
    this.duration = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('SleepLog', sleepLogSchema);
