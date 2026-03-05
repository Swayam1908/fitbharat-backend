const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// @route   GET /api/exercises/search?q=chest
// @desc    Search exercises by name, bodyPart, target, equipment
// @access  Private
// ⚠️ MUST be before /:id route
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Query parameter q is required' });

    const exercises = await Exercise.find({
      $or: [
        { name:      { $regex: q, $options: 'i' } },
        { bodyPart:  { $regex: q, $options: 'i' } },
        { target:    { $regex: q, $options: 'i' } },
        { equipment: { $regex: q, $options: 'i' } },
      ]
    }).limit(30);

    res.status(200).json({ success: true, count: exercises.length, data: exercises });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to search exercises: ' + err.message });
  }
});

// @route   GET /api/exercises/bodyparts
// @desc    Get all distinct body parts
// @access  Private
// ⚠️ MUST be before /:id route
router.get('/bodyparts', authMiddleware, async (req, res) => {
  try {
    const parts = await Exercise.distinct('bodyPart');
    res.status(200).json({ success: true, data: parts.sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch body parts: ' + err.message });
  }
});

// @route   GET /api/exercises
// @desc    Get all exercises with optional filters
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, equipment, difficulty, type, isIndian, q, limit = 50 } = req.query;

    const filter = {};
    if (category)  filter.category  = category;
    if (equipment) filter.equipment = equipment;
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;
    if (isIndian !== undefined) filter.isIndian = isIndian === 'true';
    if (q) {
      filter.$or = [
        { name:      { $regex: q, $options: 'i' } },
        { bodyPart:  { $regex: q, $options: 'i' } },
        { target:    { $regex: q, $options: 'i' } },
        { equipment: { $regex: q, $options: 'i' } },
      ];
    }

    const exercises = await Exercise.find(filter)
      .sort({ name: 1 })
      .limit(parseInt(limit));

    res.status(200).json({ success: true, count: exercises.length, exercises });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch exercises: ' + err.message });
  }
});

// @route   GET /api/exercises/:id
// @desc    Get a single exercise by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found.' });
    }
    res.status(200).json({ success: true, exercise });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch exercise: ' + err.message });
  }
});

// @route   POST /api/exercises
// @desc    Create a new exercise (Admin only)
// @access  Admin
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const exercise = await Exercise.create(req.body);
    res.status(201).json({ success: true, message: 'Exercise created.', exercise });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Exercise with this name already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create exercise: ' + err.message });
  }
});

// @route   PUT /api/exercises/:id
// @desc    Update an exercise (Admin only)
// @access  Admin
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found.' });
    }
    res.status(200).json({ success: true, message: 'Exercise updated.', exercise });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update exercise: ' + err.message });
  }
});

// @route   DELETE /api/exercises/:id
// @desc    Delete an exercise (Admin only)
// @access  Admin
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found.' });
    }
    res.status(200).json({ success: true, message: 'Exercise deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete exercise: ' + err.message });
  }
});

module.exports = router;