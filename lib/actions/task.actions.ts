'use server'

import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";
import Notification from "@/models/Notification";
import Reminder from "@/models/Reminder";
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

        // --- SCHEDULING REMINDERS ---
        if (newTask.dueDate) {
            await syncTaskReminders(newTask._id.toString(), userId, newTask.dueDate);
        }

        return JSON.parse(JSON.stringify(newTask));
    } catch (error: any) {
        console.error("Error creating task:", error);
        throw new Error(error.message || "Failed to create task");
    }
}

// --- GET SINGLE TASK ---
export async function getTaskById(taskId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const task = await Task.findOne({ _id: new mongoose.Types.ObjectId(taskId), userId })
            .populate('workspaceId', 'name');

        if (!task) throw new Error("Task not found");

        return JSON.parse(JSON.stringify(task));
    } catch (error: any) {
        console.error("Error fetching task:", error);
        throw new Error(error.message || "Failed to fetch task");
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

// --- GLOBAL SEARCH ---
export async function searchTasksGlobal(query: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        if (!query || query.trim().length < 2) return [];

        await dbConnect();

        const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const tasks = await Task.find({
            userId,
            $or: [
                { title: { $regex: sanitizedQuery, $options: 'i' } },
                { description: { $regex: sanitizedQuery, $options: 'i' } }
            ]
        })
            .populate('workspaceId', 'name')
            .select('title description priority status workspaceId dueDate createdAt')
            .sort({ updatedAt: -1 })
            .limit(15)
            .lean();

        return JSON.parse(JSON.stringify(tasks));
    } catch (error: any) {
        console.error("Error in global search:", error);
        return [];
    }
}

// --- UPDATE ---
export async function updateTask(taskId: string, updateData: any) {
    try {
        const authData = await auth();
        const userId = authData.userId;
        
        if (!userId) {
            console.error("SERVER AUTH FAILED: userId is null in updateTask.");
            throw new Error("Unauthorized");
        }

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
                        console.log(`SERVER: DELETED ORPHANED ATTACHMENT FROM IMAGEKIT: ${fileId}`);
                    } catch (err) {
                        console.error(`SERVER: FAILED TO DELETE IMAGEKIT FILE ${fileId}:`, err);
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

        // --- SYNC REMINDERS ---
        if (updateData.dueDate !== undefined) {
             await syncTaskReminders(taskId, userId, updatedTask.dueDate);
        }

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
                    console.error(`SERVER: FAILED TO DELETE IMAGEKIT FILE ${file.publicId}:`, err);
                    // Continue deleting the task even if file deletion fails
                }
            }
        }

        // 3. Delete related Reminders
        await Reminder.deleteMany({ taskId: new mongoose.Types.ObjectId(taskId), userId });

        // 4. Delete related Notifications (where data.taskId matches)
        await Notification.deleteMany({ 
            userId,
            $or: [
                { "data.taskId": taskId },
                { "data.taskId": new mongoose.Types.ObjectId(taskId) }
            ]
        });

        // 5. Delete the task record from MongoDB
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
    ).populate('workspaceId', 'name');

    return JSON.parse(JSON.stringify(updatedTask));
}

// --- ADD COMMENT ---
export async function addComment(taskId: string, text: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");
        if (!text?.trim()) throw new Error("Comment cannot be empty");

        await dbConnect();

        // 1. Find the task
        const task = await Task.findOne({ _id: new mongoose.Types.ObjectId(taskId), userId });
        if (!task) throw new Error("Task not found or access denied");

        // 2. Prepare the new comment
        const now = new Date();
        const newComment = {
            _id: new mongoose.Types.ObjectId(),
            text: text.trim(),
            createdAt: now,
            updatedAt: now,
        };

        // 3. Update the array
        if (!task.comments) task.comments = [];
        task.comments.push(newComment);
        
        // 4. Force mark as modified
        task.markModified('comments');
        
        // 5. Save with full validation
        await task.save();
        
        // 6. Re-fetch clean populated version
        const updated = await Task.findById(taskId)
            .populate('workspaceId', 'name')
            .lean(); // Use lean for smaller, cleaner response

        if (!updated) throw new Error("Task refresh failed");

        return JSON.parse(JSON.stringify(updated));
    } catch (error: any) {
        console.error("CRITICAL: Error adding comment:", error);
        throw new Error(error.message || "Failed to add comment to database");
    }
}

// --- DELETE COMMENT ---
export async function deleteComment(taskId: string, commentId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        const task = await Task.findOne({ _id: new mongoose.Types.ObjectId(taskId), userId });
        if (!task) throw new Error("Task not found");

        if (task.comments) {
            task.comments = task.comments.filter((c: any) => c._id.toString() !== commentId);
            await task.save();
        }

        // Re-fetch populated
        const updated = await Task.findById(taskId).populate('workspaceId', 'name');

        return JSON.parse(JSON.stringify(updated));
    } catch (error: any) {
        console.error("Error deleting comment:", error);
        throw new Error(error.message || "Failed to delete comment");
    }
}

// --- COMMIT COMPLETION (complete task + save completion note) ---
export async function commitCompletion(taskId: string, note: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");
        if (!note?.trim()) throw new Error("Completion note cannot be empty");

        await dbConnect();

        const updated = await Task.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(taskId), userId },
            {
                $set: {
                    status: 'completed',
                    completedAt: new Date(),
                    completionNote: {
                        note: note.trim(),
                        committedAt: new Date(),
                    }
                }
            },
            { returnDocument: 'after' }
        ).populate('workspaceId', 'name');

        if (!updated) throw new Error("Task not found");

        return JSON.parse(JSON.stringify(updated));
    } catch (error: any) {
        console.error("Error committing completion:", error);
        throw new Error(error.message || "Failed to commit completion");
    }
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
/**
 * --- REMINDER SYNC HELPER ---
 * Schedules/Updates the standard sequence of reminders for a task.
 */
async function syncTaskReminders(taskId: string, userId: string, dueDate: Date | null) {
    try {
        // 1. Clear existing pending reminders for this task
        await Reminder.deleteMany({ taskId: new mongoose.Types.ObjectId(taskId), status: 'pending' });

        if (!dueDate) return;

        const remindersToCreate = [];
        const now = new Date();

        // Standard offsets (in minutes)
        const offsets = [
            { label: 'At due time', mins: 0, type: 'at-due' as const },
            { label: '15 minutes before', mins: 15, type: 'before-due' as const },
            { label: '1 hour before', mins: 60, type: 'before-due' as const },
            { label: '1 day before', mins: 1440, type: 'before-due' as const },
        ];

        for (const offset of offsets) {
            const remindAt = new Date(dueDate.getTime() - offset.mins * 60000);

            // Only create if the reminder time is in the future
            if (remindAt > now) {
                remindersToCreate.push({
                    taskId: new mongoose.Types.ObjectId(taskId),
                    userId,
                    remindAt,
                    triggerType: offset.type,
                    offsetMinutes: offset.mins,
                    status: 'pending',
                    type: 'browser_push',
                    message: offset.label
                });
            }
        }

        if (remindersToCreate.length > 0) {
            await Reminder.insertMany(remindersToCreate);
        }

    } catch (error) {
        console.error("Error syncing task reminders:", error);
    }
}
