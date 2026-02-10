const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config(); //  loads .env from current working dir (server/)

const Admin = require("../models/AdminModel");

console.log(" Debug MONGO_URI:", process.env.MONGO_URI); // add this debug

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  const existingAdmin = await Admin.findOne({ username: "admin123" });
  if (existingAdmin) {
    console.log("⚠️ Admin already exists");
    process.exit();
  }

  const newAdmin = new Admin({
    username: "admin123",
    password: "admin@123",
    allowedIPs: [],
  });

  await newAdmin.save();
  console.log("✅ Admin created successfully");
  process.exit();
})
.catch((err) => {
  console.log("❌ DB Error:", err);
});
