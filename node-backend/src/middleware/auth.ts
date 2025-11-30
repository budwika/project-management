import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../models";
import { IUser } from "../types";

// Extend Request interface to include user
export interface AuthRequest extends Request {
  user?: IUser;
}

// Authentication middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "Invalid token or user not active",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Authorization middleware - check if user has required role
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

// Project access middleware - check if user has access to specific project
export const checkProjectAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { Project } = await import("../models");
    const projectId = req.params.id || req.params.projectId || req.body.project;
    const user = req.user!;

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    // Admin can access all projects
    if (user.role === "admin") {
      next();
      return;
    }

    // Check if user is client of the project
    if (
      user.role === "client" &&
      project.client.toString() === user._id.toString()
    ) {
      next();
      return;
    }

    // Check if user is project manager or team member
    if (
      user.role === "employee" &&
      (project.projectManager.toString() === user._id.toString() ||
        project.teamMembers.some(
          (memberId) => memberId.toString() === user._id.toString()
        ))
    ) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: "Access denied to this project",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking project access",
    });
  }
};

// Task access middleware
export const checkTaskAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { Task, Project } = await import("../models");
    const taskId = req.params.taskId || req.params.id;
    const user = req.user!;

    const task = await Task.findById(taskId).populate("project");

    if (!task) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      });
      return;
    }

    const project = task.project as any;

    // Admin can access all tasks
    if (user.role === "admin") {
      next();
      return;
    }

    // Check if user is client of the project
    if (
      user.role === "client" &&
      project.client.toString() === user._id.toString()
    ) {
      next();
      return;
    }

    // Check if user is project manager, team member, or assigned to task
    if (
      user.role === "employee" &&
      (project.projectManager.toString() === user._id.toString() ||
        project.teamMembers.some(
          (memberId: any) => memberId.toString() === user._id.toString()
        ) ||
        (task.assignedTo && task.assignedTo.toString() === user._id.toString()))
    ) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: "Access denied to this task",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking task access",
    });
  }
};
