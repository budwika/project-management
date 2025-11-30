import mongoose, { Schema, Model } from "mongoose";
import { INotification } from "../types";

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    type: {
      type: String,
      enum: [
        "task_assigned",
        "task_updated",
        "project_updated",
        "mention",
        "deadline_approaching",
      ],
      required: [true, "Notification type is required"],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    relatedEntity: {
      type: {
        type: String,
        enum: ["project", "task", "comment"],
      },
      id: {
        type: String,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

// Compound indexes
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Virtual for notification age
notificationSchema.virtual("ageInHours").get(function () {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60));
});

// Static method to create notification
notificationSchema.statics.createNotification = async function (data: any) {
  return this.create({
    recipient: data.recipient,
    type: data.type,
    title: data.title,
    message: data.message,
    relatedEntity: data.relatedEntity,
  });
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function (
  recipientId: string,
  notificationIds?: string[]
) {
  const filter: any = {
    recipient: recipientId as any,
    isRead: false,
  };

  if (notificationIds && notificationIds.length > 0) {
    filter._id = { $in: notificationIds as any };
  }

  return this.updateMany(filter, { isRead: true });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function (recipientId: string) {
  return this.countDocuments({
    recipient: recipientId as any,
    isRead: false,
  });
};

// Static method to cleanup old notifications
notificationSchema.statics.cleanupOldNotifications = function (daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    isRead: true,
    createdAt: { $lt: cutoffDate },
  });
};

const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;
