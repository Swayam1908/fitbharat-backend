const mongoose = require('mongoose');

const indianFoodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      unique: true,
    },
    nameHindi: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'breakfast', 'lunch', 'dinner', 'snack', 'sweets',
        'beverages', 'dal', 'sabzi', 'roti_rice', 'chaat', 'street_food', 'other',
      ],
      required: [true, 'Category is required'],
    },
    region: {
      type: String,
      enum: [
        'north_india', 'south_india', 'east_india', 'west_india',
        'punjabi', 'maharashtrian', 'gujarati', 'rajasthani',
        'bengali', 'tamil', 'kerala', 'hyderabadi', 'pan_india', 'other',
      ],
      default: 'pan_india',
    },
    // Nutritional info per 100g serving
    servingSize: {
      type: Number,
      default: 100, // grams
    },
    calories: {
      type: Number,
      required: [true, 'Calories are required'],
      min: 0,
    },
    protein: {
      type: Number,
      min: 0,
      default: 0,
    },
    carbs: {
      type: Number,
      min: 0,
      default: 0,
    },
    fat: {
      type: Number,
      min: 0,
      default: 0,
    },
    fiber: {
      type: Number,
      min: 0,
      default: 0,
    },
    sugar: {
      type: Number,
      min: 0,
      default: 0,
    },
    sodium: {
      type: Number,
      min: 0,
      default: 0,
    },
    isVegetarian: {
      type: Boolean,
      default: true,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    isGlutenFree: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('IndianFood', indianFoodSchema);
