import { User } from "../models/userModel.js";
import TryCatch from "../utils/TryCatch.js";
import getDataUrl from "../utils/urlGenerator.js";
import cloudinary from "cloudinary";
import bcrypt from "bcrypt";
import { createNotification } from "../services/notificationService.js";

export const myProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  res.json(user);
});

export const getAllUsers = TryCatch(async (req, res) => {
  try {
    const search = req.query.search || "";
    const users = await User.find({}).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
})

export const userProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password").populate("followers", "-password")
  .populate("followings", "-password");;

  if (!user)
    return res.status(404).json({
      message: "No User with is id",
    });

  res.json(user);
});

export const followAndUnfollowUser = TryCatch(async (req, res) => {
  const user = await User.findById(req.params.id);
  const loggedInUser = await User.findById(req.user._id);

  if (!user)
    return res.status(404).json({
      message: "No User with is id",
    });

  if (user._id.toString() === loggedInUser._id.toString())
    return res.status(400).json({
      message: "You can't follow yourself",
    });

  if (user.followers.includes(loggedInUser._id)) {
    const indexFollowing = loggedInUser.followings.indexOf(user._id);
    const indexFollower = user.followers.indexOf(loggedInUser._id);

    loggedInUser.followings.splice(indexFollowing, 1);
    user.followers.splice(indexFollower, 1);

    await loggedInUser.save();
    await user.save();

    // Create notification for unfollow
    await createNotification(user._id, loggedInUser._id, "unfollow");

    res.json({
      message: "User Unfollowed",
      user: loggedInUser,
      followUser: user
    });
  } else {
    loggedInUser.followings.push(user._id);
    user.followers.push(loggedInUser._id);

    await loggedInUser.save();
    await user.save();

    // Create notification for follow
    await createNotification(user._id, loggedInUser._id, "follow");

    res.json({
      message: "User Followed",
      user: loggedInUser,
      followUser: user
    });
  }
});

export const userFollowerAndFollowingData = TryCatch(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("followers", "-password")
    .populate("followings", "-password");

  const followers = user.followers;
  const followings = user.followings;

  res.json({
    followers,
    followings,
  });
});

export const updateProfile = TryCatch(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update basic info
    const { bio, portfolio, profileImg, profileBg } = req.body;
    
    if (bio !== undefined) user.bio = bio;
    if (portfolio !== undefined) user.portfolio = portfolio;
    if (profileImg !== undefined) user.profileImg = profileImg;
    if (profileBg !== undefined) user.profileBg = profileBg;

    await user.save();

    // Return updated user data
    const updatedUser = await User.findById(user._id).select("-password");
    
    res.status(201).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message
    });
  }
});

export const updatePassword = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { oldPassword, newPassword } = req.body;

  const comparePassword = await bcrypt.compare(oldPassword, user.password);

  if (!comparePassword)
    return res.status(400).json({
      message: "Wrong old password",
    });

  user.password = await bcrypt.hash(newPassword, 10);

  await user.save();

  res.json({
    message: "Password Updated",
  });
});

export const getBookmarkPosts = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id).select("bookmarks");

  if (!user) {
    return res.status(404).json({
      errors: ["The username you entered is not Registered. Not Found error"],
    });
  }

  res.status(200).json({ bookmarks: user.bookmarks });
});

export const bookmarkPost = TryCatch(async (req, res) => {
  const { postId } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      errors: ["The username you entered is not Registered. Not Found error"],
    });
  }

  // Ensure bookmarks is initialized
  if (!user.bookmarks) {
    user.bookmarks = []; // Initialize if undefined
  }

  // Check if the post is already bookmarked
  const isBookmarked = user.bookmarks.some(
    (currPostId) => currPostId.toString() === postId
  );

  if (isBookmarked) {
    return res
      .status(400)
      .json({ errors: ["This Post is already bookmarked"] });
  }

  // Add the post to bookmarks
  user.bookmarks.push(postId);
  await user.save();

  // const newPosts = await Post.find({}).populate("owner", "-password")

  res.status(200).json({ bookmarks: user.bookmarks });
});

export const removePostFromBookmark = TryCatch(async (req, res) => {
  const { postId } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      errors: ["The username you entered is not Registered. Not Found error"],
    });
  }

  // Ensure bookmarks is initialized
  if (!user.bookmarks) {
    user.bookmarks = []; // Initialize if undefined
  }

  // Check if the post is bookmarked
  const isBookmarked = user.bookmarks.some(
    (currPostId) => currPostId.toString() === postId
  );

  if (!isBookmarked) {
    return res.status(400).json({ errors: ["Post not bookmarked yet"] });
  }

  // Remove the post from bookmarks
  user.bookmarks = user.bookmarks.filter(
    (currPostId) => currPostId.toString() !== postId
  );

  await user.save();

  res.status(200).json({ bookmarks: user.bookmarks });
});
