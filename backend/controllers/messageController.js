import { Message } from "../models/messageModel.js";
import { User } from "../models/userModel.js";

// Get chat messages between two users
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "firstName lastName username profileImg")
      .populate("receiver", "firstName lastName username profileImg");

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    // Check if users follow each other
    const [sender, receiver] = await Promise.all([
      User.findById(req.user._id),
      User.findById(receiverId),
    ]);

    const mutualFollow =
      sender.followings.includes(receiverId) &&
      receiver.followings.includes(req.user._id);

    if (!mutualFollow) {
      return res.status(403).json({
        message:
          "You can only send messages to users who follow you and you follow them",
      });
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
    });

    const populatedMessage = await Message.populate(newMessage, [
      { path: "sender", select: "firstName lastName username profileImg" },
      { path: "receiver", select: "firstName lastName username profileImg" },
    ]);

    // Emit the message through Socket.IO (will be handled in socket setup)
    req.app.get("io").to(receiverId).emit("message", populatedMessage);

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ message: "Error sending message" });
  }
};

// Get chat list (users with whom the current user has chatted)
export const getChatList = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "firstName lastName username profileImg")
      .populate("receiver", "firstName lastName username profileImg");

    // Get unique users from messages
    const chatUsers = new Set();
    messages.forEach((message) => {
      if (message.sender._id.toString() !== req.user._id.toString()) {
        chatUsers.add(JSON.stringify(message.sender));
      }
      if (message.receiver._id.toString() !== req.user._id.toString()) {
        chatUsers.add(JSON.stringify(message.receiver));
      }
    });

    const uniqueChatUsers = Array.from(chatUsers).map((user) =>
      JSON.parse(user)
    );

    res.status(200).json({ users: uniqueChatUsers });
  } catch (error) {
    console.error("Error in getChatList:", error);
    res.status(500).json({ message: "Error fetching chat list" });
  }
};
