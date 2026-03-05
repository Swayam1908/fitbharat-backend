const express = require('express');
const router = express.Router();
const SleepLog = require('../models/SleepLog');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// @route   POST /api/sleep
// @desc    Log a sleep entry
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { date, bedtime, wakeTime, quality, qualityScore, interruptions, notes } = req.body;

    if (!bedtime || !wakeTime || !quality) {
      return res.status(400).json({
        success: false,
        message: 'bedtime, wakeTime, and quality are required.',
      });
    }

    const log = await SleepLog.create({
      user: req.user._id,
      date: date || Date.now(),
      bedtime: new Date(bedtime),
      wakeTime: new Date(wakeTime),
      quality,
      qualityScore,
      interruptions: interruptions || 0,
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Sleep logged successfully.',
      sleepLog: log,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to log sleep: ' + err.message,
    });
  }
});

// @route   GET /api/sleep
// @desc    Get sleep logs for the current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await SleepLog.countDocuments(filter);
    const logs = await SleepLog.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      sleepLogs: logs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sleep logs: ' + err.message });
  }
});

// @route   GET /api/sleep/:id
// @desc    Get a single sleep log
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const log = await SleepLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Sleep log not found.' });
    }
    res.status(200).json({ success: true, sleepLog: log });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sleep log: ' + err.message });
  }
});

// @route   PUT /api/sleep/:id
// @desc    Update a sleep log
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const log = await SleepLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Sleep log not found.' });
    }

    if (req.body.bedtime) log.bedtime = new Date(req.body.bedtime);
    if (req.body.wakeTime) log.wakeTime = new Date(req.body.wakeTime);
    if (req.body.quality) log.quality = req.body.quality;
    if (req.body.qualityScore !== undefined) log.qualityScore = req.body.qualityScore;
    if (req.body.interruptions !== undefined) log.interruptions = req.body.interruptions;
    if (req.body.notes !== undefined) log.notes = req.body.notes;
    if (req.body.date) log.date = new Date(req.body.date);

    await log.save(); // triggers pre-save to recalculate duration

    res.status(200).json({
      success: true,
      message: 'Sleep log updated.',
      sleepLog: log,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update sleep log: ' + err.message });
  }
});

// @route   DELETE /api/sleep/:id
// @desc    Delete a sleep log
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const log = await SleepLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Sleep log not found.' });
    }
    res.status(200).json({ success: true, message: 'Sleep log deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete sleep log: ' + err.message });
  }
});

// @route   GET /api/sleep/stats/average
// @desc    Get average sleep stats for a given period
// @access  Private
router.get('/stats/average', async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await SleepLog.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' },
          avgQualityScore: { $avg: '$qualityScore' },
          totalNights: { $sum: 1 },
          avgInterruptions: { $avg: '$interruptions' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      period: `${period} days`,
      averages: stats[0] || {
        avgDuration: 0,
        avgQualityScore: 0,
        totalNights: 0,
        avgInterruptions: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get sleep stats: ' + err.message });
  }
});

module.exports = router;
