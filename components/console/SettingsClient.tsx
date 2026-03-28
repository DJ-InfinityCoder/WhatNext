'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Building2, UserCircle, Edit3, Trash2, Plus, X, Check, 
    AlertCircle, ChevronDown, Loader2, Shield
} from 'lucide-react';
import { 
    createWorkspace, updateWorkspace, deleteWorkspace 
} from '@/lib/actions/workspace.actions';
import { format } from 'date-fns';

interface SettingsClientProps {
    workspaces: any[];
    activeWorkspaceId: string;
    stats: Record<string, { total: number; pending: number; inProgress: number; completed: number; archived: number }>;
}

export default function SettingsClient({ workspaces, activeWorkspaceId, stats }: SettingsClientProps) {
    const router = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState<'personal' | 'work'>('personal');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create state
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'personal' | 'work'>('personal');

    const startEdit = (ws: any) => {
        setEditingId(ws._id);
        setEditName(ws.name);
        setEditType(ws.type);
        setError(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setError(null);
    };

    const handleUpdate = async (wsId: string) => {
        if (!editName.trim()) return;
        setIsProcessing(true);
        setError(null);
        try {
            await updateWorkspace(wsId, { name: editName.trim(), type: editType });
            setEditingId(null);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to update');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (wsId: string, wsName: string) => {
        if (!confirm(`Permanently delete "${wsName}" sector? This will destroy ALL directives, attachments, reminders, and notifications inside it. This action cannot be undone.`)) return;
        setIsProcessing(true);
        setError(null);
        try {
            await deleteWorkspace(wsId);
            // Redirect to first remaining workspace
            router.push(`/console/settings?ws=${workspaces.find(w => w._id !== wsId)?._id || ''}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to delete');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setIsProcessing(true);
        setError(null);
        try {
            const ws = await createWorkspace({ name: newName.trim(), type: newType });
            setIsCreating(false);
            setNewName('');
            router.push(`/console/settings?ws=${ws._id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to create');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Page Title */}
            <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white">
                    Config_Panel
                </h1>
                <p className="text-sm font-black text-zinc-500 dark:text-zinc-600 tracking-[0.2em] uppercase">
                    Sector Management & System Configuration
                </p>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 border-2 border-red-500 bg-red-50 dark:bg-red-950/20 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Workspace List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                        Registered Sectors ({workspaces.length})
                    </label>
                    {!isCreating && (
                        <button
                            onClick={() => { setIsCreating(true); setError(null); }}
                            className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Initialize Sector
                        </button>
                    )}
                </div>

                {/* Create Form */}
                {isCreating && (
                    <div className="border-2 border-black dark:border-white p-6 bg-white dark:bg-[#050505] transition-colors animate-in slide-in-from-top-2 duration-200">
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Sector Alias</label>
                                <input
                                    autoFocus
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="ENTER SECTOR NAME..."
                                    maxLength={30}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 font-black uppercase tracking-wider focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Sector Type</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewType('personal')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black tracking-widest uppercase border-2 transition-all ${newType === 'personal' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-300 dark:border-zinc-800 hover:border-zinc-500 dark:hover:border-zinc-600'}`}
                                    >
                                        <UserCircle className="w-4 h-4" /> Personal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewType('work')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black tracking-widest uppercase border-2 transition-all ${newType === 'work' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-300 dark:border-zinc-800 hover:border-zinc-500 dark:hover:border-zinc-600'}`}
                                    >
                                        <Building2 className="w-4 h-4" /> Work
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setNewName(''); }}
                                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-black dark:hover:text-white border border-zinc-300 dark:border-zinc-800 hover:border-zinc-500 transition-colors"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessing || !newName.trim()}
                                    className="flex-1 py-3 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                    Deploy
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Workspace Cards */}
                <div className="space-y-3">
                    {workspaces.map((ws) => {
                        const wsStats = stats[ws._id] || { total: 0, pending: 0, inProgress: 0, completed: 0, archived: 0 };
                        const isEditing = editingId === ws._id;
                        const isActive = ws._id === activeWorkspaceId;

                        return (
                            <div
                                key={ws._id}
                                className={`border-2 transition-all ${isActive ? 'border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.03)]' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'} bg-white dark:bg-[#050505]`}
                            >
                                {isEditing ? (
                                    /* Edit Mode */
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Sector Alias</label>
                                            <input
                                                autoFocus
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                maxLength={30}
                                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm text-black dark:text-white font-black uppercase tracking-wider focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Sector Type</label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditType('personal')}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[9px] font-black tracking-widest uppercase border-2 transition-all ${editType === 'personal' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-300 dark:border-zinc-800'}`}
                                                >
                                                    <UserCircle className="w-3.5 h-3.5" /> Personal
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditType('work')}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[9px] font-black tracking-widest uppercase border-2 transition-all ${editType === 'work' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-300 dark:border-zinc-800'}`}
                                                >
                                                    <Building2 className="w-3.5 h-3.5" /> Work
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-1">
                                            <button
                                                onClick={cancelEdit}
                                                className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-black dark:hover:text-white border border-zinc-300 dark:border-zinc-800 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdate(ws._id)}
                                                disabled={isProcessing || !editName.trim()}
                                                className="flex-1 py-2.5 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                Commit
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View Mode */
                                    <div className="p-6">
                                        <div className="flex items-start justify-between gap-4 mb-5">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-10 h-10 border-2 flex items-center justify-center shrink-0 transition-colors ${isActive ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'}`}>
                                                    {ws.type === 'work' 
                                                        ? <Building2 className={`w-5 h-5 ${isActive ? 'text-white dark:text-black' : 'text-zinc-400'}`} /> 
                                                        : <UserCircle className={`w-5 h-5 ${isActive ? 'text-white dark:text-black' : 'text-zinc-400'}`} />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-black uppercase tracking-tight text-black dark:text-white truncate">
                                                        {ws.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500">
                                                            {ws.type}
                                                        </span>
                                                        <span className="text-[9px] text-zinc-400 dark:text-zinc-600">
                                                            Created {format(new Date(ws.createdAt), 'MMM dd, yyyy')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => startEdit(ws)}
                                                    disabled={isProcessing}
                                                    className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors disabled:opacity-50"
                                                    title="Edit Sector"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                {workspaces.length > 1 && (
                                                    <button
                                                        onClick={() => handleDelete(ws._id, ws.name)}
                                                        disabled={isProcessing}
                                                        className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-500 transition-colors disabled:opacity-50"
                                                        title="Purge Sector"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-900">
                                                <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Pending</span>
                                                <span className="text-lg font-black text-black dark:text-white">{wsStats.pending}</span>
                                            </div>
                                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-900">
                                                <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Active</span>
                                                <span className="text-lg font-black text-black dark:text-white">{wsStats.inProgress}</span>
                                            </div>
                                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-900">
                                                <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Done</span>
                                                <span className="text-lg font-black text-black dark:text-white">{wsStats.completed}</span>
                                            </div>
                                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-900">
                                                <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Total</span>
                                                <span className="text-lg font-black text-black dark:text-white">{wsStats.total}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* System Info */}
            <div className="border-2 border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-[#050505]">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-zinc-400" />
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">System Diagnostics</label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-900">
                        <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Sectors</span>
                        <span className="text-2xl font-black text-black dark:text-white">{workspaces.length}</span>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-900">
                        <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Total Directives</span>
                        <span className="text-2xl font-black text-black dark:text-white">
                            {Object.values(stats).reduce((sum, s) => sum + s.total, 0)}
                        </span>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-900">
                        <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Completion Rate</span>
                        <span className="text-2xl font-black text-black dark:text-white">
                            {(() => {
                                const totalAll = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
                                const completedAll = Object.values(stats).reduce((sum, s) => sum + s.completed, 0);
                                return totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;
                            })()}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
