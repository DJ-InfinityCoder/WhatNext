import { currentUser } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrCreateDefaultWorkspace, getAllWorkspaces } from '@/lib/actions/workspace.actions'
import { getTasks } from '@/lib/actions/task.actions'
import ConsoleClientBoard from '@/components/console/ConsoleClientBoard'
import WorkspaceSwitcher from '@/components/console/WorkspaceSwitcher'
import MobileDrawer from '@/components/console/MobileDrawer'

export default async function Console({ searchParams }: { searchParams: Promise<{ ws?: string, view?: string }> }) {
    const { ws, view = 'active' } = await searchParams;
    const user = await currentUser()

    if (!user) {
        redirect('/')
    }

    // 1. Ensure at least one Workspace exists
    await getOrCreateDefaultWorkspace()

    // 2. Fetch all Workspaces for the switcher
    const workspaces = await getAllWorkspaces()

    // 3. Determine the Active Workspace from URL, fallback to the first loaded one
    const activeWorkspaceId = ws || workspaces[0]?._id.toString()
    const activeWorkspace = workspaces.find((w) => w._id.toString() === activeWorkspaceId)

    // 4. Fetch tasks specifically for the active workspace
    const initialTasks = await getTasks(activeWorkspaceId, { view })

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
                        <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />
                    </div>

                    <nav className="py-6 px-4 space-y-1.5 flex-1 z-0 overflow-y-auto custom-scrollbar">
                        <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] px-4 mb-2 block">Directives</label>
                        
                        <Link 
                            href={`/console?ws=${activeWorkspaceId}&view=active`} 
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${view === 'active' ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-950 hover:text-black dark:hover:text-white'}`}
                        >
                            Active
                        </Link>

                        <Link 
                            href={`/console?ws=${activeWorkspaceId}&view=completed`} 
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${view === 'completed' ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-950 hover:text-black dark:hover:text-white'}`}
                        >
                            Completed
                        </Link>

                        <Link 
                            href={`/console?ws=${activeWorkspaceId}&view=archived`} 
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${view === 'archived' ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-950 hover:text-black dark:hover:text-white'}`}
                        >
                            Archived
                        </Link>

                        <div className="h-4"></div>
                        <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] px-4 mb-2 block">System</label>
                        <Link href={`/console/settings?ws=${activeWorkspaceId}`} className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-950 hover:text-black dark:hover:text-white transition-colors text-sm font-bold tracking-widest uppercase mb-4">
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

            {/* Main Content (Delegated to Client Component for interactivity) */}
            <ConsoleClientBoard 
                workspaceId={activeWorkspaceId} 
                initialTasks={initialTasks} 
                smartView={view}
                defaultWorkspaceId={workspaces[0]?._id.toString()}
                projectTitle={activeWorkspace?.name}
                workspaces={workspaces}
            />

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#050505] flex items-center justify-around px-4 z-50 transition-colors">
                <Link href={`/console?ws=${activeWorkspaceId}&view=active`} className="flex flex-col items-center gap-1 text-black dark:text-white transition-colors">
                    <span className="text-[10px] font-bold tracking-widest uppercase">Directives</span>
                </Link>

                <MobileDrawer workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} view={view} />
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
