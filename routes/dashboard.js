const express = require('express');
const router = express.Router();
const WorkoutLog = require('../models/WorkoutLog');
const NutritionLog = require('../models/NutritionLog');
const SleepLog = require('../models/SleepLog');
const PersonalRecord = require('../models/PersonalRecord');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/dashboard
// @desc    Get a comprehensive overview dashboard for the current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Run all queries in parallel
    const [
      user,
      todayWorkouts,
      todayNutrition,
      recentSleep,
      last30DaysWorkoutStats,
      last7DaysCalories,
      recentPRs,
      weeklyWorkoutCount,
    ] = await Promise.all([
      User.findById(userId),

      // Today's workouts
      WorkoutLog.find({
        user: userId,
        date: { $gte: startOfToday, $lte: endOfToday },
      }),

      // Today's nutrition
      NutritionLog.find({
        user: userId,
        date: { $gte: startOfToday, $lte: endOfToday },
      }),

      // Most recent sleep log
      SleepLog.findOne({ user: userId }).sort({ date: -1 }),

      // Last 30 days workout aggregate
      WorkoutLog.aggregate([
        { $match: { user: userId, date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            totalWorkouts: { $sum: 1 },
            totalDuration: { $sum: '$totalDuration' },
            totalCaloriesBurned: { $sum: '$caloriesBurned' },
          },
        },
      ]),

      // Last 7 days daily calorie intake
      NutritionLog.aggregate([
        { $match: { user: userId, date: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$date' },
            },
            dailyCalories: { $sum: '$totalCalories' },
            dailyProtein: { $sum: '$totalProtein' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Recent personal records
      PersonalRecord.find({ user: userId }).sort({ date: -1 }).limit(5),

      // This week's workout count
      WorkoutLog.countDocuments({
        user: userId,
        date: { $gte: sevenDaysAgo },
      }),
    ]);

    // BMI calculation
    let bmi = null;
    if (user.height && user.weight) {
      const hm = user.height / 100;
      bmi = parseFloat((user.weight / (hm * hm)).toFixed(2));
    }

    // Today's nutrition totals
    const todayNutritionTotals = todayNutrition.reduce(
      (acc, log) => {
        acc.calories += log.totalCalories || 0;
        acc.protein += log.totalProtein || 0;
        acc.carbs += log.totalCarbs || 0;
        acc.fat += log.totalFat || 0;
        acc.water += log.waterIntake || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }
    );

    // Today's workout totals
    const todayWorkoutTotals = {
      sessions: todayWorkouts.length,
      totalDuration: todayWorkouts.reduce((s, w) => s + (w.totalDuration || 0), 0),
      totalCaloriesBurned: todayWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0),
    };

    res.status(200).json({
      success: true,
      dashboard: {
        user: {
          name: user.name,
          email: user.email,
          height: user.height,
          weight: user.weight,
          fitnessGoal: user.fitnessGoal,
          activityLevel: user.activityLevel,
          bmi,
        },
        today: {
          date: today.toISOString().split('T')[0],
          workout: todayWorkoutTotals,
          nutrition: todayNutritionTotals,
          sleep: recentSleep
            ? {
                duration: recentSleep.duration,
                quality: recentSleep.quality,
                date: recentSleep.date,
              }
            : null,
        },
        weekly: {
          workoutCount: weeklyWorkoutCount,
          caloriesByDay: last7DaysCalories,
        },
        monthly: last30DaysWorkoutStats[0] || {
          totalWorkouts: 0,
          totalDuration: 0,
          totalCaloriesBurned: 0,
        },
        recentPersonalRecords: recentPRs,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard: ' + err.message,
    });
  }
});

// @route   GET /api/dashboard/progress
// @desc    Get progress chart data over a period
// @access  Private
router.get('/progress', async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [workoutProgress, nutritionProgress, sleepProgress] = await Promise.all([
      WorkoutLog.aggregate([
        { $match: { user: userId, date: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            sessions: { $sum: 1 },
            totalDuration: { $sum: '$totalDuration' },
            totalCaloriesBurned: { $sum: '$caloriesBurned' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      NutritionLog.aggregate([
        { $match: { user: userId, date: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            totalCalories: { $sum: '$totalCalories' },
            totalProtein: { $sum: '$totalProtein' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      SleepLog.aggregate([
        { $match: { user: userId, date: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            avgDuration: { $avg: '$duration' },
            avgQualityScore: { $avg: '$qualityScore' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      period: `${period} days`,
      progress: {
        workouts: workoutProgress,
        nutrition: nutritionProgress,
        sleep: sleepProgress,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to load progress data: ' + err.message,
    });
  }
});

module.exports = router;
