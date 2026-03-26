import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId: string;
    title: string;
    body: string;
    data?: any; // Additional payload data (e.g., taskId, url)
    isRead: boolean;
    type: 'reminder' | 'system' | 'general';
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, required: true },
        body: { type: String, required: true },
        data: { type: Schema.Types.Mixed },
        isRead: { type: Boolean, default: false },
        type: { type: String, enum: ['reminder', 'system', 'general'], default: 'general' },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
