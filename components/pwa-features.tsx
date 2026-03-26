'use client'

import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser, sendNotification } from '@/app/actions'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [message, setMessage] = useState('')
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
            
            // Log permission status for debugging
            if (Notification.permission === 'denied') {
                console.warn('WhatNext: Push notification permissions were denied by the user.')
            }
        }
    }, [])

    async function registerServiceWorker() {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
        })
        const sub = await registration.pushManager.getSubscription()
        setSubscription(sub)
    }

    async function subscribeToPush() {
        try {
            setStatus('sending')
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                ),
            })
            setSubscription(sub)
            const serializedSub = JSON.parse(JSON.stringify(sub))
            await subscribeUser(serializedSub)
            setStatus('sent')
            setTimeout(() => setStatus('idle'), 3000)
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error)
            setStatus('error')
            setTimeout(() => setStatus('idle'), 3000)
        }
    }

    async function unsubscribeFromPush() {
        await subscription?.unsubscribe()
        setSubscription(null)
        await unsubscribeUser()
    }

    async function sendTestNotification() {
        if (subscription && message.trim()) {
            setStatus('sending')
            try {
                await sendNotification(message)
                setStatus('sent')
                setMessage('')
                setTimeout(() => setStatus('idle'), 3000)
            } catch {
                setStatus('error')
                setTimeout(() => setStatus('idle'), 3000)
            }
        }
    }

    if (!isSupported) {
        return (
            <div className="p-6 border border-zinc-900 bg-black text-zinc-400">
                <div className="flex items-center gap-3 mb-2 text-zinc-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-sm font-semibold tracking-widest uppercase">System Notice</h3>
                </div>
                <p className="text-xs uppercase tracking-wider">Push protocols unsupported in current environment.</p>
            </div>
        )
    }

    return (
        <div className="p-8 border border-zinc-800 bg-[#050505] transition-colors hover:border-zinc-700">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase">Communication Protocol</h3>
                {subscription && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-white text-black text-[10px] font-bold uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
                        Active
                    </div>
                )}
            </div>

            <div>
                {subscription ? (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="ENTER TEST PAYLOAD..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendTestNotification()}
                                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white placeholder-zinc-700 text-xs font-mono focus:outline-none focus:border-zinc-500 transition-colors uppercase tracking-wider"
                            />
                            <button
                                onClick={sendTestNotification}
                                disabled={!message.trim() || status === 'sending'}
                                className="w-full bg-white text-black px-4 py-3 text-xs font-bold tracking-widest uppercase transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-30 disabled:hover:bg-white"
                            >
                                {status === 'sending' ? 'TRANSMITTING...' : status === 'sent' ? 'PAYLOAD DELIVERED' : status === 'error' ? 'TRANSMISSION FAILED' : 'EXECUTE TEST'}
                            </button>
                        </div>

                        <button onClick={unsubscribeFromPush} className="w-full text-left text-[10px] font-mono text-zinc-600 hover:text-red-500 uppercase tracking-widest transition-colors">
                            [ TERMINATE PROTOCOL ]
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <p className="text-zinc-500 text-xs uppercase tracking-widest leading-relaxed">
                            Enable background transmission to receive critical task updates.
                        </p>
                        <button 
                            onClick={subscribeToPush} 
                            disabled={status === 'sending'}
                            className="w-full bg-zinc-900 hover:bg-white hover:text-black text-white border border-zinc-800 px-6 py-4 text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-50"
                        >
                            {status === 'sending' ? 'INITIALIZING...' : status === 'sent' ? 'PROTOCOL ACTIVE' : status === 'error' ? 'INIT FAILED' : 'INITIALIZE ALERT PROTOCOL'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

    useEffect(() => {
        setIsIOS(
            /iPad|iPhone|iPod/.test(navigator.userAgent) &&
            !('MSStream' in window)
        )
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }
        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    async function handleInstall() {
        if (deferredPrompt && 'prompt' in deferredPrompt) {
            ; (deferredPrompt as { prompt: () => void }).prompt()
        }
    }

    if (isStandalone) return null

    return (
        <div className="p-8 border border-zinc-800 bg-[#050505] transition-colors hover:border-zinc-700">
            <div className="mb-8 pb-4 border-b border-zinc-900">
                <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase">System Installation</h3>
            </div>

            <div className="space-y-6">
                <p className="text-zinc-500 text-xs uppercase tracking-widest leading-relaxed">
                    Deploy WhatNext natively to your local environment for zero-latency access and offline capabilities.
                </p>

                {deferredPrompt ? (
                    <button onClick={handleInstall} className="w-full bg-white text-black px-6 py-4 text-xs font-bold tracking-widest uppercase transition-all hover:bg-zinc-200 active:scale-[0.98]">
                        INSTALL NOW
                    </button>
                ) : isIOS ? (
                    <div className="bg-black p-4 border border-zinc-900 space-y-3">
                        <p className="text-zinc-400 text-[10px] font-mono uppercase flex items-center gap-3">
                            <span className="text-white border border-zinc-700 bg-zinc-900 px-1.5 py-0.5">01</span>
                            Acknowledge Share Icon
                        </p>
                        <p className="text-zinc-400 text-[10px] font-mono uppercase flex items-center gap-3">
                            <span className="text-white border border-zinc-700 bg-zinc-900 px-1.5 py-0.5">02</span>
                            Select &quot;Add to Home Screen&quot;
                        </p>
                    </div>
                ) : (
                    <div className="bg-black p-4 border border-zinc-900">
                        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest leading-relaxed">
                            Use browser options to force local installation.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export function PWAFeatures() {
    return (
        <>
            <PushNotificationManager />
            <InstallPrompt />
        </>
    )
}
