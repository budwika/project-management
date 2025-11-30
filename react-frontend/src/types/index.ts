// Frontend types that match backend interfaces
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "employee" | "client";
  avatar?: string;
  position?: string;
  department?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  password?: string;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  client: User;
  projectManager: User;
  teamMembers: User[];
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "on-hold" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  progress: number;
  budget?: number;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  project: Project;
  assignedTo?: User;
  createdBy: User;
  status: "todo" | "in-progress" | "in-review" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: User;
  mentions: User[];
  parentComment?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface ChangeRequest {
  _id: string;
  title: string;
  description: string;
  project: Project;
  requestedBy: User;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected" | "implemented";
  estimatedHours?: number;
  estimatedCost?: number;
  approvedBy?: User;
  implementedBy?: User;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalTeamMembers: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
