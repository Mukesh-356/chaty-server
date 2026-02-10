// 📁 server/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const Admin = require("../models/AdminModel");
const LoginHistory = require("../models/LoginHistoryModel"); // ✅ Import added

// ✅ Admin Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    if (admin.password !== password) {
      return res.json({ success: false, message: "Invalid password" });
    }

    res.json({ success: true, message: "Admin login successful" });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get all allowed IPs
router.get("/allowed-ips", async (req, res) => {
  try {
    const admin = await Admin.findOne({ username: "admin123" });
    if (!admin) return res.status(404).json({ success: false });
    res.json({ allowedIPs: admin.allowedIPs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Add a new IP
router.post("/add-ip", async (req, res) => {
  const { ip } = req.body;
  try {
    const admin = await Admin.findOne({ username: "admin123" });
    if (!admin) return res.status(404).json({ success: false });

    if (!admin.allowedIPs.includes(ip)) {
      admin.allowedIPs.push(ip);
      await admin.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Remove an IP
router.post("/remove-ip", async (req, res) => {
  const { ip } = req.body;
  try {
    const admin = await Admin.findOne({ username: "admin123" });
    if (!admin) return res.status(404).json({ success: false });

    admin.allowedIPs = admin.allowedIPs.filter(item => item !== ip);
    await admin.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ New: Get all user login history (for Admin Dashboard)
router.get("/login-history", async (req, res) => {
  try {
    const history = await LoginHistory.find().sort({ loginTime: -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    console.error("❌ Login history fetch error:", err);
    res.status(500).json({ success: false, message: "Error fetching login history" });
  }
});

module.exports = router;
