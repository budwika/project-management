import mongoose, { Schema, Model } from "mongoose";
import { IComment, IAttachment } from "../types";

const attachmentSchema = new Schema<IAttachment>({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, "Comment content is required"],
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment author is required"],
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    attachments: [attachmentSchema],
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ mentions: 1 });

// Virtual for reply count
commentSchema.virtual("replyCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
  count: true,
});

// Virtual for comment age
commentSchema.virtual("ageInHours").get(function () {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60));
});

// Pre-save middleware to extract mentions from content
commentSchema.pre("save", function () {
  // Extract @mentions from content using regex
  const mentionRegex = /@(\w+)/g;
  const mentionMatches = this.content.match(mentionRegex);

  if (mentionMatches) {
    // Remove duplicates
    const uniqueMentions = [
      ...new Set(mentionMatches.map((mention) => mention.slice(1))),
    ];

    // Find users by mentioned usernames/emails
    // This is a simplified example - in practice you'd want to resolve these to user IDs
    console.log("Mentions detected:", uniqueMentions);
  }
});

// Static method to get comments with replies
commentSchema.statics.getCommentsWithReplies = function (filter = {}) {
  return this.find({ ...filter, parentComment: null })
    .populate("author", "name email avatar")
    .populate("mentions", "name email")
    .populate({
      path: "replies",
      populate: {
        path: "author",
        select: "name email avatar",
      },
    })
    .sort({ createdAt: -1 });
};

// Virtual populate for replies
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
});

// Instance method to check if comment can be edited
commentSchema.methods.canBeEdited = function (userId: string) {
  // Only author can edit within 24 hours
  const hoursSinceCreated = this.ageInHours;
  return this.author.toString() === userId && hoursSinceCreated < 24;
};

// Instance method to check if comment can be deleted
commentSchema.methods.canBeDeleted = function (
  userId: string,
  userRole: string
) {
  // Author can delete within 48 hours, admin can always delete
  const hoursSinceCreated = this.ageInHours;
  return (
    userRole === "admin" ||
    (this.author.toString() === userId && hoursSinceCreated < 48)
  );
};

const Comment: Model<IComment> = mongoose.model<IComment>(
  "Comment",
  commentSchema
);

export default Comment;
