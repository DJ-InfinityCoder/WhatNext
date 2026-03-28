'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
    X, Calendar, AlertCircle, Clock, Trash2, Edit3, 
    CheckCircle2, Archive, PlayCircle, Paperclip, Building2, 
    FileText, MessageSquare, Send, Flag, CornerDownRight, Loader2
} from 'lucide-react';
import { changeTaskStatus, deleteTask, addComment, deleteComment, commitCompletion } from '@/lib/actions/task.actions';

interface TaskDetailViewProps {
    task: any;
    onClose: () => void;
    onUpdate: (updatedTask?: any) => void;
    onEdit: (task: any) => void;
}

export default function TaskDetailView({ task: initialTask, onClose, onUpdate, onEdit }: TaskDetailViewProps) {
    const [task, setTask] = useState(initialTask);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewImage, setPreviewImage] = useState<{ url: string, name: string } | null>(null);

    // Sync task state when prop changes (e.g. after refreshSelectedTask in ConsoleClientBoard)
    useEffect(() => {
        setTask(initialTask);
    }, [initialTask]);

    // Comment state
    const [commentText, setCommentText] = useState('');
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

    // Completion commit state
    const [showCommitPanel, setShowCommitPanel] = useState(false);
    const [commitNote, setCommitNote] = useState('');
    const [isCommitting, setIsCommitting] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setIsProcessing(true);
        try {
            const updated = await changeTaskStatus(task._id, newStatus);
            setTask(updated);
            onUpdate();
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

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        const text = commentText.trim();
        
        // Optimistic update: show the comment immediately
        const optimisticComment = {
            _id: `temp-${Date.now()}`,
            text,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setTask((prev: any) => ({
            ...prev,
            comments: [...(prev.comments || []), optimisticComment],
        }));
        setCommentText('');
        setIsAddingComment(true);

        try {
            const updated = await addComment(task._id, text);
            setTask(updated); // Replace optimistic with real server data
            onUpdate(); // Sync parent
        } catch (error) {
            console.error(error);
            // Revert optimistic update on failure
            setTask((prev: any) => ({
                ...prev,
                comments: (prev.comments || []).filter((c: any) => c._id !== optimisticComment._id),
            }));
            setCommentText(text); // Restore the text
        } finally {
            setIsAddingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        setDeletingCommentId(commentId);
        try {
            const updated = await deleteComment(task._id, commentId);
            setTask(updated);
            onUpdate();
        } catch (error) {
            console.error(error);
        } finally {
            setDeletingCommentId(null);
        }
    };

    const handleCommitCompletion = async () => {
        if (!commitNote.trim()) return;
        setIsCommitting(true);
        try {
            const updated = await commitCompletion(task._id, commitNote.trim());
            setTask(updated);
            setShowCommitPanel(false);
            setCommitNote('');
            onUpdate();
        } catch (error) {
            console.error(error);
        } finally {
            setIsCommitting(false);
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

    const isInProgress = task.status === 'in-progress';
    const isCompleted = task.status === 'completed';

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

                {/* Content — scrollable */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">

                    {/* 1. SECTOR */}
                    {task.workspaceId?.name && (
                        <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                                {task.workspaceId.name} Sector
                            </span>
                        </div>
                    )}

                    {/* 2. TITLE */}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-black dark:text-white leading-tight break-words">
                            {task.title}
                        </h2>
                    </div>

                    {/* 3. DESCRIPTION */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                            Objective Parameters
                        </label>
                        <div className="prose prose-zinc dark:prose-invert max-w-none prose-sm font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {task.description ? (
                                <div dangerouslySetInnerHTML={{ __html: task.description }} className="break-words" />
                            ) : (
                                <p className="italic text-zinc-400 dark:text-zinc-600 text-sm">No description provided.</p>
                            )}
                        </div>
                    </div>

                    {/* DIVIDER */}
                    <div className="h-px bg-zinc-100 dark:bg-zinc-900" />

                    {/* 4. STATUS & META */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/50">
                            <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Status</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-black dark:text-white">
                                {statusIcons[task.status as keyof typeof statusIcons]}
                                {task.status}
                            </div>
                        </div>
                        <div className="p-3 border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/50">
                            <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Target Date</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-black dark:text-white">
                                <Calendar className="w-3.5 h-3.5" />
                                {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No Deadline'}
                            </div>
                        </div>
                        <div className="p-3 border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/50">
                            <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block mb-1">Priority</span>
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider`}>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span className={
                                    task.priority === 'urgent' ? 'text-red-500' :
                                    task.priority === 'high' ? 'text-yellow-500' :
                                    'text-zinc-500 dark:text-zinc-400'
                                }>{task.priority}</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. ATTACHMENTS */}
                    {(task.attachments?.length ?? 0) > 0 && (
                        <>
                            <div className="h-px bg-zinc-100 dark:bg-zinc-900" />
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Paperclip className="w-3 h-3" /> Evidence Logs
                                    <span className="text-[8px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-black text-zinc-500">
                                        {task.attachments.length}
                                    </span>
                                </label>
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                    {task.attachments.map((file: any, idx: number) => {
                                        const isImage = file.fileType?.includes('image') || file.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                                        return (
                                            <div
                                                key={file.publicId || idx}
                                                className="aspect-square border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-pointer overflow-hidden group relative flex items-center justify-center transition-all hover:border-black dark:hover:border-white"
                                                onClick={() => isImage ? setPreviewImage({ url: file.url, name: file.fileName || file.name }) : window.open(file.url, '_blank')}
                                            >
                                                {isImage ? (
                                                    <img src={file.url} alt={file.fileName || file.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 px-2">
                                                        <FileText className="w-6 h-6 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                                        <span className="text-[7px] font-black uppercase tracking-tight truncate max-w-full text-zinc-500">{file.fileName || 'File'}</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <PlayCircle className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    {/* DIVIDER */}
                    <div className="h-px bg-zinc-100 dark:bg-zinc-900" />

                    {/* 6. PROGRESS LOG */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" />
                                Progress Log
                                {(task.comments?.length ?? 0) > 0 && (
                                    <span className="text-[8px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-black text-zinc-500">
                                        {task.comments.length}
                                    </span>
                                )}
                            </label>
                            {!isInProgress && !isCompleted && (
                                <span className="text-[8px] italic text-zinc-400 dark:text-zinc-600">
                                    Switch to In Progress to log notes
                                </span>
                            )}
                        </div>

                        {/* Comment list — reversed for newest on top */}
                        {(task.comments?.length ?? 0) > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                {[...(task.comments || [])].reverse().map((comment: any, idx: number) => (
                                    <div key={comment._id || idx} className="group flex gap-2">
                                        <CornerDownRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700 mt-1 shrink-0" />
                                        <div className="flex-1 min-w-0 p-2.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                                            <p className="text-xs text-black dark:text-white leading-relaxed whitespace-pre-wrap break-words">
                                                {comment.text}
                                            </p>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                                                    {comment.createdAt ? format(new Date(comment.createdAt), 'dd MMM yyyy · HH:mm') : '—'}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteComment(comment._id)}
                                                    disabled={deletingCommentId === comment._id}
                                                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all disabled:opacity-100 p-0.5"
                                                >
                                                    {deletingCommentId === comment._id
                                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                                        : <Trash2 className="w-3 h-3" />
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] italic text-zinc-400 dark:text-zinc-600">No progress notes yet.</p>
                        )}

                        {/* Add Comment input — in-progress only */}
                        {isInProgress && (
                            <div className="flex gap-2">
                                <textarea
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                            e.preventDefault();
                                            handleAddComment();
                                        }
                                    }}
                                    placeholder="Log a progress update... (Ctrl+Enter to post)"
                                    rows={2}
                                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 font-medium resize-none focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={isAddingComment || !commentText.trim()}
                                    className="px-3 bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors flex items-center justify-center shrink-0"
                                >
                                    {isAddingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* DIVIDER */}
                    <div className="h-px bg-zinc-100 dark:bg-zinc-900" />

                    {/* 7. COMPLETION COMMIT */}
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Flag className={`w-3 h-3 ${isCompleted ? 'text-green-500' : ''}`} />
                            Completion Commit
                        </label>

                        {task.completionNote ? (
                            /* Already committed */
                            <div className="p-4 border border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/10">
                                <p className="text-sm text-black dark:text-white leading-relaxed whitespace-pre-wrap">
                                    {task.completionNote.note}
                                </p>
                                <span className="block mt-3 text-[9px] font-mono text-green-600 dark:text-green-500">
                                    ✓ Committed · {format(new Date(task.completionNote.committedAt), 'dd MMM yyyy · HH:mm')}
                                </span>
                            </div>
                        ) : isInProgress ? (
                            /* In-progress: show commit panel trigger */
                            !showCommitPanel ? (
                                <button
                                    onClick={() => setShowCommitPanel(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-300 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-green-600 hover:border-green-500 transition-all"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Write completion commit &amp; mark done
                                </button>
                            ) : (
                                <div className="space-y-3 p-4 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-950">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em]">
                                        Summarise what was accomplished. This marks the directive as completed.
                                    </p>
                                    <textarea
                                        autoFocus
                                        value={commitNote}
                                        onChange={e => setCommitNote(e.target.value)}
                                        placeholder="What was accomplished? Final outcome notes..."
                                        rows={3}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 px-3 py-2.5 text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 font-medium resize-none focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setShowCommitPanel(false); setCommitNote(''); }}
                                            className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-black dark:hover:text-white border border-zinc-300 dark:border-zinc-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCommitCompletion}
                                            disabled={isCommitting || !commitNote.trim()}
                                            className="flex-1 py-2 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isCommitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                            Commit &amp; Complete
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            /* Pending / Archived: placeholder */
                            <p className="text-[10px] italic text-zinc-400 dark:text-zinc-600">
                                No completion commit yet.
                            </p>
                        )}
                    </div>

                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
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
