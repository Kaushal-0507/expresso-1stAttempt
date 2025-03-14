import { User } from "../models/userModel.js";

export const isAdmin = async (req, res, next) => {
  try {
    console.log("\n--- Admin Check ---");
    console.log("User ID from request:", req.user?._id);

    const user = await User.findById(req.user._id);
    console.log("Found user:", {
      id: user?._id,
      email: user?.email,
      role: user?.role,
    });

    if (!user) {
      console.log("No user found with ID:", req.user._id);
      return res.status(403).json({
        success: false,
        message: "Access denied: User not found",
      });
    }

    if (user.role !== "admin") {
      console.log("User is not an admin. Current role:", user.role);
      return res.status(403).json({
        success: false,
        message: "Access denied: Admin privileges required",
      });
    }

    console.log("Admin check passed successfully");
    console.log("----------------\n");
    next();
  } catch (error) {
    console.error("Admin middleware error:", error.message);
    console.error("Full error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
