'use client';

import { useState, useCallback, useEffect } from 'react';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import TaskDetailView from './TaskDetailView';
import { getTasks } from '@/lib/actions/task.actions';
import { Plus, Search, Filter } from 'lucide-react';

export default function ConsoleClientBoard({
    workspaceId,
    initialTasks,
    smartView,
    projectTitle,
    defaultWorkspaceId,
    workspaces
}: {
    workspaceId: string,
    initialTasks: any[],
    smartView?: string,
    projectTitle?: string,
    defaultWorkspaceId?: string,
    workspaces: any[]
}) {
    const [tasks, setTasks] = useState(initialTasks);
    const [isCreating, setIsCreating] = useState(false);
    const [editingTask, setEditingTask] = useState<any | null>(null);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchTasks = useCallback(async () => {
        setIsRefreshing(true);
        try {
            // Apply a projectId/listId filter if the board is mounted in a specific View
            const filters: any = {};
            if (smartView) filters.view = smartView;
            if (debouncedSearchQuery.trim()) filters.searchQuery = debouncedSearchQuery.trim();
            if (filterStatus) filters.status = filterStatus;
            if (filterPriority) filters.priority = filterPriority;

            const freshTasks = await getTasks(workspaceId, filters);
            setTasks(freshTasks);
        } catch (e) {
            console.error(e);
        } finally {
            setIsRefreshing(false);
        }
    }, [workspaceId, smartView, debouncedSearchQuery, filterStatus, filterPriority]);

    // Added separate useEffect to trigger fetchTasks when filters or debounced query changes
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleFormSuccess = () => {
        setIsCreating(false);
        setEditingTask(null);
        setSelectedTask(null);
        fetchTasks();
    };

    const handleCancelForm = () => {
        setIsCreating(false);
        setEditingTask(null);
    };

    return (
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative pb-16 md:pb-0">
            <header className="h-16 border-b border-zinc-200 dark:border-zinc-900 flex items-center px-4 md:px-8 justify-between shrink-0 bg-white dark:bg-[#050505] z-10 w-full transition-colors">
                <h1 className="text-sm text-black dark:text-white font-bold tracking-[0.2em] uppercase flex items-center gap-4 hidden md:flex">
                    {workspaceId === 'all' ? "Global Directives" : `${projectTitle || "Active"} Directives`}
                    {isRefreshing && <span className="w-3 h-3 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin"></span>}
                </h1>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {/* Search Input */}
                    <div className="relative flex items-center flex-1 md:flex-initial">
                        <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-3" />
                        <input
                            type="text"
                            placeholder="SEARCH..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 pl-9 pr-3 py-2 md:py-1.5 text-[10px] md:text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 font-mono focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 uppercase w-full md:w-32 transition-all focus:md:w-64"
                        />
                    </div>

                    {/* Filter Dropdown Toggle */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 border transition-colors flex items-center justify-center h-8 md:h-[28px] ${showFilters || filterPriority || filterStatus ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800 hover:text-black dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500'}`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                        </button>

                        {showFilters && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40 cursor-default" 
                                    onClick={() => setShowFilters(false)} 
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-3 z-50 shadow-2xl transition-colors">
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">Priority</label>
                                        <select
                                            value={filterPriority}
                                            onChange={(e) => setFilterPriority(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-black dark:text-white p-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 outline-none block uppercase cursor-pointer transition-colors"
                                        >
                                            <option value="">All Priorities</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                    {filterPriority && (
                                        <button
                                            onClick={() => { setFilterPriority(''); }}
                                            className="w-full text-[9px] font-bold text-zinc-500 hover:text-black dark:hover:text-white uppercase tracking-widest pt-2 border-t border-zinc-200 dark:border-zinc-900 mt-2 transition-colors"
                                        >
                                            Clear Filter
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    </div>

                    <button
                        onClick={() => { setEditingTask(null); setIsCreating(true); }}
                        disabled={isCreating || !!editingTask}
                        className="bg-black text-white dark:bg-white dark:text-black px-4 md:px-6 py-2 text-[10px] h-8 md:h-[28px] font-black tracking-widest uppercase hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                    >
                        <Plus className="w-3 h-3" strokeWidth={3} /> <span className="hidden md:inline">Initialize</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8 relative">
                <div className="max-w-4xl mx-auto">
                    {(isCreating || editingTask) ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-none shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
                                <TaskForm
                                    workspaceId={editingTask?.workspaceId || workspaceId}
                                    workspaces={workspaces}
                                    initialData={editingTask}
                                    onSuccess={handleFormSuccess}
                                    onCancel={handleCancelForm}
                                />
                            </div>
                        </div>
                    ) : null}

                    <TaskList
                        tasks={tasks}
                        isGlobalView={workspaceId === 'all'}
                        activeView={smartView}
                        onTaskUpdate={fetchTasks}
                        onTaskClick={setSelectedTask}
                        onEditTask={(task) => setEditingTask(task)}
                    />
                </div>
            </div>

            {selectedTask && (
                <TaskDetailView 
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={fetchTasks}
                    onEdit={(task) => {
                        setSelectedTask(null);
                        setEditingTask(task);
                    }}
                />
            )}
        </main>
    );
}
