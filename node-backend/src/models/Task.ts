import mongoose, { Schema, Model } from "mongoose";
import { ITask, IAttachment } from "../types";

const attachmentSchema = new Schema<IAttachment>({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Task title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: async function (userId: mongoose.Types.ObjectId) {
          if (!userId) return true; // Optional field
          const User = mongoose.model("User");
          const user = await User.findOne({
            _id: userId,
            role: { $in: ["admin", "employee"] },
          });
          return !!user;
        },
        message: "Assigned user must be an admin or employee",
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "in-review", "completed"],
      default: "todo",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      required: true,
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          if (!value) return true; // Optional field
          return value >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: "Due date cannot be in the past",
      },
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
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    dependencies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
        validate: {
          validator: function (this: ITask, taskId: mongoose.Types.ObjectId) {
            // Prevent self-dependency
            return !this._id || this._id.toString() !== taskId.toString();
          },
          message: "Task cannot depend on itself",
        },
      },
    ],
    position: {
      type: Number,
      default: 0,
      min: [0, "Position cannot be negative"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ position: 1 });
taskSchema.index({ createdAt: -1 });

// Compound indexes
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });

// Virtual for task age in days
taskSchema.virtual("ageInDays").get(function () {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days until due
taskSchema.virtual("daysUntilDue").get(function () {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = this.dueDate;
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for task status health
taskSchema.virtual("statusHealth").get(function () {
  if (!this.dueDate) return "healthy";

  const now = new Date();
  const due = this.dueDate;
  const diffTime = due.getTime() - now.getTime();
  const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (this.status === "completed") return "completed";
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 2) return "urgent";
  if (daysUntilDue <= 7) return "due-soon";
  return "healthy";
});

// Pre-save middleware to update project progress
taskSchema.post("save", async function () {
  const Project = mongoose.model("Project");
  const project = await Project.findById(this.project);
  if (project && typeof project.updateProgress === "function") {
    await project.updateProgress();
  }
});

// Pre-remove middleware to update project progress
taskSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const Project = mongoose.model("Project");
    const project = await Project.findById(doc.project);
    if (project && typeof project.updateProgress === "function") {
      await project.updateProgress();
    }
  }
});

// Static method to get tasks with populated data
taskSchema.statics.getTasksWithDetails = function (filter = {}) {
  return this.find(filter)
    .populate("assignedTo", "name email avatar position")
    .populate("createdBy", "name email avatar")
    .populate("project", "name status priority")
    .populate({
      path: "comments",
      populate: {
        path: "author",
        select: "name email avatar",
      },
    })
    .sort({ position: 1, createdAt: -1 });
};

// Static method to get task statistics
taskSchema.statics.getTaskStats = function (filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgEstimatedHours: { $avg: "$estimatedHours" },
        avgActualHours: { $avg: "$actualHours" },
      },
    },
  ]);
};

// Instance method to check if task can be deleted
taskSchema.methods.canBeDeleted = async function () {
  // Check if any other tasks depend on this task
  const dependentTasks = await mongoose.model("Task").find({
    dependencies: this._id,
  });
  return dependentTasks.length === 0;
};

// Instance method to get blocking dependencies
taskSchema.methods.getBlockingDependencies = async function () {
  const dependencies = await mongoose
    .model("Task")
    .find({
      _id: { $in: this.dependencies },
      status: { $ne: "completed" },
    })
    .select("title status priority dueDate");

  return dependencies;
};

const Task: Model<ITask> = mongoose.model<ITask>("Task", taskSchema);

export default Task;
