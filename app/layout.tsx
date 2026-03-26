import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from "@clerk/nextjs"
import { ImageKitProvider } from "@imagekit/next"
import { ThemeProvider } from '@/components/theme-provider'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'WhatNext — Progressive Web App',
  description:
    'A blazing-fast Progressive Web App built with Next.js. Installable, offline-ready, and notification-enabled.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WhatNext',
  },
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
          <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="theme-color" content="#000000" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ImageKitProvider urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <ServiceWorkerRegister />
              {children}
            </ThemeProvider>
          </ImageKitProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
