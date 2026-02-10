const Admin = require("../models/AdminModel");

// Admin login
const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  if (username === "admin123" && password === "admin@123") {
    return res.json({ success: true, message: "Admin login successful" });
  } else {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
};

// Add IP to allowed list
const addIP = async (req, res) => {
  const { ip } = req.body;

  const admin = await Admin.findOne({ username: "admin123" });
  if (!admin.allowedIPs.includes(ip)) {
    admin.allowedIPs.push(ip);
    await admin.save();
    return res.json({ success: true, message: "IP added successfully" });
  } else {
    return res.json({ success: false, message: "IP already exists" });
  }
};

// Remove IP
const removeIP = async (req, res) => {
  const { ip } = req.body;

  const admin = await Admin.findOne({ username: "admin123" });
  admin.allowedIPs = admin.allowedIPs.filter(storedIP => storedIP !== ip);
  await admin.save();

  return res.json({ success: true, message: "IP removed successfully" });
};

module.exports = { adminLogin, addIP, removeIP };
