import { NextRequest, NextResponse } from 'next/server';
import { processPendingReminders } from '@/lib/actions/notification.actions';

/**
 * GET /api/worker/reminders
 * 
 * Secure trigger for processing pending task reminders.
 * In production, secure this with a secret header (e.g. CRON_SECRET).
 */
export async function GET(req: NextRequest) {
    try {
        // --- PRODUCTION SECURITY ---
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        console.log("WORKER: STARTING REMINDER PROCESSING...");
        const result = await processPendingReminders();
        console.log("WORKER: FINISHED. RESULT:", result);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...result
        });

    } catch (error: any) {
        console.error("WORKER ERROR:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// Ensure the route is dynamic and not cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;
