import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

// Import routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import commentRoutes from "./routes/commentRoutes";
import changeRequestRoutes from "./routes/changeRequestRoutes";

// Import middleware
import { errorHandler, notFoundHandler } from "./middleware/validation";

// Import database
import Database from "./utils/database";

// Load environment variables
dotenv.config();

class App {
  public app: Application;
  private database: Database;

  constructor() {
    this.app = express();
    this.database = Database.getInstance();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandlers();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: {
        success: false,
        message: "Too many requests from this IP, please try again later.",
      },
    });
    this.app.use(limiter);

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logging middleware
    if (process.env.NODE_ENV === "development") {
      this.app.use(morgan("combined"));
    } else {
      this.app.use(morgan("combined"));
    }

    // Serve static files (for uploaded files)
    this.app.use(
      "/uploads",
      express.static(path.join(__dirname, "../uploads"))
    );
  }

  private initializeRoutes(): void {
    // Health check route
    this.app.get("/health", (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: "Server is running!",
        timestamp: new Date().toISOString(),
      });
    });

    // API routes
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/users", userRoutes);
    this.app.use("/api/projects", projectRoutes);
    this.app.use("/api/tasks", taskRoutes);
    this.app.use("/api/dashboard", dashboardRoutes);
    this.app.use("/api/comments", commentRoutes);
    this.app.use("/api/change-requests", changeRequestRoutes);

    // API documentation route (placeholder)
    this.app.get("/api", (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: "Project Management API",
        version: "1.0.0",
        endpoints: {
          auth: "/api/auth",
          users: "/api/users",
          projects: "/api/projects",
          tasks: "/api/tasks",
          dashboard: "/api/dashboard",
          comments: "/api/comments",
          changeRequests: "/api/change-requests",
        },
      });
    });
  }

  private initializeErrorHandlers(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async connectDatabase(): Promise<void> {
    await this.database.connect();
  }

  public getApp(): Application {
    return this.app;
  }

  public async start(port: number): Promise<void> {
    try {
      await this.connectDatabase();

      this.app.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
        console.log(`📊 API Documentation: http://localhost:${port}/api`);
        console.log(`🔗 Health Check: http://localhost:${port}/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      });
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }
}

export default App;
