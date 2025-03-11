import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  getMessages,
  sendMessage,
  getChatList,
} from "../controllers/messageController.js";

const router = express.Router();

// All routes are protected
router.use(isAuth);

// Get chat list
router.get("/chats", getChatList);

// Get messages with a specific user
router.get("/:userId", getMessages);

// Send a message
router.post("/send", sendMessage);

export default router;
