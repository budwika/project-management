import mongoose, { Schema, Model } from "mongoose";
import { IChangeRequest, IAttachment } from "../types";

const attachmentSchema = new Schema<IAttachment>({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const changeRequestSchema = new Schema<IChangeRequest>(
  {
    title: {
      type: String,
      required: [true, "Change request title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Change request description is required"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requestor is required"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "implemented"],
      default: "pending",
      required: true,
    },
    estimatedHours: {
      type: Number,
      min: [0, "Estimated hours cannot be negative"],
    },
    estimatedCost: {
      type: Number,
      min: [0, "Estimated cost cannot be negative"],
    },
    approvedBy: {
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
        message: "Approver must be an admin or employee",
      },
    },
    implementedBy: {
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
        message: "Implementer must be an admin or employee",
      },
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
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
changeRequestSchema.index({ project: 1 });
changeRequestSchema.index({ requestedBy: 1 });
changeRequestSchema.index({ status: 1 });
changeRequestSchema.index({ priority: 1 });
changeRequestSchema.index({ createdAt: -1 });

// Compound indexes
changeRequestSchema.index({ project: 1, status: 1 });
changeRequestSchema.index({ requestedBy: 1, status: 1 });

// Virtual for request age in days
changeRequestSchema.virtual("ageInDays").get(function () {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for approval status
changeRequestSchema.virtual("approvalStatus").get(function () {
  if (this.status === "pending") return "awaiting-review";
  if (this.status === "approved" && !this.implementedBy)
    return "ready-for-implementation";
  if (this.status === "approved" && this.implementedBy)
    return "in-implementation";
  return this.status;
});

// Pre-save middleware for status validation
changeRequestSchema.pre("save", function () {
  // Ensure approvedBy is set when status is approved
  if (this.status === "approved" && !this.approvedBy) {
    throw new Error("ApprovedBy is required when status is approved");
  }

  // Ensure implementedBy is set when status is implemented
  if (this.status === "implemented" && !this.implementedBy) {
    throw new Error("ImplementedBy is required when status is implemented");
  }
});

// Static method to get change requests with populated data
changeRequestSchema.statics.getChangeRequestsWithDetails = function (
  filter = {}
) {
  return this.find(filter)
    .populate("project", "name status")
    .populate("requestedBy", "name email avatar")
    .populate("approvedBy", "name email")
    .populate("implementedBy", "name email")
    .populate({
      path: "comments",
      populate: {
        path: "author",
        select: "name email avatar",
      },
    })
    .sort({ createdAt: -1 });
};

// Static method to get change request statistics
changeRequestSchema.statics.getChangeRequestStats = function (filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgEstimatedHours: { $avg: "$estimatedHours" },
        avgEstimatedCost: { $avg: "$estimatedCost" },
      },
    },
  ]);
};

const ChangeRequest: Model<IChangeRequest> = mongoose.model<IChangeRequest>(
  "ChangeRequest",
  changeRequestSchema
);

export default ChangeRequest;
