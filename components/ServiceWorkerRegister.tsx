'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                        console.log('SW Registered with scope:', registration.scope);
                    },
                    (err) => {
                        console.error('SW Registration Failed:', err);
                    }
                );
            });
        }
    }, []);

    return null;
}
