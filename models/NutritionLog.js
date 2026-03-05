const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IndianFood',
    },
    foodName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['g', 'ml', 'cup', 'tbsp', 'tsp', 'piece', 'bowl', 'plate', 'serving'],
      default: 'g',
    },
    calories: { type: Number, min: 0, default: 0 },
    protein: { type: Number, min: 0, default: 0 },  // in grams
    carbs: { type: Number, min: 0, default: 0 },    // in grams
    fat: { type: Number, min: 0, default: 0 },      // in grams
    fiber: { type: Number, min: 0, default: 0 },    // in grams
  },
  { _id: false }
);

const nutritionLogSchema = new mongoose.Schema(
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
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'],
      required: [true, 'Meal type is required'],
    },
    foods: [foodItemSchema],
    totalCalories: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalProtein: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalCarbs: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalFat: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalFiber: {
      type: Number,
      min: 0,
      default: 0,
    },
    waterIntake: {
      type: Number, // in ml
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

// Auto-calculate totals before save
nutritionLogSchema.pre('save', function (next) {
  if (this.foods && this.foods.length > 0) {
    this.totalCalories = this.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
    this.totalProtein = this.foods.reduce((sum, f) => sum + (f.protein || 0), 0);
    this.totalCarbs = this.foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
    this.totalFat = this.foods.reduce((sum, f) => sum + (f.fat || 0), 0);
    this.totalFiber = this.foods.reduce((sum, f) => sum + (f.fiber || 0), 0);
  }
  next();
});

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);
