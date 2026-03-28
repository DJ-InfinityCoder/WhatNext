import { currentUser } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrCreateDefaultWorkspace, getAllWorkspaces, getWorkspaceStats } from '@/lib/actions/workspace.actions'
import WorkspaceSwitcher from '@/components/console/WorkspaceSwitcher'
import MobileDrawer from '@/components/console/MobileDrawer'
import SettingsClient from '@/components/console/SettingsClient'

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ws?: string }> }) {
    const { ws } = await searchParams;
    const user = await currentUser()

    if (!user) {
        redirect('/')
    }

    await getOrCreateDefaultWorkspace()
    const workspaces = await getAllWorkspaces()
    const activeWorkspaceId = ws || workspaces[0]?._id.toString()

    // Fetch stats for each workspace in parallel
    const statsEntries = await Promise.all(
        workspaces.map(async (w) => {
            const stats = await getWorkspaceStats(w._id.toString())
            return [w._id.toString(), stats] as const
        })
    )
    const stats = Object.fromEntries(statsEntries)

    const primaryEmail = user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress

    return (
        <div className="h-[100dvh] overflow-hidden bg-white dark:bg-black text-black dark:text-white font-mono flex transition-colors">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 border-r border-zinc-200 dark:border-zinc-900 h-full flex-col justify-between shrink-0 transition-colors">
                <div className="flex flex-col h-full min-h-0">
                    <div className="h-16 border-b border-zinc-200 dark:border-zinc-900 flex items-center px-6 shrink-0 transition-colors">
                        <span className="font-black tracking-tighter text-xl text-black dark:text-white">WN__</span>
                    </div>

                    {/* Sector / Workspace Switcher */}
                    <div className="border-b border-zinc-200 dark:border-zinc-900 z-50 transition-colors shrink-0">
                        <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} baseUrl="/console/settings" />
                    </div>

                    <nav className="py-6 px-4 space-y-1.5 flex-1 z-0 overflow-y-auto custom-scrollbar">
                        <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] px-4 mb-2 block">Directives</label>
                        
                        <Link 
                            href={`/console?ws=${activeWorkspaceId}&view=active`} 
                            className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-950 hover:text-black dark:hover:text-white transition-colors text-sm font-bold tracking-widest uppercase"
                        >
                            Active
                        </Link>

                        <Link 
                            href={`/console?ws=${activeWorkspaceId}&view=completed`} 
                            className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-950 hover:text-black dark:hover:text-white transition-colors text-sm font-bold tracking-widest uppercase"
                        >
                            Completed
                        </Link>

                        <Link 
                            href={`/console?ws=${activeWorkspaceId}&view=archived`} 
                            className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-950 hover:text-black dark:hover:text-white transition-colors text-sm font-bold tracking-widest uppercase"
                        >
                            Archived
                        </Link>

                        <div className="h-4"></div>
                        <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] px-4 mb-2 block">System</label>
                        <Link href={`/console/settings?ws=${activeWorkspaceId}`} className="flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white transition-colors text-sm font-bold tracking-widest uppercase mb-4">
                            Settings
                        </Link>
                    </nav>
                </div>

                {/* User Card */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group z-0 shrink-0">
                    <div className="relative w-8 h-8 rounded-full flex items-center justify-center">
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-8 h-8 rounded-full border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 transition-colors",
                                    userButtonBox: "hover:bg-transparent",
                                }
                            }}
                            afterSignOutUrl="/"
                        />
                    </div>
                    <div className="flex flex-col truncate flex-1">
                        <span className="text-xs font-bold uppercase tracking-wider truncate text-zinc-600 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                            {user.firstName} {user.lastName}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-600 truncate transition-colors">
                            {primaryEmail}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative pb-16 md:pb-0">
                {/* Header */}
                <header className="h-16 border-b border-zinc-200 dark:border-zinc-900 flex items-center px-4 md:px-8 justify-between shrink-0 bg-white dark:bg-[#050505] z-10 w-full transition-colors">
                    <h1 className="text-sm text-black dark:text-white font-bold tracking-[0.2em] uppercase flex items-center gap-4">
                        System Configuration
                    </h1>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8">
                    <div className="max-w-4xl mx-auto">
                        <SettingsClient 
                            workspaces={workspaces} 
                            activeWorkspaceId={activeWorkspaceId} 
                            stats={stats}
                        />
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#050505] flex items-center justify-around px-4 z-50 transition-colors">
                <Link href={`/console?ws=${activeWorkspaceId}&view=active`} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                    <span className="text-[10px] font-bold tracking-widest uppercase">Directives</span>
                </Link>

                <MobileDrawer workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />
                <div className="flex flex-col items-center gap-1">
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-6 h-6 rounded-full border border-zinc-300 dark:border-zinc-700 grayscale",
                                userButtonBox: "hover:bg-transparent",
                            }
                        }}
                        afterSignOutUrl="/"
                    />
                </div>
            </nav>
        </div>
    )
}
