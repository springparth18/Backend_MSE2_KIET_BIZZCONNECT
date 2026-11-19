const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  const connection = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`MongoDB Connected: ${connection.connection.host}/${connection.connection.name}`);
  return connection;
};

module.exports = connectDB;
