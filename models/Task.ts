import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachment {
    url: string;
    publicId: string;
    fileName: string;
    fileType: string;
    size: number;
    uploadedAt: Date;
}

export interface ITask extends Document {
    title: string;
    description?: string; // Rich text support usually implies storing HTML/Markdown strings
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in-progress' | 'completed' | 'archived';
    estimatedMinutes?: number;

    // Relationships
    workspaceId: mongoose.Types.ObjectId;
    userId: string; // From auth

    // Tracking & States
    completedAt?: Date;


    attachments: IAttachment[];
    createdAt: Date;
    updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
});

const TaskSchema = new Schema<ITask>(
    {
        title: { type: String, required: true },
        description: { type: String }, // Can store rich text HTML or Markdown string
        dueDate: { type: Date },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'archived'],
            default: 'pending',
        },
        estimatedMinutes: { type: Number },


        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        userId: { type: String, required: true, index: true },


        completedAt: { type: Date },


        attachments: [AttachmentSchema],
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
