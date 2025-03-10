import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", isAuth, getNotifications);
router.put("/:notificationId/read", isAuth, markAsRead);
router.put("/read-all", isAuth, markAllAsRead);

export default router; 