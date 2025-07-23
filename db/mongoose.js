
const mongoose = require('mongoose');
const dotenv = require('dotenv');


dotenv.config();

const mongoURI = process.env.MONGODB_URI;


if (!mongoURI) {
  process.exit(1);
}

mongoose.connect(mongoURI, {
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch((error) => {
    process.exit(1); 
  });

module.exports = mongoose;