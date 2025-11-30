import { Router } from "express";
import { body, param } from "express-validator";
import {
  getChangeRequests,
  getChangeRequestById,
  createChangeRequest,
  updateChangeRequest,
  deleteChangeRequest,
  getChangeRequestStats,
} from "../controllers/changeRequestController";
import { authenticate, authorize } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

// Validation middleware
const createChangeRequestValidation = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 1, max: 3000 })
    .withMessage("Description must be between 1 and 3000 characters"),
  body("project").isMongoId().withMessage("Valid project ID is required"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Priority must be one of: low, medium, high, critical"),
  body("estimatedHours")
    .optional()
    .isNumeric()
    .withMessage("Estimated hours must be a number"),
  body("estimatedCost")
    .optional()
    .isNumeric()
    .withMessage("Estimated cost must be a number"),
  handleValidationErrors,
];

const updateChangeRequestValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 1, max: 3000 })
    .withMessage("Description must be between 1 and 3000 characters"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Priority must be one of: low, medium, high, critical"),
  body("status")
    .optional()
    .isIn(["pending", "approved", "rejected", "implemented"])
    .withMessage(
      "Status must be one of: pending, approved, rejected, implemented"
    ),
  body("estimatedHours")
    .optional()
    .isNumeric()
    .withMessage("Estimated hours must be a number"),
  body("estimatedCost")
    .optional()
    .isNumeric()
    .withMessage("Estimated cost must be a number"),
  handleValidationErrors,
];

const changeRequestIdValidation = [
  param("id").isMongoId().withMessage("Valid change request ID is required"),
  handleValidationErrors,
];

// Routes
router.get("/", authenticate, getChangeRequests);
router.get("/stats", authenticate, getChangeRequestStats);
router.get(
  "/:id",
  authenticate,
  changeRequestIdValidation,
  getChangeRequestById
);
router.post(
  "/",
  authenticate,
  createChangeRequestValidation,
  createChangeRequest
);
router.put(
  "/:id",
  authenticate,
  changeRequestIdValidation,
  updateChangeRequestValidation,
  updateChangeRequest
);
router.delete(
  "/:id",
  authenticate,
  changeRequestIdValidation,
  deleteChangeRequest
);

export default router;
