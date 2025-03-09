import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  bookmarkPost,
  followAndUnfollowUser,
  getAllUsers,
  getBookmarkPosts,
  myProfile,
  removePostFromBookmark,
  updatePassword,
  updateProfile,
  userFollowerAndFollowingData,
  userProfile,
} from "../controllers/userControllers.js";
import uploadFile from "../middlewares/multers.js";
const router = express.Router();
router.get("/me", isAuth, myProfile);
router.get("/all", isAuth, getAllUsers);
router.get("/bookmarks", isAuth, getBookmarkPosts);
router.post("/bookmark/:postId", isAuth, bookmarkPost);
router.delete("/removebookmark/:postId", isAuth, removePostFromBookmark);
router.get("/:id", isAuth, userProfile);
router.post("/:id", isAuth, updatePassword);
router.put("/:id", isAuth, uploadFile, updateProfile);
router.post("/follow/:id", isAuth, followAndUnfollowUser);
router.get("/followdata/:id", isAuth, userFollowerAndFollowingData);

export default router;
