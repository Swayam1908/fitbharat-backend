const express = require('express');
const router = express.Router();
const NutritionLog = require('../models/NutritionLog');
const IndianFood = require('../models/IndianFood');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// @route   POST /api/nutrition
// @desc    Log a meal
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { date, mealType, foods, waterIntake, notes } = req.body;

    if (!mealType) {
      return res.status(400).json({
        success: false,
        message: 'Meal type is required.',
      });
    }

    const log = await NutritionLog.create({
      user: req.user._id,
      date: date || Date.now(),
      mealType,
      foods: foods || [],
      waterIntake: waterIntake || 0,
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Meal logged successfully.',
      nutritionLog: log,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to log meal: ' + err.message,
    });
  }
});

// @route   GET /api/nutrition
// @desc    Get nutrition logs with optional date filter
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, mealType, startDate, endDate, date } = req.query;

    const filter = { user: req.user._id };
    if (mealType) filter.mealType = mealType;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await NutritionLog.countDocuments(filter);
    const logs = await NutritionLog.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      nutritionLogs: logs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nutrition logs: ' + err.message,
    });
  }
});

// @route   GET /api/nutrition/:id
// @desc    Get a single nutrition log
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const log = await NutritionLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Nutrition log not found.' });
    }
    res.status(200).json({ success: true, nutritionLog: log });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch log: ' + err.message });
  }
});

// @route   PUT /api/nutrition/:id
// @desc    Update a nutrition log
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const log = await NutritionLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Nutrition log not found.' });
    }

    Object.assign(log, req.body);
    await log.save(); // triggers pre-save to recalculate totals

    res.status(200).json({
      success: true,
      message: 'Nutrition log updated.',
      nutritionLog: log,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update log: ' + err.message });
  }
});

// @route   DELETE /api/nutrition/:id
// @desc    Delete a nutrition log
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const log = await NutritionLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Nutrition log not found.' });
    }
    res.status(200).json({ success: true, message: 'Nutrition log deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete log: ' + err.message });
  }
});

// @route   GET /api/nutrition/stats/daily
// @desc    Get daily nutrition summary for a given date
// @access  Private
router.get('/stats/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const logs = await NutritionLog.find({
      user: req.user._id,
      date: { $gte: start, $lte: end },
    });

    const summary = logs.reduce(
      (acc, log) => {
        acc.totalCalories += log.totalCalories || 0;
        acc.totalProtein += log.totalProtein || 0;
        acc.totalCarbs += log.totalCarbs || 0;
        acc.totalFat += log.totalFat || 0;
        acc.totalFiber += log.totalFiber || 0;
        acc.totalWater += log.waterIntake || 0;
        return acc;
      },
      {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        totalWater: 0,
      }
    );

    res.status(200).json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      meals: logs.length,
      summary,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch daily stats: ' + err.message });
  }
});

// @route   GET /api/nutrition/foods/search
// @desc    Search Indian foods database
// @access  Private
router.get('/foods/search', async (req, res) => {
  try {
    const { q, category, isVegetarian, region, limit = 20 } = req.query;

    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { nameHindi: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }
    if (category) filter.category = category;
    if (region) filter.region = region;
    if (isVegetarian !== undefined) filter.isVegetarian = isVegetarian === 'true';

    const foods = await IndianFood.find(filter).limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: foods.length,
      foods,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Food search failed: ' + err.message });
  }
});

module.exports = router;
