const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await mongoose.connection.collection('indianfoods').drop();
  console.log('Cleared foods');
  process.exit(0);
}).catch(e => {
  console.log(e.message);
  process.exit(1);
});