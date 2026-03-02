const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URI || "mongodb://mongo:27017/devtinder";
  let connected = false;

  while (!connected) {
    try {
      await mongoose.connect(mongoUrl);
      connected = true;
      console.log("Database connection established...");
    } catch (err) {
      console.log("MongoDB not ready, retrying in 2s...", err.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
};

module.exports = connectDB;