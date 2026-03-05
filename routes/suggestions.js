const express = require('express');
const router = express.Router();
const User = require('../models/User');
const WorkoutLog = require('../models/WorkoutLog');
const NutritionLog = require('../models/NutritionLog');
const SleepLog = require('../models/SleepLog');
const Exercise = require('../models/Exercise');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Helpers
const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

// @route   GET /api/suggestions
// @desc    Get personalized fitness and nutrition suggestions
// @access  Private
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const suggestions = [];
    const tips = [];

    // --- BMI-based suggestions ---
    if (user.height && user.weight) {
      const hm = user.height / 100;
      const bmi = user.weight / (hm * hm);
      const bmiCategory = getBMICategory(bmi);

      if (bmiCategory === 'underweight') {
        suggestions.push({
          type: 'nutrition',
          priority: 'high',
          title: 'Increase Caloric Intake',
          message:
            'Your BMI indicates you are underweight. Focus on calorie-dense foods like nuts, dairy, and proteins. Aim for a caloric surplus of 300-500 kcal/day.',
        });
        suggestions.push({
          type: 'workout',
          priority: 'high',
          title: 'Strength Training Focus',
          message:
            'Incorporate resistance training (3-4 days/week) to build muscle mass. Focus on compound movements like squats, deadlifts, and bench press.',
        });
      } else if (bmiCategory === 'overweight' || bmiCategory === 'obese') {
        suggestions.push({
          type: 'nutrition',
          priority: 'high',
          title: 'Create a Caloric Deficit',
          message:
            'Your BMI is elevated. Aim for a moderate caloric deficit of 300-500 kcal/day. Focus on whole foods, vegetables, and lean proteins.',
        });
        suggestions.push({
          type: 'workout',
          priority: 'high',
          title: 'Cardio + Strength Combination',
          message:
            'Combine cardio (3-4 days/week) with strength training (2-3 days/week). Start with low-impact activities like walking, swimming, or cycling.',
        });
      }
    }

    // --- Goal-based suggestions ---
    if (user.fitnessGoal === 'muscle_gain') {
      suggestions.push({
        type: 'nutrition',
        priority: 'medium',
        title: 'High Protein Diet',
        message:
          'For muscle gain, aim for 1.6-2.2g of protein per kg of body weight daily. Include paneer, dal, chicken, eggs, and legumes in your diet.',
      });
      suggestions.push({
        type: 'workout',
        priority: 'medium',
        title: 'Progressive Overload',
        message:
          'Apply progressive overload — increase weight, reps, or sets each week to continuously challenge your muscles.',
      });
    } else if (user.fitnessGoal === 'weight_loss') {
      suggestions.push({
        type: 'nutrition',
        priority: 'medium',
        title: 'Balanced Indian Diet for Weight Loss',
        message:
          'Focus on dal, sabzi, roti (whole wheat), and salads. Avoid deep-fried foods, sweets, and excess rice. Eat 5-6 small meals per day.',
      });
      suggestions.push({
        type: 'workout',
        priority: 'medium',
        title: 'HIIT Training',
        message:
          'High-Intensity Interval Training (HIIT) burns more calories in less time. Try 20-30 min HIIT sessions, 3-4 times per week.',
      });
    } else if (user.fitnessGoal === 'endurance') {
      suggestions.push({
        type: 'workout',
        priority: 'medium',
        title: 'Build Cardiovascular Endurance',
        message:
          'Gradually increase cardio session duration by 10% per week. Include long runs, cycling, or swimming 4-5 days/week.',
      });
    } else if (user.fitnessGoal === 'flexibility') {
      suggestions.push({
        type: 'workout',
        priority: 'medium',
        title: 'Yoga & Stretching',
        message:
          'Practice yoga daily for 30 minutes. Surya Namaskar is an excellent full-body routine. Include static stretching post every workout.',
      });
    }

    // --- Activity level tips ---
    if (user.activityLevel === 'sedentary') {
      tips.push({
        type: 'lifestyle',
        title: 'Break Sedentary Habits',
        message:
          'You are currently sedentary. Start by taking a 10-minute walk after each meal. Gradually build up to 30-45 minutes of activity daily.',
      });
    }

    // --- Check recent sleep ---
    const recentSleep = await SleepLog.findOne({ user: user._id }).sort({ date: -1 });
    if (!recentSleep) {
      tips.push({
        type: 'sleep',
        title: 'Start Tracking Sleep',
        message: 'Sleep is crucial for fitness progress. Start logging your sleep to get personalized recommendations.',
      });
    } else if (recentSleep.duration < 7) {
      suggestions.push({
        type: 'sleep',
        priority: 'high',
        title: 'Improve Sleep Duration',
        message: `You got ${recentSleep.duration.toFixed(1)} hours of sleep recently. Aim for 7-9 hours per night for optimal recovery and fitness progress.`,
      });
    }

    // --- Check recent workout frequency ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentWorkoutCount = await WorkoutLog.countDocuments({
      user: user._id,
      date: { $gte: sevenDaysAgo },
    });

    if (recentWorkoutCount === 0) {
      suggestions.push({
        type: 'workout',
        priority: 'high',
        title: "It's Time to Work Out!",
        message:
          "You haven't logged any workouts this week. Even a short 20-minute session is better than none. Start today!",
      });
    } else if (recentWorkoutCount < 3) {
      tips.push({
        type: 'workout',
        title: 'Increase Workout Frequency',
        message: `You worked out ${recentWorkoutCount} time(s) this week. For better results, aim for 4-5 sessions per week.`,
      });
    }

    // --- Indian diet tips ---
    tips.push({
      type: 'nutrition',
      title: 'Hydration Reminder',
      message:
        'Aim to drink at least 8-10 glasses (2-2.5 litres) of water daily. Start each morning with a glass of warm water with lemon.',
    });

    tips.push({
      type: 'nutrition',
      title: 'Indian Superfoods',
      message:
        'Include turmeric (anti-inflammatory), amla (vitamin C), ashwagandha (stress relief), and moringa (nutrients) in your daily diet.',
    });

    res.status(200).json({
      success: true,
      suggestions,
      tips,
      user: {
        fitnessGoal: user.fitnessGoal,
        activityLevel: user.activityLevel,
        bmi: user.height && user.weight
          ? parseFloat((user.weight / Math.pow(user.height / 100, 2)).toFixed(2))
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestions: ' + err.message,
    });
  }
});

