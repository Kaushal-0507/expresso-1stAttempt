import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: "ExpressoProject",
    });
    console.log("Connected To MongoDB");
  } catch (error) {
    console.log("error detected");
  }
};
