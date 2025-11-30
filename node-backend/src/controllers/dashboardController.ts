import { Response } from "express";
import { Project, Task, User } from "../models";
import { ApiResponse, DashboardStats, ActivityLog } from "../types";
import { AuthRequest } from "../middleware/auth";

// Get dashboard statistics
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;

    // Build filter based on user role
    let projectFilter: any = {};
    let taskFilter: any = {};

    if (user.role === "client") {
      projectFilter.client = user._id;
      const userProjects = await Project.find({ client: user._id }).select(
        "_id"
      );
      taskFilter.project = { $in: userProjects.map((p) => p._id) };
    } else if (user.role === "employee") {
      projectFilter.$or = [
        { projectManager: user._id },
        { teamMembers: user._id },
      ];
      const userProjects = await Project.find(projectFilter).select("_id");
      taskFilter.project = { $in: userProjects.map((p) => p._id) };
    }
    // Admin can see all (no filter)

    // Get project statistics
    const totalProjects = await Project.countDocuments(projectFilter);
    const activeProjects = await Project.countDocuments({
      ...projectFilter,
      status: "active",
    });
    const completedProjects = await Project.countDocuments({
      ...projectFilter,
      status: "completed",
    });

    // Get task statistics
    const totalTasks = await Task.countDocuments(taskFilter);
    const completedTasks = await Task.countDocuments({
      ...taskFilter,
      status: "completed",
    });
    const overdueTasks = await Task.countDocuments({
      ...taskFilter,
      status: { $ne: "completed" },
      dueDate: { $lt: new Date() },
    });

    // Get team member count (for admins and project managers)
    let totalTeamMembers = 0;
    if (user.role === "admin") {
      totalTeamMembers = await User.countDocuments({
        role: { $in: ["admin", "employee"] },
        isActive: true,
      });
    } else if (user.role === "employee") {
      const managedProjects = await Project.find({ projectManager: user._id });
      const teamMemberIds = new Set();
      managedProjects.forEach((project) => {
        project.teamMembers.forEach((memberId) =>
          teamMemberIds.add(memberId.toString())
        );
      });
      totalTeamMembers = teamMemberIds.size;
    }

    // Get recent activities (simplified)
    const recentProjects = await Project.find(projectFilter)
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("name status updatedAt");

    const recentTasks = await Task.find(taskFilter)
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("project", "name")
      .select("title status updatedAt project");

    const recentActivities: ActivityLog[] = [
      ...recentProjects.map((project) => ({
        id: project._id.toString(),
        type: "project_updated" as any,
        description: `Project "${project.name}" was updated`,
        user: "System",
        relatedEntity: {
          type: "project" as const,
          id: project._id.toString(),
          name: project.name,
        },
        timestamp: project.updatedAt,
      })),
      ...recentTasks.map((task) => ({
        id: task._id.toString(),
        type: "task_updated" as any,
        description: `Task "${task.title}" was updated`,
        user: "System",
        relatedEntity: {
          type: "task" as const,
          id: task._id.toString(),
          name: task.title,
        },
        timestamp: task.updatedAt,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);

    const stats: DashboardStats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalTeamMembers,
      recentActivities,
    };

    res.status(200).json({
      success: true,
      data: stats,
      message: "Dashboard statistics retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard statistics",
      error: error.message,
    } as ApiResponse);
  }
};

// Get project progress overview
export const getProjectProgress = async (
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

    const projects = await Project.find(filter)
      .select("name progress status startDate endDate priority")
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      data: projects,
      message: "Project progress overview retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve project progress",
      error: error.message,
    } as ApiResponse);
  }
};

// Get task distribution by status
export const getTaskDistribution = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;

    // Build filter based on user role
    let projectFilter: any = {};

    if (user.role === "client") {
      projectFilter.client = user._id;
    } else if (user.role === "employee") {
      projectFilter.$or = [
        { projectManager: user._id },
        { teamMembers: user._id },
      ];
    }

    const userProjects = await Project.find(projectFilter).select("_id");
    const taskFilter = { project: { $in: userProjects.map((p) => p._id) } };

    const distribution = await Task.aggregate([
      { $match: taskFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: distribution,
      message: "Task distribution retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve task distribution",
      error: error.message,
    } as ApiResponse);
  }
};

// Get my assigned tasks
export const getMyTasks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;

    const tasks = await Task.find({ assignedTo: user._id })
      .populate("project", "name status")
      .sort({ dueDate: 1, priority: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: tasks,
      message: "My tasks retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve my tasks",
      error: error.message,
    } as ApiResponse);
  }
};

// Get upcoming deadlines
export const getUpcomingDeadlines = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;

    // Build filter based on user role
    let projectFilter: any = {};

    if (user.role === "client") {
      projectFilter.client = user._id;
    } else if (user.role === "employee") {
      projectFilter.$or = [
        { projectManager: user._id },
        { teamMembers: user._id },
      ];
    }

    const userProjects = await Project.find(projectFilter).select("_id");

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingTasks = await Task.find({
      project: { $in: userProjects.map((p) => p._id) },
      dueDate: { $gte: new Date(), $lte: nextWeek },
      status: { $ne: "completed" },
    })
      .populate("project", "name")
      .populate("assignedTo", "name email")
      .sort({ dueDate: 1 });

    const upcomingProjects = await Project.find({
      ...projectFilter,
      endDate: { $gte: new Date(), $lte: nextWeek },
      status: { $ne: "completed" },
    })
      .select("name endDate status progress")
      .sort({ endDate: 1 });

    res.status(200).json({
      success: true,
      data: {
        tasks: upcomingTasks,
        projects: upcomingProjects,
      },
      message: "Upcoming deadlines retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve upcoming deadlines",
      error: error.message,
    } as ApiResponse);
  }
};
