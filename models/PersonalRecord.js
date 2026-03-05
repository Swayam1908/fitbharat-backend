const mongoose = require('mongoose');

const personalRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
    },
    exerciseName: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
    },
    recordType: {
      type: String,
      enum: ['max_weight', 'max_reps', 'max_duration', 'fastest_time', 'longest_distance'],
      required: [true, 'Record type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Record value is required'],
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'lbs', 'reps', 'seconds', 'minutes', 'km', 'miles'],
      required: [true, 'Unit is required'],
    },
    previousValue: {
      type: Number,
      min: 0,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    workoutLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutLog',
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

module.exports = mongoose.model('PersonalRecord', personalRecordSchema);
