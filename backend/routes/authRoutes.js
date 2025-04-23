import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/authControllers.js";
import uploadFile from "../middlewares/multers.js";

const router = express.Router();

// Check authentication status
router.get("/check", isAuth, async (req, res) => {
  try {
    // Since isAuth middleware already adds user to req, we just need to send it back
    const user = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      username: req.user.username,
      profilePic: req.user.profilePic,
      followers: req.user.followers,
      followings: req.user.followings,
    };
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Validate token endpoint
router.get("/validate-token", isAuth, (req, res) => {
  try {
    // If we reach here, the token is valid (isAuth middleware passed)
    res.status(200).json({
      success: true,
      message: "Token is valid",
      user: {
        id: req.user._id,
        email: req.user.email,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
});

router.post("/register", uploadFile, registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);

export default router;
