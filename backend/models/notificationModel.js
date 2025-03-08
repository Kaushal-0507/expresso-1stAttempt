import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["like", "follow", "comment"], // Types of notifications
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the user who triggered the notification
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the user receiving the notification
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post", // Reference to the post (if applicable)
    },
    comment: {
      type: String, // Comment text (if applicable)
    },
    read: {
      type: Boolean,
      default: false, // Mark as read/unread
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
