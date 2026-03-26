import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'WhatNext PWA',
        short_name: 'WhatNext',
        description: 'A Progressive Web App built with Next.js',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#7c3aed',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
