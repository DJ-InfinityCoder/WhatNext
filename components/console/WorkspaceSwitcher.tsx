'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { createWorkspace } from '@/lib/actions/workspace.actions';
import { ChevronDown, Plus, Building2, UserCircle, Sun, Moon, Globe } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface WorkspaceSwitcherProps {
    workspaces: any[];
    activeWorkspaceId: string;
    baseUrl?: string;
}

export default function WorkspaceSwitcher({ workspaces, activeWorkspaceId, baseUrl = '/console' }: WorkspaceSwitcherProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'active';
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => setMounted(true), []);

    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'personal' | 'work'>('personal');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeWorkspace = workspaces.find(w => w._id === activeWorkspaceId) || (activeWorkspaceId === 'all' ? null : workspaces[0]);

    const handleSelect = (id: string) => {
        setIsOpen(false);
        // Persist active workspace via URL param to keep it server-parsable
        // Also preserve current view
        router.push(`${baseUrl}?ws=${id}&view=${currentView}`);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setIsSubmitting(true);
        try {
            const newWs = await createWorkspace({ name: newName, type: newType });
            setIsCreating(false);
            setNewName('');
            // Force refresh data and switch to new workspace
            router.push(`${baseUrl}?ws=${newWs._id}&view=${currentView}`);
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative isolate z-50">

            {/* Active Selection Button & Theme Toggle */}
            <div className="flex border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 transition-colors">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 flex items-center justify-between p-4 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors group"
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-6 h-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 transition-colors">
                            {activeWorkspaceId === 'all' ? (
                                <Globe className="w-3 h-3 text-black dark:text-white" />
                            ) : (
                                activeWorkspace?.type === 'work' ? <Building2 className="w-3 h-3 text-black dark:text-white" /> : <UserCircle className="w-3 h-3 text-black dark:text-white" />
                            )}
                        </div>
                        <div className="flex flex-col items-start truncate overflow-hidden text-left">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-widest leading-none mb-1">Active Sector</span>
                            <span className="text-xs text-black dark:text-white font-black uppercase tracking-wider truncate w-full group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                                {activeWorkspaceId === 'all' ? 'All Sectors' : (activeWorkspace?.name || 'Loading...')}
                            </span>
                        </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 dark:text-zinc-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {mounted && (
                    <button
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        className="px-4 border-l border-zinc-200 dark:border-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 transition-colors flex items-center justify-center shrink-0"
                    >
                        {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                )}
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#050505] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 transition-colors">

                    {/* Workspace List */}
                    <div className="max-h-64 overflow-y-auto">
                        <button
                            onClick={() => handleSelect('all')}
                            className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${activeWorkspaceId === 'all'
                                ? 'bg-zinc-50 dark:bg-zinc-900 border-l-2 border-l-black dark:border-l-white'
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                                }`}
                        >
                            <Globe className={`w-4 h-4 ${activeWorkspaceId === 'all' ? 'text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`} />
                            <span className={`text-xs font-bold uppercase tracking-wider flex-1 truncate ${activeWorkspaceId === 'all' ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                All Sectors
                            </span>
                        </button>

                        {workspaces.map((ws) => (
                            <button
                                key={ws._id}
                                onClick={() => handleSelect(ws._id)}
                                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${ws._id === activeWorkspaceId
                                    ? 'bg-zinc-50 dark:bg-zinc-900 border-l-2 border-l-black dark:border-l-white'
                                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                                    }`}
                            >
                                {ws.type === 'work' ? <Building2 className={`w-4 h-4 ${ws._id === activeWorkspaceId ? 'text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`} /> : <UserCircle className={`w-4 h-4 ${ws._id === activeWorkspaceId ? 'text-black dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`} />}
                                <span className={`text-xs font-bold uppercase tracking-wider flex-1 truncate ${ws._id === activeWorkspaceId ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                    {ws.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Setup Action */}
                    <div className="p-2 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 transition-colors">
                        {!isCreating ? (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full flex items-center justify-center gap-2 p-3 text-[10px] font-black tracking-widest uppercase text-zinc-500 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-900 transition-colors"
                            >
                                <Plus className="w-3 h-3" /> Initialize new sector
                            </button>
                        ) : (
                            <form onSubmit={handleCreate} className="p-2 space-y-3">
                                <input
                                    autoFocus
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="SECTOR ALIAS..."
                                    maxLength={30}
                                    className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 px-3 py-2 text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 font-bold uppercase tracking-widest focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewType('personal')}
                                        className={`flex-1 py-2 text-[9px] font-black tracking-widest uppercase border transition-colors ${newType === 'personal' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
                                    >
                                        Personal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewType('work')}
                                        className={`flex-1 py-2 text-[9px] font-black tracking-widest uppercase border transition-colors ${newType === 'work' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
                                    >
                                        Work
                                    </button>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 py-2 text-[9px] font-black uppercase text-zinc-500 tracking-widest hover:text-black dark:hover:text-white transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !newName.trim()}
                                        className="flex-1 py-2 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white text-[9px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        {isSubmitting ? '...' : 'Deploy'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                </div>
            )}

            {/* Invisible backdrop to catch clicks outside dropdown */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => { setIsOpen(false); setIsCreating(false); }}
                />
            )}
        </div>
    );
}
