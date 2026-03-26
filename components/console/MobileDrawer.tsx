'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Settings, CheckCircle2, Home } from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';

interface MobileDrawerProps {
    workspaces: any[];
    activeWorkspaceId: string;
    view?: string;
}

export default function MobileDrawer({ workspaces, activeWorkspaceId, view = 'active' }: MobileDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            {/* Menu Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex flex-col items-center gap-1 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                aria-label="Open Menu"
            >
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Menu</span>
            </button>

            {/* Drawer Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer Content */}
            <aside
                className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-white dark:bg-black z-[101] border-r-4 border-black dark:border-white shadow-[8px_0px_0px_0px_rgba(0,0,0,0.1)] transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="h-16 border-b-4 border-black dark:border-white flex items-center justify-between px-6 shrink-0 bg-zinc-100 dark:bg-zinc-900 transition-colors">
                        <span className="font-black tracking-tighter text-xl text-black dark:text-white">WN__ MENU</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors border-2 border-black dark:border-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Workspace Switcher in Drawer */}
                    <div className="border-b-2 border-zinc-200 dark:border-zinc-900 z-50 transition-colors shrink-0">
                        <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />
                    </div>

                    {/* Navigation Links */}
                    <nav className="py-6 px-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar font-mono transition-colors">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] px-4 block mb-2">Navigation</span>
                            <Link
                                href={`/console?ws=${activeWorkspaceId}&view=active`}
                                className={`flex items-center gap-3 px-4 py-3 border-2 transition-all text-xs font-bold tracking-widest uppercase ${view === 'active' ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]' : 'text-zinc-500 hover:text-black dark:hover:text-white border-transparent'}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <Home className="w-4 h-4" /> Active
                            </Link>

                            <Link
                                href={`/console?ws=${activeWorkspaceId}&view=completed`}
                                className={`flex items-center gap-3 px-4 py-3 border-2 transition-all text-xs font-bold tracking-widest uppercase ${view === 'completed' ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]' : 'text-zinc-500 hover:text-black dark:hover:text-white border-transparent'}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <CheckCircle2 className="w-4 h-4" /> Completed
                            </Link>

                            <Link
                                href={`/console?ws=${activeWorkspaceId}&view=archived`}
                                className={`flex items-center gap-3 px-4 py-3 border-2 transition-all text-xs font-bold tracking-widest uppercase ${view === 'archived' ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]' : 'text-zinc-500 hover:text-black dark:hover:text-white border-transparent'}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-4 h-4" /> Archived
                            </Link>

                            <Link
                                href={`/console/settings?ws=${activeWorkspaceId}`}
                                className="flex items-center gap-3 px-4 py-3 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border-2 border-transparent hover:border-black dark:hover:border-white transition-all text-xs font-bold tracking-widest uppercase"
                                onClick={() => setIsOpen(false)}
                            >
                                <Settings className="w-4 h-4" /> Settings
                            </Link>
                        </div>


                    </nav>
                </div>
            </aside>
        </>
    );
}
