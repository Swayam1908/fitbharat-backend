const mongoose = require('mongoose');

const setSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    reps: { type: Number, min: 0 },
    weight: { type: Number, min: 0 }, // in kg
    duration: { type: Number, min: 0 }, // in seconds, for time-based exercises
    restTime: { type: Number, min: 0 }, // in seconds
  },
  { _id: false }
);

const workoutExerciseSchema = new mongoose.Schema(
  {
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
    },
    exerciseName: {
      type: String,
      required: true,
    },
    sets: [setSchema],
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const workoutLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Workout title is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Workout date is required'],
      default: Date.now,
    },
    exercises: [workoutExerciseSchema],
    totalDuration: {
      type: Number, // in minutes
      min: 0,
      default: 0,
    },
    caloriesBurned: {
      type: Number,
      min: 0,
      default: 0,
    },
    workoutType: {
      type: String,
      enum: ['strength', 'cardio', 'hiit', 'yoga', 'flexibility', 'sports', 'other'],
      default: 'strength',
    },
    intensity: {
      type: String,
      enum: ['low', 'moderate', 'high', 'extreme'],
      default: 'moderate',
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

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
