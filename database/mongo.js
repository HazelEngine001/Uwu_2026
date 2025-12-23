const mongoose = require("mongoose");

module.exports = async () => {
  await mongoose.connect("mongodb+srv://maitaodilamm:24122001@sam.ax1mys9.mongodb.net/?appName=Sam");
  console.log("✅ MongoDB connected");
};
