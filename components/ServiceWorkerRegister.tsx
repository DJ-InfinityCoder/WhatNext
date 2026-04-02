'use client';
 
import { useEffect, useState } from 'react';
import { Bell, X, ShieldAlert } from 'lucide-react';
import { subscribeUser } from '@/app/actions';
 
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
 
export default function ServiceWorkerRegister() {
    const [showBanner, setShowBanner] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
 
    useEffect(() => {
        // Allow localhost for testing
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            
            // Standard registration
            navigator.serviceWorker.register('/sw.js').then(
                (registration) => {
                    console.log('SW Registered with scope:', registration.scope);
                    checkSubscription(registration);
                },
                (err) => {
                    console.error('SW Registration Failed:', err);
                }
            );
        }
    }, []);
 
    const checkSubscription = async (registration: ServiceWorkerRegistration) => {
        // If permission is already denied, don't show banner
        if (Notification.permission === 'denied') return;
 
        // Monitor for activation to show banner if needed
        const sub = await registration.pushManager.getSubscription();
        
        if (!sub && Notification.permission === 'default') {
            // Wait a few seconds after load to show the banner for premium feel
            setTimeout(() => {
                const isDismissed = localStorage.getItem('pwa_notify_dismissed');
                if (!isDismissed) setShowBanner(true);
            }, 3000);
        }
    };
 
    const handleSubscribe = async () => {
        if (!isSupported) {
            console.error('Push Manager not supported');
            return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
            console.error('CRITICAL: VAPID Public Key is missing! Check your .env file.');
            alert('SYSTEM ERROR: Public Key is missing in the environment. Notifications cannot be initialized.');
            return;
        }
        
        setIsSubscribing(true);
        try {
            console.log('Initializing Alert Protocol with key:', vapidKey.slice(0, 5) + '...');
            
            // 1. Get all current registrations
            let registrations = await navigator.serviceWorker.getRegistrations();
            console.log('Initial registrations found:', registrations.length);

            // 2. If stuck or multiple, clear them for a clean start
            if (registrations.length === 0) {
                console.log('No registrations found. Registering anew...');
                await navigator.serviceWorker.register('/sw.js');
                // Wait for the new registration to activate
                await new Promise(r => setTimeout(r, 1000));
                registrations = await navigator.serviceWorker.getRegistrations();
            }

            // 3. Find the best registration or wait for ready
            const registration = registrations[0] || await navigator.serviceWorker.ready;
            
            console.log('Target Registration State:', registration.active ? 'ACTIVE' : (registration.waiting ? 'WAITING' : 'INSTALLING'));

            // 4. Try to subscribe
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
 
            const serializedSub = JSON.parse(JSON.stringify(sub));
            const result = await subscribeUser(serializedSub);
            
            if (result.success) {
                setShowBanner(false);
                console.log('Push Protocol Initialized Successfully');
            } else {
                throw new Error(result.error || 'Server registration failed');
            }
        } catch (error: any) {
            console.error('Push Initialization Failed:', error);
            
            if (error.message === 'SW_TIMEOUT' || error.name === 'AbortError') {
                alert('SYSTEM TIMEOUT: It looks like the browser is blocking the Service Worker. Please try clicking "Unregister All" and refresh.');
            } else {
                alert(`INITIALIZATION FAILED: ${error.message}`);
            }

            // If user denied permission in the browser prompt
            if (Notification.permission === 'denied') {
                setShowBanner(false);
            }
        } finally {
            setIsSubscribing(false);
        }
    };
 
    const unregisterAll = async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
            await reg.unregister();
        }
        localStorage.removeItem('pwa_notify_dismissed');
        window.location.reload();
    };
 
    const dismissBanner = () => {
        setShowBanner(false);
        // Dismissed for current session/24h - simple session dismissal for now
        localStorage.setItem('pwa_notify_dismissed', 'true');
    };
 
    if (!showBanner) return null;
 
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] w-[95%] max-w-lg animate-in slide-in-from-bottom-full duration-700 ease-out">
            <div className="bg-white dark:bg-black border-2 border-black dark:border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden relative">
                {/* Header Accents */}
                <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 flex">
                    <div className="h-full w-1/3 bg-black dark:bg-white animate-[shimmer_2s_infinite]"></div>
                </div>

                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 border-2 border-black dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center shrink-0 relative overflow-hidden group">
                            <Bell className="w-6 h-6 text-black dark:text-white relative z-10" />
                            <div className="absolute inset-0 bg-black/10 dark:bg-white/10 animate-ping opacity-20"></div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h4 className="text-[11px] font-black text-black dark:text-white uppercase tracking-[0.25em] mb-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                Alert Protocol Inactive
                            </h4>
                            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-widest leading-relaxed">
                                Establish background telemetry for real-time directive updates.
                            </p>
                        </div>
                    </div>
 
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                            onClick={handleSubscribe}
                            disabled={isSubscribing}
                            className="flex-1 sm:flex-none bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isSubscribing ? 'INITIALIZING...' : 'INITIALIZE'}
                        </button>
                        <button 
                            onClick={unregisterAll}
                            className="hidden sm:block p-2 border-2 border-zinc-200 dark:border-zinc-900 text-zinc-400 hover:text-red-500 hover:border-red-500 transition-all text-[8px] font-bold uppercase tracking-widest"
                            title="Reset Protocols"
                        >
                            RESET
                        </button>
                        <button 
                            onClick={dismissBanner}
                            className="p-2 border-2 border-zinc-200 dark:border-zinc-900 text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-zinc-700 transition-all"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center text-[7px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]">
                    <span>Status: Offline</span>
                    <span>System: WhatNext/Agency-OS</span>
                    <span>Class: Critical</span>
                </div>
            </div>
        </div>
    );
}
