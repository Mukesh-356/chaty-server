const express = require("express");
const router = express.Router();
const {
  getOnlineUsers,
  sendMessage,
  getMessages
} = require("../controllers/chatController");

router.get("/users", getOnlineUsers);
router.post("/send", sendMessage);
router.get("/messages", getMessages);

module.exports = router;
