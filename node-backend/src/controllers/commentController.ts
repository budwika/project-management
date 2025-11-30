import { Response } from "express";
import { Comment } from "../models";
import { ApiResponse } from "../types";
import { AuthRequest } from "../middleware/auth";

// Get comments for a specific entity (project, task, change request)
export const getComments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { entityType, entityId } = req.params;
    const { page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get top-level comments with replies
    const comments = await Comment.find({
      [`${entityType}`]: entityId,
      parentComment: null,
    })
      .populate("author", "name email avatar")
      .populate("mentions", "name email")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "name email avatar",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Comment.countDocuments({
      [`${entityType}`]: entityId,
      parentComment: null,
    });

    res.status(200).json({
      success: true,
      data: {
        data: comments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
      message: "Comments retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve comments",
      error: error.message,
    } as ApiResponse);
  }
};

// Create a new comment
export const createComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { content, mentions, parentComment } = req.body;

    const comment = new Comment({
      content,
      author: user._id,
      mentions: mentions || [],
      parentComment: parentComment || null,
    });

    await comment.save();

    // Populate the created comment
    await comment.populate([
      { path: "author", select: "name email avatar" },
      { path: "mentions", select: "name email" },
    ]);

    res.status(201).json({
      success: true,
      data: comment,
      message: "Comment created successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create comment",
      error: error.message,
    } as ApiResponse);
  }
};

// Update a comment
export const updateComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { content } = req.body;

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({
        success: false,
        message: "Comment not found",
      } as ApiResponse);
      return;
    }

    // Check if user can edit this comment (only author within 24 hours)
    const hoursSinceCreated = Math.floor(
      (new Date().getTime() - new Date(comment.createdAt).getTime()) /
        (1000 * 60 * 60)
    );
    const canEdit =
      comment.author.toString() === user._id.toString() &&
      hoursSinceCreated < 24;

    if (!canEdit) {
      res.status(403).json({
        success: false,
        message: "You can only edit your own comments within 24 hours",
      } as ApiResponse);
      return;
    }

    comment.content = content;
    await comment.save();

    await comment.populate([
      { path: "author", select: "name email avatar" },
      { path: "mentions", select: "name email" },
    ]);

    res.status(200).json({
      success: true,
      data: comment,
      message: "Comment updated successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update comment",
      error: error.message,
    } as ApiResponse);
  }
};

// Delete a comment
export const deleteComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({
        success: false,
        message: "Comment not found",
      } as ApiResponse);
      return;
    }

    // Check if user can delete this comment (author within 48 hours or admin)
    const hoursSinceCreated = Math.floor(
      (new Date().getTime() - new Date(comment.createdAt).getTime()) /
        (1000 * 60 * 60)
    );
    const canDelete =
      user.role === "admin" ||
      (comment.author.toString() === user._id.toString() &&
        hoursSinceCreated < 48);

    if (!canDelete) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to delete this comment",
      } as ApiResponse);
      return;
    }

    // Delete all replies first
    await Comment.deleteMany({ parentComment: id });

    // Delete the comment
    await Comment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message,
    } as ApiResponse);
  }
};
