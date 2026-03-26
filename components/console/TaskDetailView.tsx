'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
    X, Calendar, AlertCircle, Clock, Trash2, Edit3, 
    CheckCircle2, Archive, PlayCircle, Paperclip, Building2 
} from 'lucide-react';
import { changeTaskStatus, deleteTask } from '@/lib/actions/task.actions';

interface TaskDetailViewProps {
    task: any;
    onClose: () => void;
    onUpdate: () => void;
    onEdit: (task: any) => void;
}

export default function TaskDetailView({ task, onClose, onUpdate, onEdit }: TaskDetailViewProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewImage, setPreviewImage] = useState<{ url: string, name: string } | null>(null);

    const handleStatusChange = async (newStatus: string) => {
        setIsProcessing(true);
        try {
            await changeTaskStatus(task._id, newStatus);
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this directive?')) return;
        setIsProcessing(true);
        try {
            await deleteTask(task._id);
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const priorityColors = {
        low: 'text-zinc-500 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50',
        medium: 'text-zinc-400 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/30',
        high: 'text-yellow-600 dark:text-yellow-500 border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/50 dark:bg-yellow-900/10',
        urgent: 'text-red-600 dark:text-red-500 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10'
    };

    const statusIcons = {
        'pending': <Clock className="w-4 h-4" />,
        'in-progress': <PlayCircle className="w-4 h-4" />,
        'completed': <CheckCircle2 className="w-4 h-4" />,
        'archived': <Archive className="w-4 h-4" />
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end md:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Backdrop Click-Away */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Side Panel */}
            <div className="relative w-full max-w-2xl h-full md:h-[calc(100vh-2rem)] bg-white dark:bg-[#050505] border-l md:border border-zinc-200 dark:border-zinc-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-400 transition-colors overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50">
                    <div className="flex items-center gap-3">
                        <div className={`px-2.5 py-1 border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                            <AlertCircle className="w-3 h-3" /> {task.priority}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">Directive Details</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
                    
                    {/* Workspace Info */}
                    {task.workspaceId?.name && (
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                            <Building2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{task.workspaceId.name} Sector</span>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-black dark:text-white leading-tight break-words">
                            {task.title}
                        </h2>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/50 flex flex-col gap-1">
                            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Status</span>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white mt-1">
                                {statusIcons[task.status as keyof typeof statusIcons]}
                                {task.status}
                            </div>
                        </div>
                        <div className="p-4 border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/50 flex flex-col gap-1">
                            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Target Date</span>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white mt-1">
                                <Calendar className="w-4 h-4" />
                                {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'NO DEADLINE'}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Objective Parameters</label>
                        <div className="prose prose-zinc dark:prose-invert max-w-none prose-sm font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {task.description ? (
                                <div dangerouslySetInnerHTML={{ __html: task.description }} className="break-words" />
                            ) : (
                                <p className="italic text-zinc-400 dark:text-zinc-600">No telemetry data provided.</p>
                            )}
                        </div>
                    </div>

                    {/* Attachments */}
                    {task.attachments?.length > 0 && (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Paperclip className="w-3 h-3" /> Evidence Logs ({task.attachments.length})
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {task.attachments.map((file: any, idx: number) => (
                                    <div 
                                        key={idx} 
                                        className="aspect-square border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-pointer overflow-hidden group relative"
                                        onClick={() => setPreviewImage({ url: file.url, name: file.fileName || file.name })}
                                    >
                                        <img src={file.url} alt={file.fileName || file.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <PlayCircle className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Selection Buttons */}
                        <button 
                            disabled={isProcessing || task.status === 'pending'}
                            onClick={() => handleStatusChange('pending')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 ${task.status === 'pending' ? 'bg-black text-white dark:bg-white dark:text-black' : 'border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white'}`}
                        >
                            <Clock className="w-3 h-3" /> Pending
                        </button>

                        <button 
                            disabled={isProcessing || task.status === 'in-progress'}
                            onClick={() => handleStatusChange('in-progress')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 ${task.status === 'in-progress' ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black' : 'border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white'}`}
                        >
                            <PlayCircle className="w-3 h-3" /> In Progress
                        </button>

                        <button 
                            disabled={isProcessing || task.status === 'completed'}
                            onClick={() => handleStatusChange('completed')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 ${task.status === 'completed' ? 'bg-green-600 text-white' : 'border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-green-600'}`}
                        >
                            <CheckCircle2 className="w-3 h-3" /> Completed
                        </button>

                        <div className="w-[1px] h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                        <button 
                            disabled={isProcessing}
                            onClick={() => onEdit(task)}
                            className="p-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors"
                            title="Edit Directive"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {task.status !== 'archived' && (
                             <button 
                                disabled={isProcessing}
                                onClick={() => handleStatusChange('archived')}
                                className="p-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-yellow-600 transition-colors"
                                title="Archive Directive"
                            >
                                <Archive className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button 
                            disabled={isProcessing}
                            onClick={handleDelete}
                            className="p-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-red-600 transition-colors"
                            title="Purge Directive"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Preview Overlay */}
            {previewImage && (
                <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center p-4">
                    <button 
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-6 right-6 text-white hover:text-zinc-400 transition-colors z-20"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img 
                        src={previewImage.url} 
                        alt={previewImage.name} 
                        className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300" 
                    />
                </div>
            )}
        </div>
    );
}
