import { Document } from "mongoose";
import mongoose from "mongoose";

// User Types
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee" | "client";
  avatar?: string;
  position?: string;
  department?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Project Types
export interface IProject extends Document {
  name: string;
  description: string;
  client: mongoose.Types.ObjectId; // User ID
  projectManager: mongoose.Types.ObjectId; // User ID
  teamMembers: mongoose.Types.ObjectId[]; // User IDs
  startDate: Date;
  endDate: Date;
  status: "planning" | "active" | "on-hold" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  progress: number; // 0-100
  budget?: number;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

// Task Types
export interface ITask extends Document {
  title: string;
  description: string;
  project: mongoose.Types.ObjectId; // Project ID
  assignedTo?: mongoose.Types.ObjectId; // User ID
  createdBy: mongoose.Types.ObjectId; // User ID
  status: "todo" | "in-progress" | "in-review" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  attachments: IAttachment[];
  comments: mongoose.Types.ObjectId[]; // Comment IDs
  dependencies: mongoose.Types.ObjectId[]; // Task IDs
  position: number; // For Kanban ordering
  createdAt: Date;
  updatedAt: Date;
}

// Comment Types
export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId; // User ID
  mentions: mongoose.Types.ObjectId[]; // User IDs
  attachments: IAttachment[];
  parentComment?: mongoose.Types.ObjectId; // Comment ID for replies
  createdAt: Date;
  updatedAt: Date;
}

// Attachment Types
export interface IAttachment {
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId; // User ID
  uploadedAt: Date;
}

// Change Request Types
export interface IChangeRequest extends Document {
  title: string;
  description: string;
  project: mongoose.Types.ObjectId; // Project ID
  requestedBy: mongoose.Types.ObjectId; // User ID (client)
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected" | "implemented";
  estimatedHours?: number;
  estimatedCost?: number;
  approvedBy?: mongoose.Types.ObjectId; // User ID
  implementedBy?: mongoose.Types.ObjectId; // User ID
  comments: mongoose.Types.ObjectId[]; // Comment IDs
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // User ID
  type:
    | "task_assigned"
    | "task_updated"
    | "project_updated"
    | "mention"
    | "deadline_approaching";
  title: string;
  message: string;
  relatedEntity?: {
    type: "project" | "task" | "comment";
    id: string;
  };
  isRead: boolean;
  createdAt: Date;
}

// Request/Response Types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: "employee" | "client";
  position?: string;
  department?: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  client: string;
  teamMembers: string[];
  startDate: string;
  endDate: string;
  priority?: "low" | "medium" | "high" | "critical";
  budget?: number;
  estimatedHours?: number;
  tags?: string[];
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  assignedTo?: string;
  priority?: "low" | "medium" | "high" | "critical";
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  dependencies?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assignedTo?: string;
  status?: "todo" | "in-progress" | "in-review" | "completed";
  priority?: "low" | "medium" | "high" | "critical";
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  position?: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Dashboard Types
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalTeamMembers: number;
  recentActivities: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  type: "project_created" | "task_created" | "task_completed" | "user_assigned";
  description: string;
  user: string;
  relatedEntity?: {
    type: "project" | "task";
    id: string;
    name: string;
  };
  timestamp: Date;
}
