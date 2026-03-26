'use server'

import webpush from 'web-push'

webpush.setVapidDetails(
    'mailto:developer@whatnext.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
)

let subscription: webpush.PushSubscription | null = null

export async function subscribeUser(sub: webpush.PushSubscription) {
    subscription = sub
    // In a production environment, store the subscription in a database
    return { success: true }
}

export async function unsubscribeUser() {
    subscription = null
    // In a production environment, remove the subscription from the database
    return { success: true }
}

export async function sendNotification(message: string) {
    if (!subscription) {
        throw new Error('No subscription available')
    }

    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify({
                title: 'WhatNext',
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
