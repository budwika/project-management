import mongoose from "mongoose";

class Database {
  private static instance: Database;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      const mongoUri =
        process.env.MONGODB_URI ||
        "mongodb://localhost:27017/project_management_db";

      await mongoose.connect(mongoUri, {
        // Connection options for better performance and reliability
      });

      console.log("✅ Connected to MongoDB successfully");

      // Handle connection events
      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("⚠️ MongoDB disconnected");
      });

      // Handle application termination
      process.on("SIGINT", this.gracefulShutdown);
      process.on("SIGTERM", this.gracefulShutdown);
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  }

  private gracefulShutdown = async (): Promise<void> => {
    try {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed gracefully");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during MongoDB shutdown:", error);
      process.exit(1);
    }
  };

  public async disconnect(): Promise<void> {
    await mongoose.connection.close();
  }
}

export default Database;
