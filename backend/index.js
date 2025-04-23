import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./database/db.js";
import cloudinary from "cloudinary";
import cookieParser from "cookie-parser";
import { isAuth } from "./middlewares/isAuth.js";
import { User } from "./models/userModel.js";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Message } from "./models/messageModel.js";
import adminRoutes from "./routes/adminRoutes.js";

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  },
});

// Store socket connections
const connectedUsers = new Map();

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const authHeader = socket.handshake.auth.token;

  if (!authHeader) {
    console.error("No auth header provided");
    return next(new Error("Authentication error: No token provided"));
  }

  // Remove 'Bearer ' prefix if it exists
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.substring(7) 
    : authHeader;

  if (!token) {
    console.error("No token found in auth header");
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SEC);
    if (!decoded || !decoded.id) {
      console.error("Invalid token payload:", decoded);
      return next(new Error("Authentication error: Invalid token payload"));
    }
    socket.userId = decoded.id;
    next();
  } catch (err) {
    console.error("Socket auth error:", err);
    if (err.name === "JsonWebTokenError") {
      return next(new Error("Authentication error: Invalid token format"));
    }
    if (err.name === "TokenExpiredError") {
      return next(new Error("Authentication error: Token expired"));
    }
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.userId);

  // Add user to connected users and broadcast to all clients
  connectedUsers.set(socket.userId, socket.id);
  io.emit("onlineUsers", Array.from(connectedUsers.keys()));

  // Broadcast when user goes offline
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
    connectedUsers.delete(socket.userId);
    io.emit("onlineUsers", Array.from(connectedUsers.keys()));
  });

  // Join a chat room
  socket.on("joinChat", (receiverId) => {
    const roomId = [socket.userId, receiverId].sort().join("-");
    socket.join(roomId);
    console.log(`User ${socket.userId} joined room ${roomId}`);
  });

  // Get chat history
  socket.on("getChatHistory", async (receiverId) => {
    try {
      console.log(
        "Fetching chat history between",
        socket.userId,
        "and",
        receiverId
      );

      if (!socket.userId || !receiverId) {
        console.error("Missing user IDs for chat history");
        socket.emit("error", { message: "Missing user information" });
        return;
      }

      const messages = await Message.find({
        $or: [
          { sender: socket.userId, receiver: receiverId },
          { sender: receiverId, receiver: socket.userId },
        ],
      })
        .populate('sender', 'username firstName lastName')
        .populate('receiver', 'username firstName lastName')
        .sort({ createdAt: 1 })
        .lean();

      console.log("Found messages:", messages.length);
      
      const formattedMessages = messages.map((msg) => {
        // Ensure we have a valid timestamp
        const timestamp = msg.createdAt || msg.timestamp || new Date();
        
        return {
          ...msg,
          timestamp: timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString(),
          sender: msg.sender ? {
            _id: msg.sender._id,
            username: msg.sender.username,
            firstName: msg.sender.firstName,
            lastName: msg.sender.lastName
          } : null,
          receiver: msg.receiver ? {
            _id: msg.receiver._id,
            username: msg.receiver.username,
            firstName: msg.receiver.firstName,
            lastName: msg.receiver.lastName
          } : null
        };
      });

      socket.emit("chatHistory", formattedMessages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      socket.emit("error", { 
        message: "Failed to fetch chat history",
        details: error.message 
      });
    }
  });

  // Handle new messages
  socket.on("sendMessage", async (messageData) => {
    try {
      const { receiver, content, timestamp } = messageData;
      console.log("Received message:", messageData);

      if (!socket.userId || !receiver || !content) {
        throw new Error("Missing required message data");
      }

      // Create and save the message
      const message = new Message({
        sender: socket.userId,
        receiver,
        content,
        timestamp: new Date(timestamp),
      });

      const savedMessage = await message.save();
      
      // Populate sender and receiver details
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate('sender', 'username firstName lastName')
        .populate('receiver', 'username firstName lastName')
        .lean();

      const messageToSend = {
        ...populatedMessage,
        timestamp: populatedMessage.timestamp.toISOString(),
        sender: {
          _id: populatedMessage.sender._id,
          username: populatedMessage.sender.username,
          firstName: populatedMessage.sender.firstName,
          lastName: populatedMessage.sender.lastName
        },
        receiver: {
          _id: populatedMessage.receiver._id,
          username: populatedMessage.receiver.username,
          firstName: populatedMessage.receiver.firstName,
          lastName: populatedMessage.receiver.lastName
        }
      };

      console.log("Saved message:", messageToSend);

      // Get room ID
      const roomId = [socket.userId, receiver].sort().join("-");

      // Emit to the room (both sender and receiver if they're in the room)
      io.to(roomId).emit("newMessage", messageToSend);

      // If receiver is not in the room but is online, send directly
      const receiverSocketId = connectedUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", messageToSend);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { 
        message: "Failed to send message",
        details: error.message 
      });
    }
  });
});

// Make io accessible to routes
app.set("io", io);

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.Cloudinary_Cloud_Name,
  api_key: process.env.Cloudinary_Api,
  api_secret: process.env.Cloudinary_Secret,
});

// Configure CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Using middleware
app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 7000;

// Basic route
app.get("/", (req, res) => {
  res.send("Server Working");
});

// Route to get all users (commented out for now)
// app.get("/api/user/all", isAuth, async (req, res) => {
//   try {
//     const search = req.query.search || "";
//     const users = await User.find({
//       name: {
//         $regex: search,
//         $options: "i",
//       },
//       _id: { $ne: req.user._id },
//     }).select("-password");

//     res.json(users);
//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// });

// Importing routes
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

// Using routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);

// Start the server
httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  connectDB();
});
