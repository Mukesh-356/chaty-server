const mongoose = require("mongoose");

const LoginHistorySchema = new mongoose.Schema({
  username: String,
  loginTime: Date,
  logoutTime: Date,
  duration: String,
});

module.exports = mongoose.model("LoginHistory", LoginHistorySchema);
