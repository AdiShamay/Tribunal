const mongoose = require('mongoose');
require('dotenv').config();

async function connectToDatabase() {
  // The connection string stays in the environment so database credentials
  // are not embedded in application code or committed to the repository.
  return mongoose.connect(process.env.MONGODB_URI);
}

module.exports = connectToDatabase;