const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const ExerciseSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  bodyPart:         { type: String },
  equipment:        { type: String },
  target:           { type: String },
  gifUrl:           { type: String },
  secondaryMuscles: { type: [String] },
  instructions:     { type: [String] },
  difficulty:       { type: String },
  category:         { type: String },
});
ExerciseSchema.index({ name: 'text', bodyPart: 'text', target: 'text' });
const Exercise = mongoose.model('Exercise', ExerciseSchema);

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await Exercise.countDocuments();
    if (existing > 0) {
      console.log(`Already have ${existing} exercises. Skipping.`);
      process.exit(0);
    }

    console.log('Fetching from GitHub...');
    const res = await axios.get(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
      { timeout: 30000 }
    );

    const raw = res.data;
    console.log(`Got ${raw.length} exercises`);

    const exercises = raw.map(ex => ({
      name:             ex.name,
      bodyPart:         ex.category,
      equipment:        ex.equipment ? ex.equipment[0] : 'body weight',
      target:           ex.primaryMuscles ? ex.primaryMuscles[0] : '',
      gifUrl:           ex.images && ex.images[0]
                          ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${ex.images[0]}`
                          : null,
      secondaryMuscles: ex.secondaryMuscles || [],
      instructions:     ex.instructions || [],
      difficulty:       ex.level || 'beginner',
      category:         ex.mechanic || 'compound',
    })).filter(e => e.name);

    await Exercise.insertMany(exercises);
    console.log(`✅ Seeded ${exercises.length} exercises`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};
seed();