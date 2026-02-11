console.log("MONGO URL:", process.env.MONGO_URL);

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const socketIO = require("socket.io");
const Message = require("./models/MessageModel");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const networkRoutes = require("./routes/networkRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/network", networkRoutes);
app.use("/api/messages", messageRoutes);

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

/* ================== MONGODB CONNECT FIX ================== */
mongoose
  .connect(process.env.MONGO_URL, {   // 🔥 FIX HERE (MONGO_URL)
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("🔥 MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));
/* ========================================================= */

// Online Users Mapping
let onlineUsers = {};

// Socket.IO
io.on("connection", (socket) => {

  socket.on("user-joined", (username) => {
    socket.username = username;
    onlineUsers[username] = socket.id;
    console.log(`✅ ${username} connected`);
    io.emit("update-user-list", Object.keys(onlineUsers));
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("user-typing", username);
  });

  socket.on("stop-typing", () => {
    socket.broadcast.emit("user-stop-typing");
  });

  // Message send
  socket.on("chat-message", async (msg) => {
    const fullMsg = {
      ...msg,
      status: msg.username === socket.username ? "✅✅" : "✓",
      timestamp: new Date(),
    };

    // Save DB
    try {
      await Message.create(fullMsg);
    } catch (err) {
      console.error("❌ Failed to store message:", err);
    }

    // Direct
    if (msg.to && onlineUsers[msg.to]) {
      const receiver = onlineUsers[msg.to];
      io.to(receiver).emit("receive-message", fullMsg);
      io.to(socket.id).emit("receive-message", fullMsg);
    } else {
      io.emit("receive-message", fullMsg);
    }
  });

  socket.on("disconnect", () => {
    const username = socket.username;
    if (username && onlineUsers[username]) {
      delete onlineUsers[username];
      console.log(`❌ ${username} disconnected`);
      io.emit("update-user-list", Object.keys(onlineUsers));
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
