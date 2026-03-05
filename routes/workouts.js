const express = require('express');
const router = express.Router();
const WorkoutLog = require('../models/WorkoutLog');
const PersonalRecord = require('../models/PersonalRecord');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// @route   POST /api/workouts
// @desc    Log a new workout
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, date, exercises, totalDuration, caloriesBurned, workoutType, intensity, notes } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Workout title is required.',
      });
    }

    const workout = await WorkoutLog.create({
      user: req.user._id,
      title,
      date: date || Date.now(),
      exercises: exercises || [],
      totalDuration: totalDuration || 0,
      caloriesBurned: caloriesBurned || 0,
      workoutType: workoutType || 'strength',
      intensity: intensity || 'moderate',
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Workout logged successfully.',
      workout,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to log workout: ' + err.message,
    });
  }
});

// @route   GET /api/workouts
// @desc    Get all workouts for the current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, workoutType, startDate, endDate } = req.query;

    const filter = { user: req.user._id };
    if (workoutType) filter.workoutType = workoutType;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await WorkoutLog.countDocuments(filter);
    const workouts = await WorkoutLog.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      workouts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workouts: ' + err.message,
    });
  }
});

// @route   GET /api/workouts/:id
// @desc    Get a single workout by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const workout = await WorkoutLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found.',
      });
    }
    res.status(200).json({ success: true, workout });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout: ' + err.message,
    });
  }
});

// @route   PUT /api/workouts/:id
// @desc    Update a workout
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const workout = await WorkoutLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found.',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Workout updated successfully.',
      workout,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update workout: ' + err.message,
    });
  }
});

// @route   DELETE /api/workouts/:id
// @desc    Delete a workout
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const workout = await WorkoutLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found.',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Workout deleted successfully.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete workout: ' + err.message,
    });
  }
});

// @route   GET /api/workouts/stats/summary
// @desc    Get workout statistics summary for the user
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await WorkoutLog.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: '$totalDuration' },
          totalCaloriesBurned: { $sum: '$caloriesBurned' },
          avgDuration: { $avg: '$totalDuration' },
          avgCaloriesBurned: { $avg: '$caloriesBurned' },
        },
      },
    ]);

    const workoutsByType = await WorkoutLog.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$workoutType',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      period: `${period} days`,
      summary: stats[0] || {
        totalWorkouts: 0,
        totalDuration: 0,
        totalCaloriesBurned: 0,
        avgDuration: 0,
        avgCaloriesBurned: 0,
      },
      byType: workoutsByType,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats: ' + err.message,
    });
  }
});

// @route   POST /api/workouts/personal-records
// @desc    Add a personal record
// @access  Private
router.post('/personal-records', async (req, res) => {
  try {
    const { exerciseName, exercise, recordType, value, unit, previousValue, date, workoutLog, notes } = req.body;

    if (!exerciseName || !recordType || value === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: 'exerciseName, recordType, value, and unit are required.',
      });
    }

    const pr = await PersonalRecord.create({
      user: req.user._id,
      exerciseName,
      exercise,
      recordType,
      value,
      unit,
      previousValue,
      date: date || Date.now(),
      workoutLog,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Personal record saved.',
      personalRecord: pr,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to save personal record: ' + err.message,
    });
  }
});

// @route   GET /api/workouts/personal-records
// @desc    Get all personal records for the user
// @access  Private
router.get('/personal-records', async (req, res) => {
  try {
    const records = await PersonalRecord.find({ user: req.user._id }).sort({ date: -1 });
    res.status(200).json({
      success: true,
      count: records.length,
      personalRecords: records,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch personal records: ' + err.message,
    });
  }
});

module.exports = router;
