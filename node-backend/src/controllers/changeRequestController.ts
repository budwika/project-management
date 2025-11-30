import { Response } from "express";
import { ChangeRequest, Project, User } from "../models";
import { ApiResponse } from "../types";
import { AuthRequest } from "../middleware/auth";

// Get all change requests with filtering
export const getChangeRequests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { page = "1", limit = "10", status, priority, projectId } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter based on user role
    let filter: any = {};

    if (user.role === "client") {
      filter.requestedBy = user._id;
    } else if (user.role === "employee") {
      // Employees can see change requests for projects they're involved in
      const projects = await Project.find({
        $or: [{ projectManager: user._id }, { teamMembers: user._id }],
      });
      filter.project = { $in: projects.map((p) => p._id) };
    }
    // Admin can see all change requests

    // Add additional filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (projectId) filter.project = projectId;

    const changeRequests = await ChangeRequest.find(filter)
      .populate("project", "name status")
      .populate("requestedBy", "name email avatar")
      .populate("approvedBy", "name email")
      .populate("implementedBy", "name email")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "name email avatar",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await ChangeRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        data: changeRequests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
      message: "Change requests retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve change requests",
      error: error.message,
    } as ApiResponse);
  }
};

// Get single change request by ID
export const getChangeRequestById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const changeRequest = await ChangeRequest.findById(id)
      .populate("project", "name status")
      .populate("requestedBy", "name email avatar")
      .populate("approvedBy", "name email avatar")
      .populate("implementedBy", "name email avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "name email avatar",
        },
      });

    if (!changeRequest) {
      res.status(404).json({
        success: false,
        message: "Change request not found",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: changeRequest,
      message: "Change request retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve change request",
      error: error.message,
    } as ApiResponse);
  }
};

// Create new change request
export const createChangeRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      title,
      description,
      project,
      priority,
      estimatedHours,
      estimatedCost,
    } = req.body;

    // Verify project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      res.status(400).json({
        success: false,
        message: "Project not found",
      } as ApiResponse);
      return;
    }

    // Only clients can create change requests for their projects
    // Admins and employees can create change requests for any project they have access to
    if (
      user.role === "client" &&
      projectDoc.client.toString() !== user._id.toString()
    ) {
      res.status(403).json({
        success: false,
        message: "You can only create change requests for your own projects",
      } as ApiResponse);
      return;
    }

    // For employees, check if they have access to the project
    if (user.role === "employee") {
      const hasAccess =
        projectDoc.projectManager.toString() === user._id.toString() ||
        projectDoc.teamMembers.some(
          (memberId: any) => memberId.toString() === user._id.toString()
        );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: "You don't have access to this project",
        } as ApiResponse);
        return;
      }
    }

    const changeRequest = new ChangeRequest({
      title,
      description,
      project,
      requestedBy: user._id,
      priority: priority || "medium",
      estimatedHours,
      estimatedCost,
    });

    await changeRequest.save();

    // Populate the created change request
    await changeRequest.populate([
      { path: "project", select: "name status" },
      { path: "requestedBy", select: "name email avatar" },
    ]);

    res.status(201).json({
      success: true,
      data: changeRequest,
      message: "Change request created successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create change request",
      error: error.message,
    } as ApiResponse);
  }
};

// Update change request
export const updateChangeRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.requestedBy;
    delete updates.project;

    const changeRequest = await ChangeRequest.findById(id);

    if (!changeRequest) {
      res.status(404).json({
        success: false,
        message: "Change request not found",
      } as ApiResponse);
      return;
    }

    // Check permissions
    const canEdit =
      user.role === "admin" ||
      (user.role === "client" &&
        changeRequest.requestedBy.toString() === user._id.toString()) ||
      (user.role === "employee" &&
        ["pending", "approved"].includes(changeRequest.status));

    if (!canEdit) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to update this change request",
      } as ApiResponse);
      return;
    }

    // Handle status changes
    if (updates.status) {
      if (
        updates.status === "approved" &&
        user.role !== "admin" &&
        user.role !== "employee"
      ) {
        res.status(403).json({
          success: false,
          message: "Only admins and employees can approve change requests",
        } as ApiResponse);
        return;
      }

      if (updates.status === "approved") {
        updates.approvedBy = user._id;
      }

      if (updates.status === "implemented") {
        updates.implementedBy = user._id;
      }
    }

    const updatedChangeRequest = await ChangeRequest.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: "project", select: "name status" },
      { path: "requestedBy", select: "name email avatar" },
      { path: "approvedBy", select: "name email" },
      { path: "implementedBy", select: "name email" },
    ]);

    res.status(200).json({
      success: true,
      data: updatedChangeRequest,
      message: "Change request updated successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update change request",
      error: error.message,
    } as ApiResponse);
  }
};

// Delete change request
export const deleteChangeRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const changeRequest = await ChangeRequest.findById(id);

    if (!changeRequest) {
      res.status(404).json({
        success: false,
        message: "Change request not found",
      } as ApiResponse);
      return;
    }

    // Only admin or the requestor can delete change requests
    if (
      user.role !== "admin" &&
      changeRequest.requestedBy.toString() !== user._id.toString()
    ) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to delete this change request",
      } as ApiResponse);
      return;
    }

    // Can't delete if already implemented
    if (changeRequest.status === "implemented") {
      res.status(400).json({
        success: false,
        message: "Cannot delete implemented change requests",
      } as ApiResponse);
      return;
    }

    await ChangeRequest.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Change request deleted successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete change request",
      error: error.message,
    } as ApiResponse);
  }
};

// Get change request statistics
export const getChangeRequestStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;

    // Build filter based on user role
    let filter: any = {};
    if (user.role === "client") {
      filter.requestedBy = user._id;
    } else if (user.role === "employee") {
      const projects = await Project.find({
        $or: [{ projectManager: user._id }, { teamMembers: user._id }],
      });
      filter.project = { $in: projects.map((p) => p._id) };
    }

    const stats = await ChangeRequest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgEstimatedHours: { $avg: "$estimatedHours" },
          avgEstimatedCost: { $avg: "$estimatedCost" },
        },
      },
    ]);

    const total = await ChangeRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        total,
        statusBreakdown: stats,
      },
      message: "Change request statistics retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve change request statistics",
      error: error.message,
    } as ApiResponse);
  }
};
