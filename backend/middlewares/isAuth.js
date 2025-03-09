import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract the token from the header

    const decodedData = jwt.verify(token, process.env.JWT_SEC);

    if (!decodedData) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    req.user = await User.findById(decodedData.id);

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized: Please Login" });
  }
};
