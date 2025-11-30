import mongoose, { Schema, Model } from "mongoose";
import { IProject, IAttachment } from "../types";

const attachmentSchema = new Schema<IAttachment>({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [200, "Project name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client is required"],
      validate: {
        validator: async function (clientId: mongoose.Types.ObjectId) {
          const User = mongoose.model("User");
          const client = await User.findOne({ _id: clientId, role: "client" });
          return !!client;
        },
        message: 'Client must have role "client"',
      },
    },
    projectManager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project manager is required"],
      validate: {
        validator: async function (managerId: mongoose.Types.ObjectId) {
          const User = mongoose.model("User");
          const manager = await User.findOne({
            _id: managerId,
            role: { $in: ["admin", "employee"] },
          });
          return !!manager;
        },
        message: "Project manager must be an admin or employee",
      },
    },
    teamMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        validate: {
          validator: async function (memberId: mongoose.Types.ObjectId) {
            const User = mongoose.model("User");
            const member = await User.findOne({
              _id: memberId,
              role: { $in: ["admin", "employee"] },
            });
            return !!member;
          },
          message: "Team members must be admin or employee",
        },
      },
    ],
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator: function (value: Date) {
          return value >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: "Start date cannot be in the past",
      },
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value: Date) {
          return value instanceof Date && !isNaN(value.getTime());
        },
        message: "End date must be a valid date",
      },
    },
    status: {
      type: String,
      enum: ["planning", "active", "on-hold", "completed", "cancelled"],
      default: "planning",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, "Progress cannot be less than 0"],
      max: [100, "Progress cannot exceed 100"],
    },
    budget: {
      type: Number,
      min: [0, "Budget cannot be negative"],
    },
    estimatedHours: {
      type: Number,
      min: [0, "Estimated hours cannot be negative"],
    },
    actualHours: {
      type: Number,
      default: 0,
      min: [0, "Actual hours cannot be negative"],
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    attachments: [attachmentSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
projectSchema.index({ client: 1 });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ teamMembers: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ createdAt: -1 });

// Virtual for project duration in days
projectSchema.virtual("duration").get(function () {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(
      this.endDate.getTime() - this.startDate.getTime()
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for days remaining
projectSchema.virtual("daysRemaining").get(function () {
  if (this.endDate && this.status !== "completed") {
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for project health status
projectSchema.virtual("healthStatus").get(function () {
  // Calculate days remaining inline
  let daysRemaining = 0;
  if (this.endDate && this.status !== "completed") {
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const progress = this.progress;

  if (this.status === "completed") return "completed";
  if (daysRemaining < 0) return "overdue";
  if (daysRemaining <= 7 && progress < 80) return "at-risk";
  if (progress >= 90) return "on-track";
  return "healthy";
});

// Middleware to update progress when tasks are updated
projectSchema.methods.updateProgress = async function () {
  const Task = mongoose.model("Task");
  const tasks = await Task.find({ project: this._id });

  if (tasks.length === 0) {
    this.progress = 0;
    return this.save();
  }

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  this.progress = Math.round((completedTasks / tasks.length) * 100);

  return this.save();
};

// Static method to get projects with team member count
projectSchema.statics.getProjectsWithStats = function () {
  return this.aggregate([
    {
      $lookup: {
        from: "tasks",
        localField: "_id",
        foreignField: "project",
        as: "tasks",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "client",
        foreignField: "_id",
        as: "clientInfo",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "projectManager",
        foreignField: "_id",
        as: "managerInfo",
      },
    },
    {
      $addFields: {
        totalTasks: { $size: "$tasks" },
        completedTasks: {
          $size: {
            $filter: {
              input: "$tasks",
              cond: { $eq: ["$$this.status", "completed"] },
            },
          },
        },
        teamMemberCount: { $size: "$teamMembers" },
        client: { $arrayElemAt: ["$clientInfo", 0] },
        projectManager: { $arrayElemAt: ["$managerInfo", 0] },
      },
    },
    {
      $project: {
        tasks: 0,
        clientInfo: 0,
        managerInfo: 0,
      },
    },
  ]);
};

const Project: Model<IProject> = mongoose.model<IProject>(
  "Project",
  projectSchema
);

export default Project;
