import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachment {
    url: string;
    publicId: string;
    fileName: string;
    fileType: string;
    size: number;
    uploadedAt: Date;
}

export interface IComment {
    _id?: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICompletionNote {
    note: string;
    committedAt: Date;
}

export interface ITask extends Document {
    title: string;
    description?: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in-progress' | 'completed' | 'archived';

    // Relationships
    workspaceId: mongoose.Types.ObjectId;
    userId: string;

    // Tracking & States
    completedAt?: Date;

    // Progress tracking
    comments: IComment[];
    completionNote?: ICompletionNote;

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

const CommentSchema = new Schema<IComment>(
    {
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

const CompletionNoteSchema = new Schema<ICompletionNote>({
    note: { type: String, required: true },
    committedAt: { type: Date, default: Date.now },
});

const TaskSchema = new Schema<ITask>(
    {
        title: { type: String, required: true },
        description: { type: String },
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


        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        userId: { type: String, required: true, index: true },

        completedAt: { type: Date },

        // Progress tracking
        comments: { type: [CommentSchema], default: [] },
        completionNote: { type: CompletionNoteSchema },

        attachments: [AttachmentSchema],
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
