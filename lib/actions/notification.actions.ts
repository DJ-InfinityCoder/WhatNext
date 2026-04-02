'use server'

import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";
import Reminder from "@/models/Reminder";
import Notification from "@/models/Notification";
import Task from "@/models/Task";
import webpush from "web-push";
import mongoose from "mongoose";

// Setup web-push
webpush.setVapidDetails(
    'mailto:developer@whatnext.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

/**
 * --- SUBSCRIPTIONS ---
 */
export async function savePushSubscription(subscription: any) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        // Check if subscription already exists for this user with same endpoint
        const existing = await PushSubscription.findOne({ 
            userId, 
            "subscription.endpoint": subscription.endpoint 
        });

        if (existing) {
            existing.subscription = subscription;
            await existing.save();
        } else {
            await PushSubscription.create({
                userId,
                subscription
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error saving push subscription:", error);
        return { success: false, error: error.message };
    }
}

export async function removePushSubscription(endpoint: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        await dbConnect();

        await PushSubscription.findOneAndDelete({ userId, "subscription.endpoint": endpoint });
        return { success: true };
    } catch (error: any) {
        console.error("Error removing push subscription:", error);
        return { success: false, error: error.message };
    }
}

/**
 * --- REMINDER PROCESSING (THE WORKER LOGIC) ---
 */
export async function processPendingReminders() {
    try {
        await dbConnect();

        const now = new Date();
        
        // 1. Fetch pending reminders due now or earlier
        const pendingReminders = await Reminder.find({
            status: 'pending',
            remindAt: { $lte: now }
        }).limit(20); // Process in batches

        if (pendingReminders.length === 0) return { processed: 0 };

        let sentCount = 0;

        for (const reminder of pendingReminders) {
            // A. Fetch task info
            const task = await Task.findById(reminder.taskId);
            if (!task || task.status === 'completed' || task.status === 'archived') {
                reminder.status = 'cancelled';
                await reminder.save();
                continue;
            }

            // B. Fetch user push subscriptions
            const subscriptions = await PushSubscription.find({ userId: reminder.userId });

            if (subscriptions.length === 0) {
                // If no push subs, we can't send browser push. Mark as failed or pending for other types.
                reminder.status = 'failed';
                reminder.message = 'No push subscriptions found for user';
                await reminder.save();
                continue;
            }

            // C. Trigger web-push for each subscription
            const payload = JSON.stringify({
                title: 'Task Reminder: WhatNext',
                body: `${task.title} is due at ${task.dueDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                icon: '/icon-192x192.png',
                data: {
                    taskId: task._id.toString(),
                    url: `/console?taskId=${task._id.toString()}`
                }
            });

            const sendPromises = subscriptions.map(sub => 
                webpush.sendNotification(sub.subscription as any, payload)
                    .catch(err => {
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            // Subscription expired or invalid - remove it from DB
                            return PushSubscription.findByIdAndDelete(sub._id);
                        }
                        console.error(`Push failed for sub ${sub._id}:`, err);
                    })
            );

            await Promise.all(sendPromises);

            // D. Log to Notification history
            await Notification.create({
                userId: reminder.userId,
                title: 'Reminder',
                body: `${task.title} - ${reminder.triggerType === 'at-due' ? 'Due now!' : 'Due soon!'}`,
                type: 'reminder',
                data: { taskId: task._id }
            });

            // E. Mark reminder as sent
            reminder.status = 'sent';
            await reminder.save();
            sentCount++;
        }

        return { processed: pendingReminders.length, sent: sentCount };

    } catch (error: any) {
        console.error("CRITICAL: Error in processPendingReminders:", error);
        throw error;
    }
}
