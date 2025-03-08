import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { Notification } from "../models/notificationModel.js";

const router = express.Router();

// Fetch notifications for the logged-in user
router.get("/notifications", isAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }) // Sort by most recent
      .populate("sender", "username"); // Populate sender details

    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

export default router;
