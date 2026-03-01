const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUrl = process.env.DB_CONNECTION_SECRET || "mongodb://localhost:27017/devtinder";
  console.log("Connecting to:", mongoUrl.includes('@') ? 'mongodb://***' : mongoUrl);
  await mongoose.connect(mongoUrl);
};

module.exports = connectDB;
