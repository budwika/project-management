import { Response } from "express";
import { Project, User } from "../models";
import {
  ApiResponse,
  CreateProjectRequest,
  PaginationQuery,
  PaginatedResponse,
} from "../types";
import { AuthRequest } from "../middleware/auth";

// Get all projects with pagination and filtering
export const getProjects = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      page = "1",
      limit = "10",
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    }: PaginationQuery = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter based on user role
    let filter: any = {};

    if (user.role === "client") {
      filter.client = user._id;
    } else if (user.role === "employee") {
      filter.$or = [{ projectManager: user._id }, { teamMembers: user._id }];
    }
    // Admin can see all projects (no filter)

    // Add search filter if provided
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get projects with populated data
    const projects = await Project.find(filter)
      .populate("client", "name email")
      .populate("projectManager", "name email")
      .populate("teamMembers", "name email")
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Project.countDocuments(filter);

    const response: PaginatedResponse<any> = {
      data: projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    };

    res.status(200).json({
      success: true,
      data: response,
      message: "Projects retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve projects",
      error: error.message,
    } as ApiResponse);
  }
};

// Get single project by ID
export const getProjectById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate("client", "name email avatar")
      .populate("projectManager", "name email avatar")
      .populate("teamMembers", "name email avatar");

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
      message: "Project retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve project",
      error: error.message,
    } as ApiResponse);
  }
};

// Create new project
export const createProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      name,
      description,
      client,
      teamMembers,
      startDate,
      endDate,
      priority,
      budget,
      estimatedHours,
      tags,
    }: CreateProjectRequest = req.body;

    // Verify client exists and has client role
    const clientUser = await User.findOne({
      _id: client as any,
      role: "client",
    });
    if (!clientUser) {
      res.status(400).json({
        success: false,
        message: "Invalid client ID or user is not a client",
      } as ApiResponse);
      return;
    }

    // Verify team members exist and have employee role
    if (teamMembers && teamMembers.length > 0) {
      const members = await User.find({
        _id: { $in: teamMembers as any },
        role: { $in: ["admin", "employee"] },
      });

      if (members.length !== teamMembers.length) {
        res.status(400).json({
          success: false,
          message: "Some team members are invalid or not employees",
        } as ApiResponse);
        return;
      }
    }

    // Create project
    const project = new Project({
      name,
      description,
      client,
      projectManager: user._id,
      teamMembers: teamMembers || [],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      priority: priority || "medium",
      budget,
      estimatedHours,
      tags: tags || [],
    });

    await project.save();

    // Populate the created project
    await project.populate([
      { path: "client", select: "name email" },
      { path: "projectManager", select: "name email" },
      { path: "teamMembers", select: "name email" },
    ]);

    res.status(201).json({
      success: true,
      data: project,
      message: "Project created successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error.message,
    } as ApiResponse);
  }
};

// Update project
export const updateProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    // If client is being updated, verify it exists and has client role
    if (updates.client) {
      const clientUser = await User.findOne({
        _id: updates.client,
        role: "client",
      });
      if (!clientUser) {
        res.status(400).json({
          success: false,
          message: "Invalid client ID or user is not a client",
        } as ApiResponse);
        return;
      }
    }

    // If team members are being updated, verify they exist and have employee role
    if (updates.teamMembers && updates.teamMembers.length > 0) {
      const members = await User.find({
        _id: { $in: updates.teamMembers },
        role: { $in: ["admin", "employee"] },
      });

      if (members.length !== updates.teamMembers.length) {
        res.status(400).json({
          success: false,
          message: "Some team members are invalid or not employees",
        } as ApiResponse);
        return;
      }
    }

    // Update dates if provided
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }

    const project = await Project.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "client", select: "name email" },
      { path: "projectManager", select: "name email" },
      { path: "teamMembers", select: "name email" },
    ]);

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
      message: "Project updated successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: error.message,
    } as ApiResponse);
  }
};

// Delete project
export const deleteProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      } as ApiResponse);
      return;
    }

    // Also delete all tasks related to this project
    const { Task } = await import("../models");
    await Task.deleteMany({ project: id as any });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error: error.message,
    } as ApiResponse);
  }
};

// Get project statistics
export const getProjectStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;

    // Build filter based on user role
    let filter: any = {};

    if (user.role === "client") {
      filter.client = user._id;
    } else if (user.role === "employee") {
      filter.$or = [{ projectManager: user._id }, { teamMembers: user._id }];
    }

    const stats = await Project.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgProgress: { $avg: "$progress" },
          totalBudget: { $sum: "$budget" },
        },
      },
    ]);

    const totalProjects = await Project.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        statusBreakdown: stats,
      },
      message: "Project statistics retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve project statistics",
      error: error.message,
    } as ApiResponse);
  }
};
