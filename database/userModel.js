const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: String,
  money: { type: Number, default: 1000 },

  vip: {
    active: { type: Boolean, default: false },
    tier: { type: String, default: "none" },
    expireAt: { type: Date, default: null }
  },

  stats: {
    cfWin: { type: Number, default: 0 },
    cfLose: { type: Number, default: 0 },
    txWin: { type: Number, default: 0 },
    txLose: { type: Number, default: 0 },
    bjWin: { type: Number, default: 0 },
    bjLose: { type: Number, default: 0 }
  },

  daily: {
    lastClaim: { type: Date, default: null },
    streak: { type: Number, default: 0 }
  },

  w: {
    lastClaim: { type: Date, default: null }
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
