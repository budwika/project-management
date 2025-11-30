import axios, { AxiosResponse } from "axios";
import {
  ApiResponse,
  User,
  Project,
  Task,
  Comment,
  ChangeRequest,
  LoginRequest,
  RegisterRequest,
  DashboardStats,
} from "../types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and normalize data structure
api.interceptors.response.use(
  (response) => {
    // Normalize nested data structure for list endpoints
    if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
      // Extract the actual array from nested structure
      response.data.data = response.data.data.data;
    }
    return response;
  },
  (error) => {
    // Only clear auth on 401 errors from auth endpoints or when token is actually invalid
    if (
      error.response?.status === 401 &&
      error.config?.url?.includes("/auth/")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (
    data: LoginRequest
  ): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> =
      await api.post("/auth/login", data);
    return response.data;
  },

  register: async (
    data: RegisterRequest
  ): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> =
      await api.post("/auth/register", data);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get(
      "/auth/profile"
    );
    return response.data;
  },
};

// Projects API
export const projectsAPI = {
  getAll: async (): Promise<ApiResponse<Project[]>> => {
    const response: AxiosResponse<ApiResponse<Project[]>> = await api.get(
      "/projects"
    );
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Project>> => {
    const response: AxiosResponse<ApiResponse<Project>> = await api.get(
      `/projects/${id}`
    );
    return response.data;
  },

  create: async (data: Partial<any>): Promise<ApiResponse<Project>> => {
    const response: AxiosResponse<ApiResponse<Project>> = await api.post(
      "/projects",
      data
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<any>
  ): Promise<ApiResponse<Project>> => {
    const response: AxiosResponse<ApiResponse<Project>> = await api.put(
      `/projects/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(
      `/projects/${id}`
    );
    return response.data;
  },
};

// Tasks API
export const tasksAPI = {
  getAll: async (projectId?: string): Promise<ApiResponse<Task[]>> => {
    const url = projectId ? `/tasks?project=${projectId}` : "/tasks";
    const response: AxiosResponse<ApiResponse<Task[]>> = await api.get(url);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Task>> => {
    const response: AxiosResponse<ApiResponse<Task>> = await api.get(
      `/tasks/${id}`
    );
    return response.data;
  },

  create: async (
    projectId: string,
    data: Partial<any>
  ): Promise<ApiResponse<Task>> => {
    const response: AxiosResponse<ApiResponse<Task>> = await api.post(
      `tasks/project/${projectId}`,
      data
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<any>
  ): Promise<ApiResponse<Task>> => {
    const response: AxiosResponse<ApiResponse<Task>> = await api.put(
      `/tasks/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(
      `/tasks/${id}`
    );
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response: AxiosResponse<ApiResponse<DashboardStats>> = await api.get(
      "/dashboard/stats"
    );
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    const response: AxiosResponse<ApiResponse<User[]>> = await api.get(
      "/users"
    );
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get(
      `/users/${id}`
    );
    return response.data;
  },
};

// Comments API
export const commentsAPI = {
  getComments: async (
    entityType: string,
    entityId: string
  ): Promise<ApiResponse<Comment[]>> => {
    const response: AxiosResponse<ApiResponse<Comment[]>> = await api.get(
      `/comments/${entityType}/${entityId}`
    );
    return response.data;
  },

  create: async (data: {
    content: string;
    mentions?: string[];
    parentComment?: string;
  }): Promise<ApiResponse<Comment>> => {
    const response: AxiosResponse<ApiResponse<Comment>> = await api.post(
      "/comments",
      data
    );
    return response.data;
  },

  update: async (
    id: string,
    data: { content: string }
  ): Promise<ApiResponse<Comment>> => {
    const response: AxiosResponse<ApiResponse<Comment>> = await api.put(
      `/comments/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(
      `/comments/${id}`
    );
    return response.data;
  },
};

// Change Requests API
export const changeRequestsAPI = {
  getAll: async (params?: {
    status?: string;
    priority?: string;
    projectId?: string;
  }): Promise<ApiResponse<ChangeRequest[]>> => {
    const response: AxiosResponse<ApiResponse<ChangeRequest[]>> = await api.get(
      "/change-requests",
      { params }
    );
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<ChangeRequest>> => {
    const response: AxiosResponse<ApiResponse<ChangeRequest>> = await api.get(
      `/change-requests/${id}`
    );
    return response.data;
  },

  create: async (data: {
    title: string;
    description: string;
    project: string;
    priority?: string;
    estimatedHours?: number;
    estimatedCost?: number;
  }): Promise<ApiResponse<ChangeRequest>> => {
    const response: AxiosResponse<ApiResponse<ChangeRequest>> = await api.post(
      "/change-requests",
      data
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      priority: string;
      status: string;
      estimatedHours: number;
      estimatedCost: number;
    }>
  ): Promise<ApiResponse<ChangeRequest>> => {
    const response: AxiosResponse<ApiResponse<ChangeRequest>> = await api.put(
      `/change-requests/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(
      `/change-requests/${id}`
    );
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      "/change-requests/stats"
    );
    return response.data;
  },
};
