const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
      unique: true,
    },
    category: {
      type: String,
      enum: [
        'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio',
        'full_body', 'yoga', 'flexibility', 'sports', 'other',
      ],
      required: [true, 'Category is required'],
    },
    muscleGroups: {
      type: [String],
      default: [],
    },
    equipment: {
      type: String,
      enum: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands', 'kettlebell', 'other', 'none'],
      default: 'none',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    type: {
      type: String,
      enum: ['strength', 'cardio', 'flexibility', 'balance'],
      default: 'strength',
    },
    description: {
      type: String,
      default: '',
    },
    instructions: {
      type: [String],
      default: [],
    },
    caloriesPerMinute: {
      type: Number,
      min: 0,
      default: 5,
    },
    videoUrl: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isIndian: {
      type: Boolean,
      default: false, // flag for traditional Indian exercises like Surya Namaskar
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Exercise', exerciseSchema);
