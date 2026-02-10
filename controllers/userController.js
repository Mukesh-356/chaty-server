const User = require("../models/UserModel");
const Admin = require("../models/AdminModel");
const os = require("os");

// Get local device IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

// Register User
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: "Email already registered" });
  }

  const user = new User({ username, email, password });
  await user.save();
  res.json({ success: true, message: "User registered successfully" });
};

// Login User with WiFi IP validation
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const currentIP = getLocalIP();

  const admin = await Admin.findOne({ username: "admin123" });
  if (!admin.allowedIPs.includes(currentIP)) {
    return res.status(403).json({ success: false, message: "Access denied: WiFi not allowed" });
  }

  user.ipAddress = currentIP;
  user.loginTime = new Date();
  await user.save();

  res.json({ success: true, message: "Login successful", ip: currentIP });
};

module.exports = { registerUser, loginUser };
