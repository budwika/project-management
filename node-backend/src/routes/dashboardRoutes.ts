import { Router } from "express";
import {
  getDashboardStats,
  getProjectProgress,
  getTaskDistribution,
  getMyTasks,
  getUpcomingDeadlines,
} from "../controllers/dashboardController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Routes
router.get("/stats", authenticate, getDashboardStats);
router.get("/projects/progress", authenticate, getProjectProgress);
router.get("/tasks/distribution", authenticate, getTaskDistribution);
router.get("/my-tasks", authenticate, getMyTasks);
router.get("/deadlines", authenticate, getUpcomingDeadlines);

export default router;
