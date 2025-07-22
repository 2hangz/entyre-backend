
const mongoose = require('mongoose');
const dotenv = require('dotenv');


dotenv.config();

const mongoURI = process.env.MONGODB_URI;


if (!mongoURI) {
  console.error('❌ Error: MONGODB_URI is not defined in .env');
  process.exit(1);
}

mongoose.connect(mongoURI, {
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1); 
  });

module.exports = mongoose;