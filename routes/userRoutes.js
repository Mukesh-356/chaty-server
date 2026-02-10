const express = require("express");
const router = express.Router();
const User = require("../models/UserModel");
const Admin = require("../models/AdminModel");
const LoginHistory = require("../models/LoginHistoryModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

//  IST Date Helper
const toIST = (date) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

//  File upload config
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, //10MB max
});

//  USER REGISTRATION
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ success: false, message: "Username already exists" });
    }

    const newUser = new User({
      username,
      email,
      password,
      ip: "",
      loginTime: null,
      isOnline: false,
    });

    await newUser.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//  USER LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password, ip } = req.body;

    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const admin = await Admin.findOne({ username: "admin123" });
    if (!admin || !admin.allowedIPs.includes(ip)) {
      return res.json({ success: false, message: "IP not allowed" });
    }

    const loginTime = toIST(new Date());

    // Update user state
    user.loginTime = loginTime;
    user.ip = ip;
    user.isOnline = true;
    await user.save();

    // Record login in history
    await LoginHistory.create({
      username,
      loginTime,
      logoutTime: null,
      duration: null,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//  USER LOGOUT
router.post("/logout", async (req, res) => {
  try {
    const { username } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Mark user offline
    user.isOnline = false;
    await user.save();

    // Get last login history entry without logout
    const lastLogin = await LoginHistory.findOne({
      username,
      logoutTime: null,
    }).sort({ loginTime: -1 });

    if (lastLogin) {
      const logoutTime = toIST(new Date());
      const durationMs = logoutTime - lastLogin.loginTime;
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);

      lastLogin.logoutTime = logoutTime;
      lastLogin.duration = `${minutes}m ${seconds}s`;

      await lastLogin.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Logout Error:", err);
    res.status(500).json({ success: false, message: "Logout failed" });
  }
});

// ✅ FILE UPLOAD
router.post("/upload", upload.single("file"), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const newFileName = `${Date.now()}_${file.originalname}`;
    const newPath = path.join("uploads", newFileName);
    fs.renameSync(file.path, newPath);

    res.json({
      success: true,
      filename: file.originalname,
      url: `http://localhost:5000/uploads/${newFileName}`,
    });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({ success: false, message: "File upload failed" });
  }
});

module.exports = router;
