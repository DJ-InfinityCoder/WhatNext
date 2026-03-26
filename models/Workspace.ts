import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspace extends Document {
    name: string;
    type: 'personal' | 'work';
    ownerId: string; // from Clerk
    members: string[]; // array of Clerk user IDs
    createdAt: Date;
    updatedAt: Date;
}

export type SerializedWorkspace = {
    _id: string;
    name: string;
    type: 'personal' | 'work';
    ownerId: string;
    members: string[];
    createdAt: string;
    updatedAt: string;
}

const WorkspaceSchema = new Schema<IWorkspace>(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ['personal', 'work'], default: 'personal' },
        ownerId: { type: String, required: true, index: true },
        members: [{ type: String }],
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
