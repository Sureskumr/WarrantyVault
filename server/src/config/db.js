import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

mongoose.set("strictQuery", true);

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info(
      `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`,
    );
  } catch (err) {
    logger.error("MongoDB connection failed", {
      error: err.message,
      stack: err.stack,
    });
    // Rethrow so the caller can decide how to handle startup failures
    throw err;
  }

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
