import mongoose, { Schema, Document } from 'mongoose';

export interface IReminder extends Document {
    taskId: mongoose.Types.ObjectId;
    userId: string;
    remindAt: Date;

    // Trigger properties
    triggerType: 'before-due' | 'at-due' | 'custom';
    offsetMinutes?: number; // e.g., 5 min before, 60 mins before, 1440 mins before (1 day)

    type: 'browser_push' | 'email' | 'in-app';
    status: 'pending' | 'sent' | 'failed' | 'cancelled' | 'snoozed';
    message?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReminderSchema = new Schema<IReminder>(
    {
        taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
        userId: { type: String, required: true, index: true },
        remindAt: { type: Date, required: true, index: true },

        triggerType: {
            type: String,
            enum: ['before-due', 'at-due', 'custom'],
            default: 'at-due'
        },
        offsetMinutes: { type: Number },

        type: { type: String, enum: ['browser_push', 'email', 'in-app'], default: 'browser_push' },
        status: { type: String, enum: ['pending', 'sent', 'failed', 'cancelled', 'snoozed'], default: 'pending' },
        message: { type: String },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Reminder || mongoose.model<IReminder>('Reminder', ReminderSchema);
