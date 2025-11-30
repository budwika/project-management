import { Router } from "express";
import { body, param } from "express-validator";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getKanbanBoard,
  updateTaskPositions,
} from "../controllers/taskController";
import {
  authenticate,
  authorize,
  checkTaskAccess,
  checkProjectAccess,
} from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

// Validation middleware
const createTaskValidation = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Task title must be between 1 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Description must be between 1 and 2000 characters"),
  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Assigned user must be a valid user ID"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Priority must be one of: low, medium, high, critical"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
  body("estimatedHours")
    .optional()
    .isNumeric()
    .withMessage("Estimated hours must be a number"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("dependencies")
    .optional()
    .isArray()
    .withMessage("Dependencies must be an array"),
  body("dependencies.*")
    .optional()
    .isMongoId()
    .withMessage("Each dependency must be a valid task ID"),
  handleValidationErrors,
];

const updateTaskValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Task title must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Description must be between 1 and 2000 characters"),
  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Assigned user must be a valid user ID"),
  body("status")
    .optional()
    .isIn(["todo", "in-progress", "in-review", "completed"])
    .withMessage(
      "Status must be one of: todo, in-progress, in-review, completed"
    ),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Priority must be one of: low, medium, high, critical"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
  body("estimatedHours")
    .optional()
    .isNumeric()
    .withMessage("Estimated hours must be a number"),
  body("actualHours")
    .optional()
    .isNumeric()
    .withMessage("Actual hours must be a number"),
  body("position")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Position must be a non-negative integer"),
  handleValidationErrors,
];

const taskIdValidation = [
  param("id").isMongoId().withMessage("Valid task ID is required"),
  handleValidationErrors,
];

const projectIdValidation = [
  param("project").isMongoId().withMessage("Valid project ID is required"),
  handleValidationErrors,
];

const updatePositionsValidation = [
  body("tasks").isArray().withMessage("Tasks must be an array"),
  body("tasks.*.id").isMongoId().withMessage("Each task must have a valid ID"),
  body("tasks.*.position")
    .isInt({ min: 0 })
    .withMessage("Each task must have a valid position"),
  body("tasks.*.status")
    .isIn(["todo", "in-progress", "in-review", "completed"])
    .withMessage("Each task must have a valid status"),
  handleValidationErrors,
];

// Routes

// General task routes
router.get("/", authenticate, getTasks);

// Project-specific task routes
router.get(
  "/project/:project",
  authenticate,
  projectIdValidation,
  checkProjectAccess,
  getTasks
);
router.get(
  "/project/:project/kanban",
  authenticate,
  projectIdValidation,
  checkProjectAccess,
  getKanbanBoard
);
router.post(
  "/project/:project",
  authenticate,
  authorize("admin", "employee"),
  projectIdValidation,
  checkProjectAccess,
  createTaskValidation,
  createTask
);

// Task-specific routes
router.get(
  "/:id",
  authenticate,
  taskIdValidation,
  checkTaskAccess,
  getTaskById
);
router.put(
  "/:id",
  authenticate,
  authorize("admin", "employee"),
  taskIdValidation,
  checkTaskAccess,
  updateTaskValidation,
  updateTask
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "employee"),
  taskIdValidation,
  checkTaskAccess,
  deleteTask
);

// Special routes
router.put(
  "/positions/update",
  authenticate,
  authorize("admin", "employee"),
  updatePositionsValidation,
  updateTaskPositions
);

export default router;
