import { Router } from "express";
import { body, param } from "express-validator";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController";
import { authenticate } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";

const router = Router();

// Validation middleware
const createCommentValidation = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment content must be between 1 and 2000 characters"),
  body("mentions")
    .optional()
    .isArray()
    .withMessage("Mentions must be an array"),
  body("mentions.*")
    .optional()
    .isMongoId()
    .withMessage("Each mention must be a valid user ID"),
  body("parentComment")
    .optional()
    .isMongoId()
    .withMessage("Parent comment must be a valid comment ID"),
  handleValidationErrors,
];

const updateCommentValidation = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment content must be between 1 and 2000 characters"),
  handleValidationErrors,
];

const commentIdValidation = [
  param("id").isMongoId().withMessage("Valid comment ID is required"),
  handleValidationErrors,
];

// Routes
router.get("/:entityType/:entityId", authenticate, getComments);
router.post("/", authenticate, createCommentValidation, createComment);
router.put(
  "/:id",
  authenticate,
  commentIdValidation,
  updateCommentValidation,
  updateComment
);
router.delete("/:id", authenticate, commentIdValidation, deleteComment);

export default router;
