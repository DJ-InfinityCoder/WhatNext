'use server'

import { savePushSubscription, removePushSubscription } from "@/lib/actions/notification.actions";
import webpush from 'web-push'

webpush.setVapidDetails(
    'mailto:developer@whatnext.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
)

/**
 * Persists the browser push subscription to MongoDB for the current user.
 */
export async function subscribeUser(sub: any) {
    return await savePushSubscription(sub);
}

/**
 * Removes a specific browser push subscription from the database.
 */
export async function unsubscribeUser(endpoint: string) {
    return await removePushSubscription(endpoint);
}

/**
 * --- TEST ACTION ---
 * Sends a direct test notification to the current user's session (transient).
 * In production, use the background worker for scheduled reminders.
 */
export async function sendNotification(message: string, subscription: any) {
    if (!subscription) {
        throw new Error('No subscription available')
    }

    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify({
                title: 'WhatNext Test',
                body: message,
                icon: '/icon-192x192.png',
            })
        )
        return { success: true }
    } catch (error) {
        console.error('Error sending push notification:', error)
        return { success: false, error: 'Failed to send notification' }
    }
}
