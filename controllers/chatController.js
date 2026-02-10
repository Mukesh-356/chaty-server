const Chat = require("../models/ChatModel");
const User = require("../models/UserModel");

//  Get all users
const getOnlineUsers = async (req, res) => {
  const users = await User.find({}, "username ipAddress");
  res.json({ users });
};

//  Send message
const sendMessage = async (req, res) => {
  const { sender, receiver, message } = req.body;

  const newMessage = new Chat({
    sender,
    receiver,
    message,
  });

  await newMessage.save();
  res.json({ success: true, message: "Message sent!" });
};

//  Get chat history
const getMessages = async (req, res) => {
  const { user1, user2 } = req.query;

  const messages = await Chat.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
    ]
  });

  res.json({ messages });
};

module.exports = {
  getOnlineUsers,
  sendMessage,
  getMessages
};
