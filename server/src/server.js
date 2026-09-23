import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { logger } from "./config/logger.js";
import { scheduleWarrantyReminders } from "./jobs/warrantyReminderJob.js";

async function start() {
  let server;
  try {
    await connectDB();
    scheduleWarrantyReminders();

    server = app.listen(env.PORT, () => {
      logger.info(
        `DigiWarranty API listening on port ${env.PORT} [${env.NODE_ENV}]`,
      );
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      try {
        await disconnectDB();
      } catch (err) {
        logger.warn("Error during DB disconnect", { error: err.message });
      }
      server.close(() => process.exit(0));
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (err) => {
      logger.error("Unhandled rejection", {
        error: err.message,
        stack: err.stack,
      });
      if (server) server.close(() => process.exit(1));
      else process.exit(1);
    });
  } catch (err) {
    logger.error("Startup failed", { error: err.message, stack: err.stack });
    if (server) server.close(() => process.exit(1));
    else process.exit(1);
  }
}

start();
