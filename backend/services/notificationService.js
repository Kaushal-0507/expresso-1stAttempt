import { Notification } from "../models/notificationModel.js";

export const createNotification = async (recipientId, senderId, type, postId = null, comment = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId,
      comment,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}; 