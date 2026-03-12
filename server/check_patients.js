const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dpms-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB Connected');
  const patients = await User.find({ role: 'PATIENT' }).select('name email hashId walletAddress');
  console.log('--- PATIENTS IN DATABASE ---');
  console.log(JSON.stringify(patients, null, 2));
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
