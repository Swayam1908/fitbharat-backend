const mongoose = require('mongoose');
require('dotenv').config();

const IndianFoodSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  nameHindi:   { type: String },
  category:    { type: String },
  per100g:     { calories: Number, protein: Number, carbs: Number, fat: Number, fiber: Number },
  servingSize: { type: Number, default: 100 },
  servingUnit: { type: String, default: 'g' },
  isCooked:    { type: Boolean, default: false },
});
IndianFoodSchema.index({ name: 'text', category: 'text' });
const IndianFood = mongoose.model('IndianFood', IndianFoodSchema);

const foods = [
  // ── DAL ──
  { name: 'Toor Dal (cooked)',    nameHindi: 'अरहर दाल', category: 'dal',     isCooked: true,  per100g: { calories: 116, protein: 7,  carbs: 20, fat: 0.4, fiber: 2.5 } },
  { name: 'Toor Dal (raw)',       nameHindi: 'अरहर दाल', category: 'dal',     isCooked: false, per100g: { calories: 340, protein: 22, carbs: 60, fat: 1.5, fiber: 8   } },
  { name: 'Moong Dal (cooked)',   nameHindi: 'मूंग दाल',  category: 'dal',     isCooked: true,  per100g: { calories: 105, protein: 7,  carbs: 19, fat: 0.4, fiber: 2   } },
  { name: 'Moong Dal (raw)',      nameHindi: 'मूंग दाल',  category: 'dal',     isCooked: false, per100g: { calories: 347, protein: 24, carbs: 60, fat: 1.2, fiber: 8   } },
  { name: 'Masoor Dal (cooked)',  nameHindi: 'मसूर दाल',  category: 'dal',     isCooked: true,  per100g: { calories: 116, protein: 9,  carbs: 20, fat: 0.4, fiber: 4   } },
  { name: 'Masoor Dal (raw)',     nameHindi: 'मसूर दाल',  category: 'dal',     isCooked: false, per100g: { calories: 353, protein: 25, carbs: 60, fat: 1.1, fiber: 11  } },
  { name: 'Chana Dal (cooked)',   nameHindi: 'चना दाल',   category: 'dal',     isCooked: true,  per100g: { calories: 164, protein: 9,  carbs: 27, fat: 2.7, fiber: 5   } },
  { name: 'Urad Dal (cooked)',    nameHindi: 'उड़द दाल',  category: 'dal',     isCooked: true,  per100g: { calories: 127, protein: 9,  carbs: 22, fat: 0.6, fiber: 3   } },
  // ── RICE ──
  { name: 'Basmati Rice (cooked)',nameHindi: 'बासमती चावल', category: 'rice',  isCooked: true,  per100g: { calories: 130, protein: 3,  carbs: 28, fat: 0.3, fiber: 0.4 } },
  { name: 'Brown Rice (cooked)',  nameHindi: 'ब्राउन राइस', category: 'rice',  isCooked: true,  per100g: { calories: 123, protein: 2.7,carbs: 26, fat: 0.9, fiber: 1.6 } },
  { name: 'Poha (cooked)',        nameHindi: 'पोहा',       category: 'rice',   isCooked: true,  per100g: { calories: 110, protein: 2,  carbs: 23, fat: 0.5, fiber: 0.5 } },
  { name: 'Jeera Rice (cooked)',  nameHindi: 'जीरा राइस',  category: 'rice',   isCooked: true,  per100g: { calories: 148, protein: 3,  carbs: 29, fat: 2.5, fiber: 0.4 } },
  // ── ROTI / BREAD ──
  { name: 'Wheat Roti',          nameHindi: 'गेहूं रोटी', category: 'roti',   isCooked: true,  servingSize: 30, per100g: { calories: 264, protein: 8,  carbs: 50, fat: 3.7, fiber: 3.5 } },
  { name: 'Multigrain Roti',     nameHindi: 'मल्टीग्रेन रोटी', category: 'roti', isCooked: true, servingSize: 30, per100g: { calories: 250, protein: 9, carbs: 47, fat: 3.5, fiber: 5 } },
  { name: 'Paratha (plain)',      nameHindi: 'पराठा',      category: 'roti',   isCooked: true,  servingSize: 60, per100g: { calories: 326, protein: 7,  carbs: 48, fat: 12,  fiber: 2.5 } },
  { name: 'Puri',                nameHindi: 'पूरी',       category: 'roti',   isCooked: true,  servingSize: 25, per100g: { calories: 450, protein: 7,  carbs: 52, fat: 22,  fiber: 2   } },
  { name: 'Naan',                nameHindi: 'नान',        category: 'roti',   isCooked: true,  servingSize: 90, per100g: { calories: 310, protein: 9,  carbs: 55, fat: 6,   fiber: 2   } },
  // ── SABZI ──
  { name: 'Aloo Gobi',           nameHindi: 'आलू गोभी',   category: 'sabzi',  isCooked: true,  per100g: { calories: 112, protein: 3,  carbs: 17, fat: 4,   fiber: 3   } },
  { name: 'Palak Paneer',        nameHindi: 'पालक पनीर',  category: 'sabzi',  isCooked: true,  per100g: { calories: 165, protein: 8,  carbs: 8,  fat: 12,  fiber: 2   } },
  { name: 'Bhindi (cooked)',     nameHindi: 'भिंडी',      category: 'sabzi',  isCooked: true,  per100g: { calories: 75,  protein: 2,  carbs: 10, fat: 3,   fiber: 3.5 } },
  { name: 'Baingan Bharta',      nameHindi: 'बैंगन भर्ता', category: 'sabzi', isCooked: true,  per100g: { calories: 90,  protein: 2,  carbs: 10, fat: 4.5, fiber: 3   } },
  { name: 'Mix Veg Sabzi',       nameHindi: 'मिक्स वेज',  category: 'sabzi',  isCooked: true,  per100g: { calories: 95,  protein: 3,  carbs: 12, fat: 4,   fiber: 3   } },
  { name: 'Matar Paneer',        nameHindi: 'मटर पनीर',   category: 'sabzi',  isCooked: true,  per100g: { calories: 172, protein: 9,  carbs: 10, fat: 11,  fiber: 2.5 } },
  // ── DAIRY ──
  { name: 'Paneer',              nameHindi: 'पनीर',       category: 'dairy',  isCooked: false, per100g: { calories: 265, protein: 18, carbs: 3,  fat: 21,  fiber: 0   } },
  { name: 'Dahi (Curd)',         nameHindi: 'दही',        category: 'dairy',  isCooked: false, per100g: { calories: 60,  protein: 3.5,carbs: 4.7,fat: 3.2, fiber: 0   } },
  { name: 'Milk (Full Fat)',     nameHindi: 'दूध',        category: 'dairy',  isCooked: false, per100g: { calories: 61,  protein: 3.2,carbs: 4.8,fat: 3.5, fiber: 0   } },
  { name: 'Milk (Toned)',        nameHindi: 'टोंड दूध',   category: 'dairy',  isCooked: false, per100g: { calories: 42,  protein: 3.1,carbs: 4.9,fat: 1.5, fiber: 0   } },
  { name: 'Ghee',                nameHindi: 'घी',         category: 'dairy',  isCooked: false, servingSize: 10, per100g: { calories: 900, protein: 0, carbs: 0, fat: 100, fiber: 0 } },
  { name: 'Butter',              nameHindi: 'मक्खन',      category: 'dairy',  isCooked: false, servingSize: 10, per100g: { calories: 717, protein: 0.9,carbs: 0.1,fat: 81, fiber: 0 } },
  { name: 'Lassi (sweet)',       nameHindi: 'लस्सी',      category: 'dairy',  isCooked: false, servingSize: 200, per100g: { calories: 70, protein: 3.5,carbs: 9, fat: 2, fiber: 0 } },
  // ── PROTEIN ──
  { name: 'Chicken Breast (cooked)', nameHindi: 'चिकन', category: 'protein', isCooked: true,  per100g: { calories: 165, protein: 31, carbs: 0,  fat: 3.6, fiber: 0   } },
  { name: 'Egg (whole)',         nameHindi: 'अंडा',       category: 'protein', isCooked: false, servingSize: 50, per100g: { calories: 155, protein: 13, carbs: 1.1,fat: 11, fiber: 0 } },
  { name: 'Egg White',           nameHindi: 'अंडे का सफेद भाग', category: 'protein', isCooked: false, servingSize: 30, per100g: { calories: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0 } },
  { name: 'Mutton (cooked)',     nameHindi: 'मटन',        category: 'protein', isCooked: true,  per100g: { calories: 218, protein: 26, carbs: 0,  fat: 12,  fiber: 0   } },
  { name: 'Fish (Rohu cooked)',  nameHindi: 'मछली',       category: 'protein', isCooked: true,  per100g: { calories: 140, protein: 20, carbs: 0,  fat: 6,   fiber: 0   } },
  // ── LEGUMES ──
  { name: 'Rajma (cooked)',      nameHindi: 'राजमा',      category: 'legumes', isCooked: true,  per100g: { calories: 127, protein: 9,  carbs: 23, fat: 0.5, fiber: 6   } },
  { name: 'Chole (cooked)',      nameHindi: 'छोले',       category: 'legumes', isCooked: true,  per100g: { calories: 164, protein: 9,  carbs: 27, fat: 2.6, fiber: 5   } },
  { name: 'Green Moong Sprouts', nameHindi: 'मूंग अंकुरित', category: 'legumes', isCooked: false, per100g: { calories: 30, protein: 3.8,carbs: 4, fat: 0.2, fiber: 1.8 } },
  { name: 'Soybean (cooked)',    nameHindi: 'सोयाबीन',    category: 'legumes', isCooked: true,  per100g: { calories: 173, protein: 17, carbs: 10, fat: 9,   fiber: 6   } },
  // ── SNACKS ──
  { name: 'Samosa',              nameHindi: 'समोसा',      category: 'snack',   isCooked: true,  servingSize: 80, per100g: { calories: 262, protein: 4, carbs: 30, fat: 14, fiber: 2 } },
  { name: 'Pakora',              nameHindi: 'पकोड़ा',     category: 'snack',   isCooked: true,  servingSize: 50, per100g: { calories: 285, protein: 5, carbs: 28, fat: 17, fiber: 2 } },
  { name: 'Dhokla',              nameHindi: 'ढोकला',      category: 'snack',   isCooked: true,  per100g: { calories: 160, protein: 5,  carbs: 28, fat: 4,   fiber: 1.5 } },
  { name: 'Idli',                nameHindi: 'इडली',       category: 'snack',   isCooked: true,  servingSize: 40, per100g: { calories: 143, protein: 3.5,carbs: 30, fat: 0.4, fiber: 1 } },
  { name: 'Dosa (plain)',        nameHindi: 'डोसा',       category: 'snack',   isCooked: true,  servingSize: 80, per100g: { calories: 168, protein: 4,  carbs: 30, fat: 3.7, fiber: 1 } },
  { name: 'Upma',                nameHindi: 'उपमा',       category: 'snack',   isCooked: true,  per100g: { calories: 145, protein: 3.5,carbs: 22, fat: 5,   fiber: 2   } },
  { name: 'Popcorn (plain)',     nameHindi: 'पॉपकॉर्न',   category: 'snack',   isCooked: true,  per100g: { calories: 375, protein: 12, carbs: 74, fat: 4.5, fiber: 15  } },
  // ── FRUITS ──
  { name: 'Banana',              nameHindi: 'केला',       category: 'fruit',   isCooked: false, servingSize: 100, per100g: { calories: 89, protein: 1.1,carbs: 23, fat: 0.3, fiber: 2.6 } },
  { name: 'Apple',               nameHindi: 'सेब',        category: 'fruit',   isCooked: false, servingSize: 150, per100g: { calories: 52, protein: 0.3,carbs: 14, fat: 0.2, fiber: 2.4 } },
  { name: 'Mango',               nameHindi: 'आम',         category: 'fruit',   isCooked: false, servingSize: 150, per100g: { calories: 60, protein: 0.8,carbs: 15, fat: 0.4, fiber: 1.6 } },
  { name: 'Papaya',              nameHindi: 'पपीता',      category: 'fruit',   isCooked: false, servingSize: 150, per100g: { calories: 43, protein: 0.5,carbs: 11, fat: 0.3, fiber: 1.7 } },
  { name: 'Guava',               nameHindi: 'अमरूद',      category: 'fruit',   isCooked: false, servingSize: 100, per100g: { calories: 68, protein: 2.6,carbs: 14, fat: 1,   fiber: 5.4 } },
  { name: 'Orange',              nameHindi: 'संतरा',      category: 'fruit',   isCooked: false, servingSize: 130, per100g: { calories: 47, protein: 0.9,carbs: 12, fat: 0.1, fiber: 2.4 } },
  { name: 'Watermelon',          nameHindi: 'तरबूज',      category: 'fruit',   isCooked: false, servingSize: 200, per100g: { calories: 30, protein: 0.6,carbs: 8,  fat: 0.2, fiber: 0.4 } },
  // ── BEVERAGES ──
  { name: 'Chai (milk + sugar)', nameHindi: 'चाय',        category: 'beverage', isCooked: true, servingSize: 150, per100g: { calories: 37, protein: 1.5,carbs: 5.5,fat: 1.1, fiber: 0 } },
  { name: 'Black Coffee',        nameHindi: 'ब्लैक कॉफी', category: 'beverage', isCooked: true, servingSize: 200, per100g: { calories: 2,  protein: 0.3,carbs: 0,  fat: 0,   fiber: 0 } },
  { name: 'Nimbu Pani',          nameHindi: 'नींबू पानी', category: 'beverage', isCooked: true, servingSize: 200, per100g: { calories: 20, protein: 0.2,carbs: 5,  fat: 0,   fiber: 0 } },
  { name: 'Coconut Water',       nameHindi: 'नारियल पानी', category: 'beverage', isCooked: false, servingSize: 250, per100g: { calories: 19, protein: 0.7,carbs: 3.7,fat: 0.2, fiber: 1 } },
  // ── RICE DISHES ──
  { name: 'Khichdi',             nameHindi: 'खिचड़ी',     category: 'rice',    isCooked: true,  per100g: { calories: 124, protein: 5,  carbs: 23, fat: 1.5, fiber: 2   } },
  { name: 'Biryani (veg)',       nameHindi: 'बिरयानी',    category: 'rice',    isCooked: true,  per100g: { calories: 178, protein: 4,  carbs: 32, fat: 4.5, fiber: 1.5 } },
  { name: 'Biryani (chicken)',   nameHindi: 'चिकन बिरयानी', category: 'rice',  isCooked: true,  per100g: { calories: 195, protein: 11, carbs: 28, fat: 5,   fiber: 1   } },
  { name: 'Curd Rice',           nameHindi: 'दही चावल',   category: 'rice',    isCooked: true,  per100g: { calories: 105, protein: 3,  carbs: 20, fat: 1.5, fiber: 0.5 } },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await IndianFood.countDocuments();
    if (existing > 0) {
      console.log(`Already have ${existing} foods. Skipping.`);
      process.exit(0);
    }

    await IndianFood.insertMany(foods);
    console.log(`✅ Seeded ${foods.length} Indian foods`);

    const sample = await IndianFood.findOne({ category: 'dal' });
    console.log(`Sample: ${sample.name} — ${sample.per100g.calories} cal/100g`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

seed();