// @route   GET /api/suggestions/workout-plan
// @desc    Get a recommended workout plan based on fitness goal
// @access  Private
router.get('/workout-plan', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const plans = {
      weight_loss: {
        name: 'Weight Loss Plan',
        frequency: '5 days/week',
        schedule: [
          { day: 'Monday', focus: 'HIIT Cardio', duration: '30 min', exercises: ['Jumping Jacks', 'Burpees', 'Mountain Climbers', 'Jump Rope'] },
          { day: 'Tuesday', focus: 'Strength – Upper Body', duration: '45 min', exercises: ['Push-ups', 'Dumbbell Rows', 'Shoulder Press', 'Bicep Curls'] },
          { day: 'Wednesday', focus: 'Low Impact Cardio', duration: '40 min', exercises: ['Brisk Walking', 'Cycling', 'Swimming'] },
          { day: 'Thursday', focus: 'Strength – Lower Body', duration: '45 min', exercises: ['Squats', 'Lunges', 'Leg Press', 'Calf Raises'] },
          { day: 'Friday', focus: 'Full Body HIIT', duration: '30 min', exercises: ['Box Jumps', 'Kettlebell Swings', 'Battle Ropes', 'Sprints'] },
          { day: 'Saturday', focus: 'Yoga & Flexibility', duration: '30 min', exercises: ['Surya Namaskar', 'Warrior Poses', 'Seated Forward Bend'] },
          { day: 'Sunday', focus: 'Rest & Recovery', duration: '-', exercises: ['Light Stretching', 'Foam Rolling'] },
        ],
      },
      muscle_gain: {
        name: 'Muscle Gain Plan',
        frequency: '5 days/week',
        schedule: [
          { day: 'Monday', focus: 'Chest & Triceps', duration: '60 min', exercises: ['Bench Press', 'Incline Dumbbell Press', 'Tricep Dips', 'Cable Flyes'] },
          { day: 'Tuesday', focus: 'Back & Biceps', duration: '60 min', exercises: ['Deadlift', 'Pull-ups', 'Barbell Rows', 'Hammer Curls'] },
          { day: 'Wednesday', focus: 'Legs', duration: '60 min', exercises: ['Squats', 'Leg Press', 'Romanian Deadlift', 'Leg Curls'] },
          { day: 'Thursday', focus: 'Shoulders & Core', duration: '60 min', exercises: ['Overhead Press', 'Lateral Raises', 'Face Pulls', 'Planks'] },
          { day: 'Friday', focus: 'Full Body + HIIT', duration: '50 min', exercises: ['Power Cleans', 'Box Jumps', 'Kettlebell Swings'] },
          { day: 'Saturday', focus: 'Active Recovery', duration: '30 min', exercises: ['Light Cardio', 'Yoga', 'Stretching'] },
          { day: 'Sunday', focus: 'Rest', duration: '-', exercises: [] },
        ],
      },
      maintenance: {
        name: 'Maintenance Plan',
        frequency: '4 days/week',
        schedule: [
          { day: 'Monday', focus: 'Strength Training', duration: '45 min', exercises: ['Squats', 'Bench Press', 'Deadlift'] },
          { day: 'Wednesday', focus: 'Cardio', duration: '30 min', exercises: ['Running', 'Cycling', 'Jump Rope'] },
          { day: 'Friday', focus: 'Strength Training', duration: '45 min', exercises: ['Pull-ups', 'Shoulder Press', 'Lunges'] },
          { day: 'Saturday', focus: 'Yoga & Flexibility', duration: '30 min', exercises: ['Surya Namaskar', 'Stretching'] },
        ],
      },
      endurance: {
        name: 'Endurance Plan',
        frequency: '5 days/week',
        schedule: [
          { day: 'Monday', focus: 'Long Run', duration: '60 min', exercises: ['Steady State Running'] },
          { day: 'Tuesday', focus: 'Cross Training', duration: '45 min', exercises: ['Cycling', 'Swimming'] },
          { day: 'Wednesday', focus: 'Interval Training', duration: '40 min', exercises: ['400m Repeats', 'Hill Sprints'] },
          { day: 'Thursday', focus: 'Strength', duration: '45 min', exercises: ['Squats', 'Core Work', 'Hip Exercises'] },
          { day: 'Friday', focus: 'Easy Run', duration: '30 min', exercises: ['Easy Pace Running'] },
          { day: 'Saturday', focus: 'Long Run', duration: '90 min', exercises: ['Slow Long Distance'] },
          { day: 'Sunday', focus: 'Rest', duration: '-', exercises: [] },
        ],
      },
      flexibility: {
        name: 'Flexibility & Yoga Plan',
        frequency: '6 days/week',
        schedule: [
          { day: 'Monday', focus: 'Surya Namaskar', duration: '30 min', exercises: ['12 rounds of Surya Namaskar'] },
          { day: 'Tuesday', focus: 'Hip & Leg Flexibility', duration: '30 min', exercises: ['Pigeon Pose', 'Hamstring Stretch', 'Lizard Pose'] },
          { day: 'Wednesday', focus: 'Upper Body Yoga', duration: '30 min', exercises: ['Shoulder Stretch', 'Thread the Needle', "Child's Pose"] },
          { day: 'Thursday', focus: 'Core & Balance', duration: '30 min', exercises: ['Plank', 'Boat Pose', 'Tree Pose'] },
          { day: 'Friday', focus: 'Full Body Flow', duration: '45 min', exercises: ['Vinyasa Flow'] },
          { day: 'Saturday', focus: 'Restorative Yoga', duration: '40 min', exercises: ['Yin Yoga', "Legs Up the Wall"] },
          { day: 'Sunday', focus: 'Rest', duration: '-', exercises: [] },
        ],
      },
    };

    const goal = user.fitnessGoal || 'maintenance';
    const plan = plans[goal] || plans.maintenance;

    res.status(200).json({
      success: true,
      fitnessGoal: goal,
      workoutPlan: plan,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate workout plan: ' + err.message,
    });
  }
});

