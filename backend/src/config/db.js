const mongoose = require('mongoose');

let isConnecting = false;

const connectDB = async () => {
  if (isConnecting) return;
  isConnecting = true;
  try {
    if (!process.env.MONGO_URI) {
      console.error('[Database] MONGO_URI environment variable is missing.');
      isConnecting = false;
      return;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    isConnecting = false;
    // Retry connection after 5 seconds instead of killing process on transient errors
    console.log('[Database] Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
