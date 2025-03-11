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
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const token = authHeader.split(" ")[1]; // Extract the token
    const decoded = jwt.verify(token, process.env.JWT_SEC);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    console.error("Socket auth error:", err);
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.userId);
  connectedUsers.set(socket.userId, socket.id);

  // Emit online users to all clients
  io.emit("onlineUsers", Array.from(connectedUsers.keys()));

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
    connectedUsers.delete(socket.userId);
    io.emit("userDisconnected", socket.userId);
    io.emit("onlineUsers", Array.from(connectedUsers.keys()));
  });

  // Join a chat room
  socket.on("joinChat", (receiverId) => {
    const roomId = [socket.userId, receiverId].sort().join("-");
    socket.join(roomId);
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
      const messages = await Message.find({
        $or: [
          { sender: socket.userId, receiver: receiverId },
          { sender: receiverId, receiver: socket.userId },
        ],
      })
        .sort({ timestamp: 1 })
        .lean();

      console.log("Found messages:", messages);
      socket.emit("chatHistory", messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      socket.emit("error", { message: "Failed to fetch chat history" });
    }
  });

  // Handle new messages
  socket.on("sendMessage", async ({ receiver, content, timestamp }) => {
    try {
      console.log("Received message:", { receiver, content, timestamp });

      // Create and save the message
      const message = new Message({
        sender: socket.userId,
        receiver,
        content,
        timestamp: new Date(timestamp), // Parse the ISO string to Date
      });
      await message.save();

      const savedMessage = await Message.findById(message._id)
        .lean()
        .then(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString() // Convert back to ISO string
        }));
        
      console.log("Saved message:", savedMessage);

      // Get the receiver's socket ID
      const receiverSocketId = connectedUsers.get(receiver);

      // Send to sender
      socket.emit("newMessage", savedMessage);

      // Send to receiver if online
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", savedMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
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

// Start the server
httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  connectDB();
});
