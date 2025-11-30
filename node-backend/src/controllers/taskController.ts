import { Response } from "express";
import { Task, Project, User } from "../models";
import {
  ApiResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  PaginationQuery,
} from "../types";
import { AuthRequest } from "../middleware/auth";

// Get all tasks with filtering and pagination
export const getTasks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      page = "1",
      limit = "10",
      search = "",
      sortBy = "position",
      sortOrder = "asc",
      status,
      priority,
      assignedTo,
      project: projectId,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter based on user role and permissions
    let filter: any = {};

    // If project is specified, add to filter
    if (projectId) {
      filter.project = projectId;

      // Verify user has access to this project
      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404).json({
          success: false,
          message: "Project not found",
        } as ApiResponse);
        return;
      }

      // Check project access
      if (
        user.role === "client" &&
        project.client.toString() !== user._id.toString()
      ) {
        res.status(403).json({
          success: false,
          message: "Access denied to this project",
        } as ApiResponse);
        return;
      }

      if (user.role === "employee") {
        const hasAccess =
          project.projectManager.toString() === user._id.toString() ||
          project.teamMembers.some(
            (memberId) => memberId.toString() === user._id.toString()
          );

        if (!hasAccess) {
          res.status(403).json({
            success: false,
            message: "Access denied to this project",
          } as ApiResponse);
          return;
        }
      }
    } else {
      // No specific project, filter based on user role
      if (user.role === "client") {
        const userProjects = await Project.find({ client: user._id }).select(
          "_id"
        );
        filter.project = { $in: userProjects.map((p) => p._id) };
      } else if (user.role === "employee") {
        const userProjects = await Project.find({
          $or: [{ projectManager: user._id }, { teamMembers: user._id }],
        }).select("_id");
        filter.project = { $in: userProjects.map((p) => p._id) };
      }
    }

    // Add additional filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Add search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    const tasks = await Task.find(filter)
      .populate("project", "name status")
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email")
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        data: tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
      message: "Tasks retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve tasks",
      error: error.message,
    } as ApiResponse);
  }
};

// Get single task by ID
export const getTaskById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate("project", "name status client projectManager teamMembers")
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("dependencies", "title status priority");

    if (!task) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
      message: "Task retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve task",
      error: error.message,
    } as ApiResponse);
  }
};

// Create new task
export const createTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { project: projectId } = req.params;
    const {
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      estimatedHours,
      tags,
      dependencies,
    }: CreateTaskRequest = req.body;

    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      } as ApiResponse);
      return;
    }

    // Verify assigned user exists and has appropriate role
    if (assignedTo) {
      const assignedUser = await User.findOne({
        _id: assignedTo as any,
        role: { $in: ["admin", "employee"] },
      });

      if (!assignedUser) {
        res.status(400).json({
          success: false,
          message: "Assigned user not found or invalid role",
        } as ApiResponse);
        return;
      }
    }

    // Get the highest position for ordering
    const lastTask = await Task.findOne({ project: projectId as any })
      .sort({ position: -1 })
      .select("position");

    const position = lastTask ? lastTask.position + 1 : 0;

    // Create task
    const task = new Task({
      title,
      description,
      project: projectId as any,
      assignedTo: assignedTo || null,
      createdBy: user._id,
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours,
      tags: tags || [],
      dependencies: dependencies || [],
      position,
    });

    await task.save();

    // Populate the created task
    await task.populate([
      { path: "project", select: "name status" },
      { path: "assignedTo", select: "name email avatar" },
      { path: "createdBy", select: "name email" },
    ]);

    res.status(201).json({
      success: true,
      data: task,
      message: "Task created successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message,
    } as ApiResponse);
  }
};

// Update task
export const updateTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: UpdateTaskRequest = req.body;

    // Remove fields that shouldn't be updated directly
    delete (updates as any)._id;
    delete (updates as any).createdAt;
    delete (updates as any).updatedAt;
    delete (updates as any).project;
    delete (updates as any).createdBy;

    // If assignedTo is being updated, verify the user exists and has appropriate role
    if (updates.assignedTo) {
      const assignedUser = await User.findOne({
        _id: updates.assignedTo as any,
        role: { $in: ["admin", "employee"] },
      });

      if (!assignedUser) {
        res.status(400).json({
          success: false,
          message: "Assigned user not found or invalid role",
        } as ApiResponse);
        return;
      }
    }

    // Update due date if provided
    if (updates.dueDate) {
      (updates as any).dueDate = new Date(updates.dueDate);
    }

    const task = await Task.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "project", select: "name status" },
      { path: "assignedTo", select: "name email avatar" },
      { path: "createdBy", select: "name email" },
    ]);

    if (!task) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
      message: "Task updated successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    } as ApiResponse);
  }
};

// Delete task
export const deleteTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({
        success: false,
        message: "Task not found",
      } as ApiResponse);
      return;
    }

    // Check if task can be deleted (no dependencies)
    const canDelete = await (task as any).canBeDeleted();
    if (!canDelete) {
      res.status(400).json({
        success: false,
        message: "Cannot delete task: other tasks depend on this task",
      } as ApiResponse);
      return;
    }

    await Task.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    } as ApiResponse);
  }
};

// Get tasks grouped by status (Kanban board)
export const getKanbanBoard = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { project: projectId } = req.params;

    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      } as ApiResponse);
      return;
    }

    const tasks = await Task.find({ project: projectId as any })
      .populate("assignedTo", "name email avatar")
      .sort({ position: 1 });

    // Group tasks by status
    const kanbanBoard = {
      todo: tasks.filter((task) => task.status === "todo"),
      "in-progress": tasks.filter((task) => task.status === "in-progress"),
      "in-review": tasks.filter((task) => task.status === "in-review"),
      completed: tasks.filter((task) => task.status === "completed"),
    };

    res.status(200).json({
      success: true,
      data: kanbanBoard,
      message: "Kanban board retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve Kanban board",
      error: error.message,
    } as ApiResponse);
  }
};

// Update task positions for drag and drop
export const updateTaskPositions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { tasks } = req.body; // Array of { id, position, status }

    const updatePromises = tasks.map((taskUpdate: any) =>
      Task.findByIdAndUpdate(
        taskUpdate.id,
        {
          position: taskUpdate.position,
          status: taskUpdate.status,
        },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Task positions updated successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update task positions",
      error: error.message,
    } as ApiResponse);
  }
};
