'use client';

import { format } from 'date-fns';
import { AlertCircle, Clock, Calendar, CheckCircle2, PlayCircle, Archive, Info } from 'lucide-react';

interface TaskListProps {
    tasks: any[];
    isGlobalView?: boolean;
    activeView?: string;
    onTaskUpdate: () => void;
    onTaskClick: (task: any) => void;
    onEditTask: (task: any) => void;
}

export default function TaskList({ tasks, isGlobalView, activeView, onTaskClick }: TaskListProps) {
    
    const priorityBorders = {
        low: 'border-l-zinc-300 dark:border-l-zinc-700',
        medium: 'border-l-zinc-400 dark:border-l-zinc-500',
        high: 'border-l-yellow-500',
        urgent: 'border-l-red-500'
    };

    const priorityColors = {
        low: 'text-zinc-500 border-zinc-200 dark:border-zinc-800',
        medium: 'text-zinc-400 border-zinc-300 dark:border-zinc-700',
        high: 'text-yellow-600 dark:text-yellow-500 border-yellow-200 dark:border-yellow-900/50',
        urgent: 'text-red-600 dark:text-red-500 border-red-200 dark:border-red-900/50'
    };

    const priorityBackgrounds = {
        low: 'bg-zinc-50 dark:bg-[#0a0a0a]',
        medium: 'bg-white dark:bg-[#050505]',
        high: 'bg-yellow-50 dark:bg-yellow-950/30',
        urgent: 'bg-red-50 dark:bg-red-950/30'
    };

    const statusIcons = {
        'pending': <Clock className="w-3 h-3" />,
        'in-progress': <PlayCircle className="w-3 h-3" />,
        'completed': <CheckCircle2 className="w-3 h-3 text-zinc-400" />,
        'archived': <Archive className="w-3 h-3 text-zinc-400" />
    };

    return (
        <div className="space-y-3">
            {tasks.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-900 transition-colors">
                    <h2 className="text-zinc-400 dark:text-zinc-700 text-[10px] font-black tracking-[0.2em] uppercase mb-2">
                        {activeView === 'completed' ? 'No Completed Directives' : 
                         activeView === 'archived' ? 'No Archived Directives' : 
                         'No Active Directives'}
                    </h2>
                </div>
            ) : (
                tasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    const priorityBorder = priorityBorders[task.priority as keyof typeof priorityBorders];
                    const priorityBackground = priorityBackgrounds[task.priority as keyof typeof priorityBackgrounds];

                    return (
                        <div 
                            key={task._id} 
                            onClick={() => onTaskClick(task)}
                            className="group/card relative cursor-pointer"
                        >
                            {isGlobalView && task.workspaceId?.name && (
                                <div className="absolute -top-1.5 left-4 px-1.5 py-0.5 bg-black text-white dark:bg-white dark:text-black text-[7px] font-black tracking-[0.2em] uppercase z-20 transition-colors">
                                    {task.workspaceId.name}
                                </div>
                            )}
                            <div
                                className={`flex items-center justify-between gap-4 p-4 border-2 border-l-[4px] transition-all duration-200 ${isCompleted
                                    ? 'border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50 opacity-60'
                                    : `${priorityBorder} border-zinc-100 dark:border-zinc-900 ${priorityBackground} hover:border-black dark:hover:border-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]`
                                    } relative`}
                            >
                                {/* Metadata Summary */}
                                <div className="flex-1 min-w-0 flex items-center gap-4">
                                    <div className="shrink-0 transition-colors">
                                        {statusIcons[task.status as keyof typeof statusIcons]}
                                    </div>
                                    
                                    <h4 className={`text-sm font-black tracking-tight uppercase truncate flex-1 transition-all ${isCompleted ? 'text-zinc-400 dark:text-zinc-700 line-through' : 'text-black dark:text-white'}`}>
                                        {task.title}
                                    </h4>
                                </div>

                                {/* Right Side Labels */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {task.dueDate && (
                                        <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isCompleted ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                            <Calendar className="w-3 h-3" />
                                            <span className="hidden sm:inline">{format(new Date(task.dueDate), 'MMM dd')}</span>
                                        </span>
                                    )}
                                    
                                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 border ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                                        {task.priority}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
