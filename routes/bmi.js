const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// BMI categories helper
const getBMICategory = (bmi) => {
  const b = parseFloat(bmi);
  if (b < 18.5) return { category: 'Underweight', risk: 'Low weight-related risk, but other risks', color: 'blue' };
  if (b < 25) return { category: 'Normal weight', risk: 'Low risk', color: 'green' };
  if (b < 30) return { category: 'Overweight', risk: 'Increased risk', color: 'yellow' };
  if (b < 35) return { category: 'Obese (Class I)', risk: 'High risk', color: 'orange' };
  if (b < 40) return { category: 'Obese (Class II)', risk: 'Very high risk', color: 'red' };
  return { category: 'Obese (Class III)', risk: 'Extremely high risk', color: 'darkred' };
};

// Ideal weight range (Hamwi method)
const getIdealWeightRange = (height, gender) => {
  if (!height) return null;
  const heightInInches = height / 2.54;
  const inchesOver5Feet = Math.max(0, heightInInches - 60);
  let base, perInch;
  if (gender === 'male') {
    base = 48;
    perInch = 2.7;
  } else {
    base = 45.5;
    perInch = 2.2;
  }
  const ideal = base + perInch * inchesOver5Feet;
  return {
    min: parseFloat((ideal * 0.9).toFixed(1)),
    ideal: parseFloat(ideal.toFixed(1)),
    max: parseFloat((ideal * 1.1).toFixed(1)),
  };
};

// BMR calculation (Mifflin-St Jeor)
const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age || !gender) return null;
  if (gender === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
};

// TDEE multipliers
const tdeeMultipliers = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

// @route   GET /api/bmi
// @desc    Calculate BMI for the logged-in user based on their profile
// @access  Private
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.height || !user.weight) {
      return res.status(400).json({
        success: false,
        message: 'Height and weight must be set in your profile to calculate BMI.',
      });
    }

    const heightM = user.height / 100;
    const bmi = parseFloat((user.weight / (heightM * heightM)).toFixed(2));
    const bmiInfo = getBMICategory(bmi);
    const idealWeight = getIdealWeightRange(user.height, user.gender);
    const bmr = calculateBMR(user.weight, user.height, user.age, user.gender);
    const tdee = bmr ? Math.round(bmr * (tdeeMultipliers[user.activityLevel] || 1.2)) : null;

    const weightDiff = idealWeight ? parseFloat((user.weight - idealWeight.ideal).toFixed(1)) : null;

    res.status(200).json({
      success: true,
      bmi: {
        value: bmi,
        ...bmiInfo,
      },
      measurements: {
        height: user.height,
        weight: user.weight,
        heightUnit: 'cm',
        weightUnit: 'kg',
      },
      idealWeight,
      weightDifference: weightDiff
        ? {
            kg: weightDiff,
            status: weightDiff > 0 ? 'above_ideal' : weightDiff < 0 ? 'below_ideal' : 'at_ideal',
          }
        : null,
      metabolism: {
        bmr,
        tdee,
        activityLevel: user.activityLevel,
        bmrUnit: 'kcal/day',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'BMI calculation failed: ' + err.message });
  }
});

// @route   POST /api/bmi/calculate
// @desc    Calculate BMI for custom height/weight (no profile update)
// @access  Private
router.post('/calculate', async (req, res) => {
  try {
    const { height, weight, age, gender, activityLevel } = req.body;

    if (!height || !weight) {
      return res.status(400).json({ success: false, message: 'Height (cm) and weight (kg) are required.' });
    }

    const heightM = height / 100;
    const bmi = parseFloat((weight / (heightM * heightM)).toFixed(2));
    const bmiInfo = getBMICategory(bmi);
    const idealWeight = getIdealWeightRange(height, gender);
    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = bmr ? Math.round(bmr * (tdeeMultipliers[activityLevel] || 1.2)) : null;

    res.status(200).json({
      success: true,
      bmi: {
        value: bmi,
        ...bmiInfo,
      },
      idealWeight,
      metabolism: {
        bmr,
        tdee,
        activityLevel,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'BMI calculation failed: ' + err.message });
  }
});

module.exports = router;
