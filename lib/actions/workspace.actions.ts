'use server'

import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Workspace, { SerializedWorkspace } from "@/models/Workspace";
import Task from "@/models/Task";
import Notification from "@/models/Notification";
import Reminder from "@/models/Reminder";
import mongoose from "mongoose";
import imagekit from "@/lib/imagekit";

// --- INITIALIZATION ---
export async function getOrCreateDefaultWorkspace(): Promise<SerializedWorkspace> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        let workspace = await Workspace.findOne({ ownerId: userId }).sort({ createdAt: 1 });

        if (!workspace) {
            workspace = await Workspace.create({
                name: "Personal",
                type: "personal",
                ownerId: userId,
                members: [userId]
            });
        }

        return JSON.parse(JSON.stringify(workspace));
    } catch (error: any) {
        console.error("Error in getOrCreateDefaultWorkspace:", error);
        throw new Error(`Failed to get or create workspace: ${error.message}`);
    }
}

// --- READ ALL ---
export async function getAllWorkspaces(): Promise<SerializedWorkspace[]> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const workspaces = await Workspace.find({
            $or: [
                { ownerId: userId },
                { members: userId }
            ]
        }).sort({ createdAt: 1 });

        return JSON.parse(JSON.stringify(workspaces));
    } catch (error: any) {
        console.error("Error fetching workspaces:", error);
        throw new Error(`Failed to fetch workspaces: ${error.message}`);
    }
}

// --- CREATE ---
export async function createWorkspace({ name, type }: { name: string, type: 'personal' | 'work' }): Promise<SerializedWorkspace> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const newWorkspace = await Workspace.create({
            name,
            type,
            ownerId: userId,
            members: [userId]
        });

        return JSON.parse(JSON.stringify(newWorkspace));
    } catch (error: any) {
        console.error("Error creating workspace:", error);
        throw new Error(`Failed to create workspace: ${error.message}`);
    }
}

// --- UPDATE ---
export async function updateWorkspace(workspaceId: string, data: { name?: string, type?: 'personal' | 'work' }): Promise<SerializedWorkspace> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const updated = await Workspace.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(workspaceId), ownerId: userId },
            { $set: data },
            { returnDocument: 'after' }
        );

        if (!updated) throw new Error("Workspace not found");

        return JSON.parse(JSON.stringify(updated));
    } catch (error: any) {
        console.error("Error updating workspace:", error);
        throw new Error(`Failed to update workspace: ${error.message}`);
    }
}

// --- DELETE (CASCADE) ---
export async function deleteWorkspace(workspaceId: string): Promise<{ success: boolean }> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

        // 1. Verify ownership
        const workspace = await Workspace.findOne({ _id: wsObjectId, ownerId: userId });
        if (!workspace) throw new Error("Workspace not found");

        // 2. Prevent deleting the last workspace
        const totalWorkspaces = await Workspace.countDocuments({ ownerId: userId });
        if (totalWorkspaces <= 1) throw new Error("Cannot delete your only workspace");

        // 3. Find all tasks in this workspace to clean up attachments
        const tasks = await Task.find({ workspaceId: wsObjectId, userId });

        // 4. Delete all ImageKit attachments for each task
        for (const task of tasks) {
            if (task.attachments?.length > 0) {
                for (const file of task.attachments) {
                    try {
                        await imagekit.deleteFile(file.publicId);
                    } catch (err) {
                        console.error(`Failed to delete ImageKit file ${file.publicId}:`, err);
                    }
                }
            }
        }

        // 5. Get task IDs for cascade deletion
        const taskIds = tasks.map(t => t._id);

        // 6. Delete related Reminders
        if (taskIds.length > 0) {
            await Reminder.deleteMany({ taskId: { $in: taskIds }, userId });
        }

        // 7. Delete related Notifications
        if (taskIds.length > 0) {
            await Notification.deleteMany({
                userId,
                $or: taskIds.flatMap(id => [
                    { "data.taskId": id.toString() },
                    { "data.taskId": id }
                ])
            });
        }

        // 8. Delete all tasks in this workspace
        await Task.deleteMany({ workspaceId: wsObjectId, userId });

        // 9. Delete the workspace itself
        await Workspace.findOneAndDelete({ _id: wsObjectId, ownerId: userId });

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting workspace:", error);
        throw new Error(error.message || "Failed to delete workspace");
    }
}

// --- GET WORKSPACE STATS ---
export async function getWorkspaceStats(workspaceId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

        const [total, pending, inProgress, completed, archived] = await Promise.all([
            Task.countDocuments({ workspaceId: wsObjectId, userId }),
            Task.countDocuments({ workspaceId: wsObjectId, userId, status: 'pending' }),
            Task.countDocuments({ workspaceId: wsObjectId, userId, status: 'in-progress' }),
            Task.countDocuments({ workspaceId: wsObjectId, userId, status: 'completed' }),
            Task.countDocuments({ workspaceId: wsObjectId, userId, status: 'archived' }),
        ]);

        return { total, pending, inProgress, completed, archived };
    } catch (error: any) {
        console.error("Error fetching workspace stats:", error);
        return { total: 0, pending: 0, inProgress: 0, completed: 0, archived: 0 };
    }
}
