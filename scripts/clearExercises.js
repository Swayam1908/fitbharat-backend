const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await mongoose.connection.collection('exercises').drop();
  console.log('Cleared exercises');
  process.exit(0);
}).catch(e => {
  console.log(e.message);
  process.exit(1);
});