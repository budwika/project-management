import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { ApiResponse, AuthRequest, RegisterRequest } from "../types";
import { AuthRequest as AuthRequestInterface } from "../middleware/auth";

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || "fallback-secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign({ id: userId }, secret, { expiresIn } as any);
};

// Register user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role,
      position,
      department,
    }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email already exists",
      } as ApiResponse);
      return;
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || "employee",
      position,
      department,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          position: user.position,
          department: user.department,
        },
        token,
      },
      message: "User registered successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    } as ApiResponse);
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: AuthRequest = req.body;

    // Find user with password
    const user = await (User as any).findByEmailWithPassword(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      } as ApiResponse);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is deactivated",
      } as ApiResponse);
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      } as ApiResponse);
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          position: user.position,
          department: user.department,
          lastLogin: user.lastLogin,
        },
        token,
      },
      message: "Login successful",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    } as ApiResponse);
  }
};

// Get current user profile
export const getProfile = async (
  req: AuthRequestInterface,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        department: user.department,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      message: "Profile retrieved successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve profile",
      error: error.message,
    } as ApiResponse);
  }
};

// Update user profile
export const updateProfile = async (
  req: AuthRequestInterface,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { name, position, department, avatar } = req.body;

    // Update only allowed fields
    if (name) user.name = name;
    if (position) user.position = position;
    if (department) user.department = department;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        department: user.department,
        avatar: user.avatar,
      },
      message: "Profile updated successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    } as ApiResponse);
  }
};

// Change password
export const changePassword = async (
  req: AuthRequestInterface,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const userWithPassword = await (User as any).findByEmailWithPassword(
      user.email
    );

    // Verify current password
    const isCurrentPasswordValid = await userWithPassword.comparePassword(
      currentPassword
    );
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      } as ApiResponse);
      return;
    }

    // Update password
    userWithPassword.password = newPassword;
    await userWithPassword.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    } as ApiResponse);
  }
};
