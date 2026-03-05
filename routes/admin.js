const express = require('express');
const router = express.Router();
const User = require('../models/User');
const WorkoutLog = require('../models/WorkoutLog');
const NutritionLog = require('../models/NutritionLog');
const SleepLog = require('../models/SleepLog');
const Exercise = require('../models/Exercise');
const IndianFood = require('../models/IndianFood');
const PersonalRecord = require('../models/PersonalRecord');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// All routes require authentication + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// @route   GET /api/admin/stats
// @desc    Get global app statistics
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalWorkouts,
      totalNutritionLogs,
      totalSleepLogs,
      totalExercises,
      totalFoods,
      newUsersThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      WorkoutLog.countDocuments(),
      NutritionLog.countDocuments(),
      SleepLog.countDocuments(),
      Exercise.countDocuments(),
      IndianFood.countDocuments(),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ]);

    const workoutsByType = await WorkoutLog.aggregate([
      { $group: { _id: '$workoutType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const usersByGoal = await User.aggregate([
      { $match: { fitnessGoal: { $ne: null } } },
      { $group: { _id: '$fitnessGoal', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: { total: totalUsers, active: activeUsers, newThisMonth: newUsersThisMonth },
        content: {
          workoutLogs: totalWorkouts,
          nutritionLogs: totalNutritionLogs,
          sleepLogs: totalSleepLogs,
          exercises: totalExercises,
          indianFoods: totalFoods,
        },
        analytics: {
          workoutsByType,
          usersByGoal,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats: ' + err.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users: ' + err.message });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get a specific user's details
// @access  Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const [workoutCount, nutritionCount, sleepCount, prCount] = await Promise.all([
      WorkoutLog.countDocuments({ user: req.params.id }),
      NutritionLog.countDocuments({ user: req.params.id }),
      SleepLog.countDocuments({ user: req.params.id }),
      PersonalRecord.countDocuments({ user: req.params.id }),
    ]);

    res.status(200).json({
      success: true,
      user,
      activity: {
        workoutLogs: workoutCount,
        nutritionLogs: nutritionCount,
        sleepLogs: sleepCount,
        personalRecords: prCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user: ' + err.message });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update a user (admin can update role, isActive, etc.)
// @access  Admin
router.put('/users/:id', async (req, res) => {
  try {
    const allowedUpdates = ['name', 'role', 'isActive', 'age', 'gender', 'height', 'weight', 'fitnessGoal', 'activityLevel'];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user: ' + err.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Permanently delete a user and all their data
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Delete all user data
    await Promise.all([
      WorkoutLog.deleteMany({ user: req.params.id }),
      NutritionLog.deleteMany({ user: req.params.id }),
      SleepLog.deleteMany({ user: req.params.id }),
      PersonalRecord.deleteMany({ user: req.params.id }),
      User.findByIdAndDelete(req.params.id),
    ]);

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete user: ' + err.message });
  }
});

// @route   PUT /api/admin/users/:id/toggle-status
// @desc    Toggle user active/inactive status
// @access  Admin
router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      isActive: user.isActive,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle user status: ' + err.message });
  }
});

// @route   GET /api/admin/foods
// @desc    Get all Indian foods with pagination (admin view)
// @access  Admin
router.get('/foods', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await IndianFood.countDocuments(filter);
    const foods = await IndianFood.find(filter).sort({ name: 1 }).skip(skip).limit(parseInt(limit));

    res.status(200).json({ success: true, total, foods });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch foods: ' + err.message });
  }
});

// @route   POST /api/admin/foods
// @desc    Add a new Indian food
// @access  Admin
router.post('/foods', async (req, res) => {
  try {
    const food = await IndianFood.create(req.body);
    res.status(201).json({ success: true, message: 'Food added.', food });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Food with this name already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to add food: ' + err.message });
  }
});

// @route   PUT /api/admin/foods/:id
// @desc    Update an Indian food entry
// @access  Admin
router.put('/foods/:id', async (req, res) => {
  try {
    const food = await IndianFood.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!food) return res.status(404).json({ success: false, message: 'Food not found.' });
    res.status(200).json({ success: true, message: 'Food updated.', food });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update food: ' + err.message });
  }
});

// @route   DELETE /api/admin/foods/:id
// @desc    Delete an Indian food entry
// @access  Admin
router.delete('/foods/:id', async (req, res) => {
  try {
    const food = await IndianFood.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: 'Food not found.' });
    res.status(200).json({ success: true, message: 'Food deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete food: ' + err.message });
  }
});

module.exports = router;
