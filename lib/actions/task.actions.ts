'use server'

import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";
import mongoose from "mongoose";
import imagekit from "@/lib/imagekit";

// --- CREATE ---
export async function createTask(data: any) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const taskData = {
            ...data,
            userId,
        };


        const newTask = await Task.create(taskData);

        return JSON.parse(JSON.stringify(newTask));
    } catch (error: any) {
        console.error("Error creating task:", error);
        throw new Error(error.message || "Failed to create task");
    }
}

// --- READ ---
export async function getTasks(workspaceId: string, filters: any = {}) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const query: any = {
            userId,
        };

        if (workspaceId !== 'all') {
            query.workspaceId = new mongoose.Types.ObjectId(workspaceId);
        }

        // Apply optional filters (e.g. status)
        if (filters.status) query.status = filters.status;
        if (filters.priority) query.priority = filters.priority;


        if (filters.view) {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            switch (filters.view) {
                case 'active':
                    query.status = { $in: ['pending', 'in-progress'] };
                    break;
                case 'completed':
                    query.status = 'completed';
                    break;
                case 'archived':
                    query.status = 'archived';
                    break;
                case 'today':
                    // Due today, or overdue maybe? Let's just say due today for exact 'today'.
                    query.dueDate = { $gte: startOfToday, $lte: endOfToday };
                    if (!query.status) query.status = { $ne: 'completed' };
                    break;
                case 'upcoming':
                    query.dueDate = { $gt: endOfToday };
                    if (!query.status) query.status = { $ne: 'completed' };
                    break;
                case 'overdue':
                    query.dueDate = { $lt: startOfToday };
                    if (!query.status) query.status = { $ne: 'completed' };
                    break;
                case 'priority':
                    query.priority = { $in: ['high', 'urgent'] };
                    if (!query.status) query.status = { $ne: 'completed' };
                    break;
            }
        }

        if (filters.searchQuery) {
            query.$or = [
                { title: { $regex: filters.searchQuery, $options: 'i' } },
                { description: { $regex: filters.searchQuery, $options: 'i' } }
            ];
        }

        const tasks = await Task.find(query)
            .populate('workspaceId', 'name')
            .sort({ createdAt: -1 });
        return JSON.parse(JSON.stringify(tasks));
    } catch (error: any) {
        console.error("Error fetching tasks:", error);
        throw new Error("Failed to fetch tasks");
    }
}

// --- UPDATE ---
export async function updateTask(taskId: string, updateData: any) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        // If attachments are being updated, check for deletions
        if (updateData.attachments) {
            const oldTask = await Task.findOne({ _id: new mongoose.Types.ObjectId(taskId), userId });
            if (oldTask) {
                const oldIds = oldTask.attachments.map((a: any) => a.publicId);
                const newIds = updateData.attachments.map((a: any) => a.publicId);
                const toDelete = oldIds.filter((id: string) => !newIds.includes(id));

                for (const fileId of toDelete) {
                    try {
                        await imagekit.deleteFile(fileId);
                    } catch (err) {
                        console.error(`Failed to delete ImageKit file ${fileId}:`, err);
                    }
                }
            }
        }

        const updatedTask = await Task.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(taskId), userId },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!updatedTask) throw new Error("Task not found");

        return JSON.parse(JSON.stringify(updatedTask));
    } catch (error: any) {
        console.error("Error updating task:", error);
        throw new Error("Failed to update task");
    }
}

// --- DELETE ---
export async function deleteTask(taskId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        // 1. Find the task to get its attachments
        const taskToDelete = await Task.findOne({ _id: new mongoose.Types.ObjectId(taskId), userId });

        if (taskToDelete && taskToDelete.attachments?.length > 0) {
            // 2. Delete all attachments from ImageKit
            for (const file of taskToDelete.attachments) {
                try {
                    await imagekit.deleteFile(file.publicId);
                } catch (err) {
                    console.error(`Failed to delete ImageKit file ${file.publicId}:`, err);
                    // Continue deleting the task even if file deletion fails
                }
            }
        }

        // 3. Delete the task record from MongoDB
        await Task.findOneAndDelete({ _id: new mongoose.Types.ObjectId(taskId), userId });



        return { success: true };
    } catch (error: any) {
        console.error("Error permanently deleting task:", error);
        throw new Error("Failed to delete task");
    }
}



export async function toggleTaskCompletion(taskId: string, currentStatus: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await dbConnect();

    // Need to fetch original first
    const originalTask = await Task.findOne({ _id: new mongoose.Types.ObjectId(taskId), userId });
    if (!originalTask) throw new Error("Task not found");

    const isCompleted = currentStatus === 'completed';
    const newStatus = isCompleted ? 'pending' : 'completed';
    const completedAt = isCompleted ? null : new Date();


    const updatedTask = await Task.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(taskId), userId },
        {
            $set: {
                status: newStatus,
                completedAt,
            }
        },
        { new: true }
    );



    return JSON.parse(JSON.stringify(updatedTask));
}

export async function changeTaskStatus(taskId: string, newStatus: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await dbConnect();

    const originalTask = await Task.findOne({ _id: new mongoose.Types.ObjectId(taskId), userId });
    if (!originalTask) throw new Error("Task not found");

    const isCompleted = newStatus === 'completed';
    const wasCompleted = originalTask.status === 'completed';
    const completedAt = isCompleted ? new Date() : null;


    const updatedTask = await Task.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(taskId), userId },
        {
            $set: {
                status: newStatus,
                completedAt,
            }
        },
        { returnDocument: 'after' }
    );

    return JSON.parse(JSON.stringify(updatedTask));
}

// --- DUPLICATE ---
export async function duplicateTask(taskId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const originalTask = await Task.findOne({ _id: new mongoose.Types.ObjectId(taskId), userId }).lean();
        if (!originalTask) throw new Error("Task not found");

        // Clone the document, stripping unique IDs
        const { _id, createdAt, updatedAt, ...clonedData } = originalTask as any;

        clonedData.title = `${clonedData.title} (Copy)`;
        clonedData.status = 'pending'; // Reset status for duplicate
        clonedData.completedAt = null;

        const newTask = await Task.create({
            ...clonedData,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return JSON.parse(JSON.stringify(newTask));

    } catch (error: any) {
        console.error("Error duplicating task:", error);
        throw new Error("Failed to duplicate task");
    }
}

// --- BULK ACTIONS ---
export async function bulkUpdateTasks(taskIds: string[], updateData: any) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const objectIds = taskIds.map(id => new mongoose.Types.ObjectId(id));

        const result = await Task.updateMany(
            { _id: { $in: objectIds }, userId },
            { $set: updateData }
        );

        return result.modifiedCount;
    } catch (error: any) {
        console.error("Error running bulk update:", error);
        throw new Error("Failed to bulk update tasks");
    }
}
