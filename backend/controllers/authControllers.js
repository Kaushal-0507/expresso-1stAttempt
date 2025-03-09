import { User } from "../models/userModel.js";
import generateToken from "../utils/generateTokens.js";
import TryCatch from "../utils/TryCatch.js";
import getDataUrl from "../utils/urlGenerator.js";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";

export const registerUser = TryCatch(async (req, res) => {
  const { firstName, lastName, email, username, password } = req.body;

  if (!firstName || !email || !username || !password) {
    return res.status(400).json({
      message: "Please give all values",
    });
  }

  let user = await User.findOne({ email });

  if (user)
    return res.status(400).json({
      message: "User Already Exist",
    });

  const hashPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    firstName,
    lastName,
    email,
    username,
    password: hashPassword,
  });

  const encodedToken = generateToken(user._id, res);

  res.status(201).json({
    message: "User Registered",
    createdUser: user,
    encodedToken,
  });
});

export const loginUser = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.status(400).json({
      message: "Invalid Credentials",
    });

  const comparePassword = await bcrypt.compare(password, user.password);

  if (!comparePassword)
    return res.status(400).json({
      message: "Invalid Credentials",
    });

  const encodedToken = generateToken(user._id, res);

  res.json({
    message: "User Logged in",
    foundUser: user,
    encodedToken,
  });
});

export const logoutUser = TryCatch((req, res) => {
  res.cookie("token", "", { maxAge: 0 });

  res.json({
    message: "Logged out successfully",
  });
});
