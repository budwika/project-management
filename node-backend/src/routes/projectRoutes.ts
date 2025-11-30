import { Router } from "express";
import { body, param } from "express-validator";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
} from "../controllers/projectController";
import {
  authenticate,
  authorize,
  checkProjectAccess,
} from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

// Validation middleware
const createProjectValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Project name must be between 1 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Description must be between 1 and 2000 characters"),
  body("client").isMongoId().withMessage("Valid client ID is required"),
  body("teamMembers")
    .optional()
    .isArray()
    .withMessage("Team members must be an array"),
  body("teamMembers.*")
    .optional()
    .isMongoId()
    .withMessage("Each team member must be a valid user ID"),
  body("startDate").isISO8601().withMessage("Start date must be a valid date"),
  body("endDate").isISO8601().withMessage("End date must be a valid date"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Priority must be one of: low, medium, high, critical"),
  body("budget").optional().isNumeric().withMessage("Budget must be a number"),
  body("estimatedHours")
    .optional()
    .isNumeric()
    .withMessage("Estimated hours must be a number"),
  handleValidationErrors,
];

const updateProjectValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Project name must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Description must be between 1 and 2000 characters"),
  body("client")
    .optional()
    .isMongoId()
    .withMessage("Valid client ID is required"),
  body("teamMembers")
    .optional()
    .isArray()
    .withMessage("Team members must be an array"),
  body("teamMembers.*")
    .optional()
    .isMongoId()
    .withMessage("Each team member must be a valid user ID"),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  body("status")
    .optional()
    .isIn(["planning", "active", "on-hold", "completed", "cancelled"])
    .withMessage(
      "Status must be one of: planning, active, on-hold, completed, cancelled"
    ),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Priority must be one of: low, medium, high, critical"),
  body("progress")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Progress must be between 0 and 100"),
  handleValidationErrors,
];

const projectIdValidation = [
  param("id").isMongoId().withMessage("Valid project ID is required"),
  handleValidationErrors,
];

// Routes
router.get("/", authenticate, getProjects);
router.get("/stats", authenticate, getProjectStats);
router.get(
  "/:id",
  authenticate,
  projectIdValidation,
  checkProjectAccess,
  getProjectById
);
router.post(
  "/",
  authenticate,
  authorize("admin", "employee"),
  createProjectValidation,
  createProject
);
router.put(
  "/:id",
  authenticate,
  authorize("admin", "employee"),
  projectIdValidation,
  checkProjectAccess,
  updateProjectValidation,
  updateProject
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "employee"),
  projectIdValidation,
  checkProjectAccess,
  deleteProject
);

export default router;
