import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    profileBg: {
      type: String,
      default: "https://i.redd.it/gocxo6n16m871.png",
    },
    profileImg: {
      type: String,
      default: "https://tse2.mm.bing.net/th?id=OIP.r-l3mhddNzm7351sOrTNjgHaHa&pid=Api&P=0&h=180",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: "",
      maxLength: 160
    },
    website: {
      type: String,
      default: "",
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty string
          return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
        },
        message: "Please enter a valid URL"
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post", // Assuming you have a "Post" model for bookmarked posts
        default: [], // Initialize as an empty array
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
