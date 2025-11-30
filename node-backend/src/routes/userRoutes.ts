import { Router } from "express";
import { param } from "express-validator";
import {
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
  getUsersByRole,
  getUserStats,
} from "../controllers/userController";
import { authenticate, authorize } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

// Validation middleware
const userIdValidation = [
  param("id").isMongoId().withMessage("Valid user ID is required"),
  handleValidationErrors,
];

const roleValidation = [
  param("role")
    .isIn(["admin", "employee", "client"])
    .withMessage("Role must be one of: admin, employee, client"),
  handleValidationErrors,
];

// Routes

// Get all users (admin only)
router.get("/", authenticate, authorize("admin"), getUsers);

// Get user statistics (admin only)
router.get("/stats", authenticate, authorize("admin"), getUserStats);

// Get users by role
router.get("/role/:role", authenticate, roleValidation, getUsersByRole);

// Get, update, activate/deactivate specific user
router.get("/:id", authenticate, userIdValidation, getUserById);
router.put("/:id", authenticate, userIdValidation, updateUser);
router.put(
  "/:id/deactivate",
  authenticate,
  authorize("admin"),
  userIdValidation,
  deactivateUser
);
router.put(
  "/:id/activate",
  authenticate,
  authorize("admin"),
  userIdValidation,
  activateUser
);

export default router;
