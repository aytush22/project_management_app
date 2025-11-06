import mongoose from "mongoose";
import { config } from "./app.config.js";
const connectDatabase = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Error connnecting to the database");
    process.exit(1);
  }
};

export default connectDatabase;
