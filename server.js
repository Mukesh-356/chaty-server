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
const messageRoutes = require("./routes/messageRoutes"); // ✅ NEW

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/network", networkRoutes);
app.use("/api/messages", messageRoutes); // ✅ NEW

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Online Users Mapping
let onlineUsers = {}; // username -> socket.id

// Socket.IO Chat Handling
io.on("connection", (socket) => {
  // Join
  socket.on("user-joined", (username) => {
    socket.username = username;
    onlineUsers[username] = socket.id;
    console.log(`✅ ${username} connected`);
    io.emit("update-user-list", Object.keys(onlineUsers));
  });

  // Typing Indicator
  socket.on("typing", (username) => {
    socket.broadcast.emit("user-typing", username);
  });

  socket.on("stop-typing", (username) => {
    socket.broadcast.emit("user-stop-typing", username);
  });

  // Message (Text / File) - group or direct
  socket.on("chat-message", async (msg) => {
    const fullMsg = {
      ...msg,
      status: msg.username === socket.username ? "✅✅" : "✅",
      timestamp: new Date(),
    };

    // ✅ Save message to MongoDB
    try {
      await Message.create(fullMsg);
    } catch (err) {
      console.error("❌ Failed to store message:", err);
    }

    // Direct message
    if (msg.to && onlineUsers[msg.to]) {
      const receiverSocketId = onlineUsers[msg.to];
      const senderSocketId = socket.id;
      io.to(receiverSocketId).emit("receive-message", fullMsg);
      io.to(senderSocketId).emit("receive-message", fullMsg);
    } else {
      // Group message
      io.emit("receive-message", fullMsg);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    const username = socket.username;
    if (username && onlineUsers[username]) {
      delete onlineUsers[username];
      console.log(`❌ ${username} disconnected`);
      io.emit("update-user-list", Object.keys(onlineUsers));
    }
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
