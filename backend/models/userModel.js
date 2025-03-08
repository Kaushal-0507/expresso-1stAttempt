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
      default:
        "https://static1.srcdn.com/wordpress/wp-content/uploads/2020/07/Andy-Samberg-as-Jake-Peralta-in-Brooklyn-Nine-Nine.jpghttps://static1.srcdn.com/wordpress/wp-content/uploads/2020/07/Andy-Samberg-as-Jake-Peralta-in-Brooklyn-Nine-Nine.jpg",
    },
    profileImg: {
      type: String,
      default:
        "https://66.media.tumblr.com/74ef112cead7f1f4afce7893a96e3484/tumblr_oyal5v3s4z1r5aju9o2_1280.jpg",
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