// @route   GET /api/suggestions/meal-plan
// @desc    Get a recommended Indian meal plan based on fitness goal
// @access  Private
router.get('/meal-plan', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const goal = user.fitnessGoal || 'maintenance';

    const mealPlans = {
      weight_loss: {
        name: 'Weight Loss Indian Meal Plan',
        targetCalories: '1400-1600 kcal/day',
        meals: {
          breakfast: ['Oats Upma with vegetables', 'Moong dal chilla with mint chutney', 'Poha with peanuts and coriander'],
          lunch: ['Brown rice + dal + sabzi + salad', 'Whole wheat roti (2) + chole + cucumber raita', 'Khichdi with ghee + buttermilk'],
          eveningSnack: ['Sprouts chaat', 'A handful of almonds + green tea', 'Roasted chana with lemon'],
          dinner: ['Grilled paneer tikka + sautéed vegetables', 'Dal soup + 1 whole wheat roti', 'Vegetable stew with brown rice'],
        },
        avoid: ['Refined carbs (maida)', 'Fried snacks', 'Sugary drinks', 'Large portions of rice', 'Mithai and desserts'],
      },
      muscle_gain: {
        name: 'Muscle Gain Indian Meal Plan',
        targetCalories: '2500-3000 kcal/day',
        meals: {
          breakfast: ['Egg bhurji (4 eggs) + whole wheat toast + banana', 'Paneer paratha + curd + nuts', 'Besan chilla + sprouts + milk'],
          lunch: ['Chicken/paneer curry + 3 rotis + dal + salad', 'Rice + rajma + curd + sabzi', 'Fish curry + rice + vegetable sabzi'],
          eveningSnack: ['Protein shake + banana', 'Paneer cubes + peanut butter toast', 'Sattu drink + roasted chana'],
          dinner: ['Grilled chicken/paneer + vegetables + 2 rotis', 'Dal makhani + rice + sabzi', 'Egg curry + brown rice'],
          preWorkout: ['Banana + peanut butter', 'Dates + almonds'],
          postWorkout: ['Protein shake + milk', 'Curd with honey and banana'],
        },
        tips: ['Eat every 3-4 hours', 'Prioritize protein at each meal', 'Drink 3-4 litres of water daily'],
      },
      maintenance: {
        name: 'Balanced Indian Maintenance Meal Plan',
        targetCalories: '1800-2200 kcal/day',
        meals: {
          breakfast: ['Idli sambhar + coconut chutney', 'Whole wheat paratha + curd + pickle', 'Dalia with milk + fruits'],
          lunch: ['Dal + roti + sabzi + curd', 'Rice + sambar + papad + vegetables', 'Pulao + raita + salad'],
          eveningSnack: ['Masala chai + biscuits (2)', 'Fruits with chaat masala', 'Makhana (fox nuts)'],
          dinner: ['Light khichdi + ghee + pickle', 'Roti sabzi + dal', 'Vegetable soup + 2 rotis'],
        },
      },
    };

    const plan = mealPlans[goal] || mealPlans.maintenance;

    res.status(200).json({
      success: true,
      fitnessGoal: goal,
      mealPlan: plan,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate meal plan: ' + err.message,
    });
  }
});

module.exports = router;
