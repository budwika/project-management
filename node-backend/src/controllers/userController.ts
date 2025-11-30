import { Response } from "express";
import { User } from "../models";
import { ApiResponse, PaginationQuery } from "../types";
import { AuthRequest } from "../middleware/auth";

// Get all users (admin only)
export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "10",
      search = "",
      role = "",
      isActive = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    let filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    if (role) filter.role = role;
    if (isActive !== "") filter.isActive = isActive === "true";

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    const users = await User.find(filter)
      .select("-password")
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
      message: "Users retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: error.message,
    } as ApiResponse);
  }
};

// Get single user by ID
export const getUserById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    // Users can only view their own profile unless they're admin
    if (currentUser.role !== "admin" && currentUser._id.toString() !== id) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      } as ApiResponse);
      return;
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "User retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
      error: error.message,
    } as ApiResponse);
  }
};

// Update user (admin only, except for own profile)
export const updateUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Only admin can update other users' critical fields
    if (currentUser._id.toString() !== id && currentUser.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied",
      } as ApiResponse);
      return;
    }

    // Non-admin users can only update their own basic info
    if (currentUser.role !== "admin" && currentUser._id.toString() === id) {
      // Limit what regular users can update about themselves
      const allowedUpdates = ["name", "position", "department", "avatar"];
      const updateKeys = Object.keys(updates);
      const isValidUpdate = updateKeys.every((key) =>
        allowedUpdates.includes(key)
      );

      if (!isValidUpdate) {
        res.status(400).json({
          success: false,
          message: "You can only update name, position, department, and avatar",
        } as ApiResponse);
        return;
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "User updated successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    } as ApiResponse);
  }
};

// Deactivate user (admin only)
export const deactivateUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    // Prevent self-deactivation
    if (currentUser._id.toString() === id) {
      res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      } as ApiResponse);
      return;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "User deactivated successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to deactivate user",
      error: error.message,
    } as ApiResponse);
  }
};

// Activate user (admin only)
export const activateUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "User activated successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to activate user",
      error: error.message,
    } as ApiResponse);
  }
};

// Get users by role (for team assignment)
export const getUsersByRole = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { role } = req.params;

    if (!["admin", "employee", "client"].includes(role)) {
      res.status(400).json({
        success: false,
        message: "Invalid role specified",
      } as ApiResponse);
      return;
    }

    const users = await User.find({
      role,
      isActive: true,
    }).select("name email avatar position department");

    res.status(200).json({
      success: true,
      data: users,
      message: `${role} users retrieved successfully`,
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users by role",
      error: error.message,
    } as ApiResponse);
  }
};

// Get user statistics (admin only)
export const getUserStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ["$isActive", 1, 0] },
          },
        },
      },
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        roleBreakdown: stats,
      },
      message: "User statistics retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user statistics",
      error: error.message,
    } as ApiResponse);
  }
};
