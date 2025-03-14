import { User } from "../models/userModel.js";
import { Post } from "../models/postModel.js";
import bcrypt from "bcrypt";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("followers", "username firstName lastName profileImg")
      .populate("followings", "username firstName lastName profileImg");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single user
export const getSingleUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "username firstName lastName profileImg bio website")
      .populate("followings", "username firstName lastName profileImg bio website");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Validate website URL if provided
    if (updates.website) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlPattern.test(updates.website)) {
        return res.status(400).json({ message: "Invalid website URL format" });
      }
    }

    // Validate bio length
    if (updates.bio && updates.bio.length > 160) {
      return res.status(400).json({ message: "Bio must not exceed 160 characters" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update allowed fields
    const allowedUpdates = [
      "firstName",
      "lastName",
      "username",
      "profileImg",
      "profileBg",
      "bio",
      "website"
    ];
    
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Follow user
export const followUser = async (req, res) => {
  try {
    const { followUserId } = req.params;
    const userId = req.user._id;

    const userToFollow = await User.findById(followUserId);
    const currentUser = await User.findById(userId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToFollow.followers.includes(userId)) {
      // Unfollow
      userToFollow.followers = userToFollow.followers.filter(
        (id) => id.toString() !== userId.toString()
      );
      currentUser.followings = currentUser.followings.filter(
        (id) => id.toString() !== followUserId.toString()
      );
    } else {
      // Follow
      userToFollow.followers.push(userId);
      currentUser.followings.push(followUserId);
    }

    await userToFollow.save();
    await currentUser.save();

    res.json({ userToFollow, currentUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Bookmark post
export const bookmarkPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!user.bookmarks.includes(postId)) {
      user.bookmarks.push(postId);
      await user.save();
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove bookmark
export const removeBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    
    user.bookmarks = user.bookmarks.filter(
      (id) => id.toString() !== postId.toString()
    );
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user bookmarks
export const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: "bookmarks",
      populate: {
        path: "creator",
        select: "username firstName lastName profileImg bio website",
      },
    });
    res.json(user.bookmarks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 