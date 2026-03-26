'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTask, updateTask } from '@/lib/actions/task.actions';
import { ChevronDown, Calendar, AlertCircle, Clock, Undo, Paperclip, X, FileText, Loader2, Building2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { upload } from '@imagekit/next';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
    ssr: false,
    loading: () => <div className="min-h-[120px] w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 animate-pulse transition-colors"></div>
});

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
    workspaceId: string;
    workspaces: any[];
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function TaskForm({ workspaceId, workspaces, initialData, onSuccess, onCancel }: TaskFormProps) {
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId === 'all' ? (workspaces[0]?._id?.toString() || '') : workspaceId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [attachments, setAttachments] = useState<any[]>(initialData?.attachments || []);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!initialData;

    const { register, handleSubmit, watch, control, formState: { errors } } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema) as any,
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            priority: initialData?.priority || 'medium',
            dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        }
    });


    const onSubmit = async (data: TaskFormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const payload: any = {
                title: data.title,
                priority: data.priority,
                workspaceId: selectedWorkspaceId,
                ...(data.description ? { description: data.description } : { description: '' }),
                ...(data.dueDate ? { dueDate: data.dueDate } : { dueDate: null }),
            };

            payload.attachments = attachments;

            if (isEditing) {
                await updateTask(initialData._id, payload);
            } else {
                await createTask(payload);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to save task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);
        try {
            const authRes = await fetch('/api/upload-auth');
            if (!authRes.ok) throw new Error("Authentication failure");
            const authData = await authRes.json();

            // Use the upload utility from @imagekit/next (proxied from @imagekit/javascript)
            const result: any = await upload({
                file,
                fileName: file.name,
                publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY as string,
                token: authData.token,
                signature: authData.signature,
                expire: authData.expire,
                useUniqueFileName: true,
                tags: ["task-attachment"]
            });

            setAttachments(prev => [...prev, {
                url: result.url,
                publicId: result.fileId,
                fileName: result.name,
                fileType: result.fileType,
                size: result.size,
                uploadedAt: new Date()
            }]);
        } catch (err: any) {
            console.error("Upload Error:", err);
            setError(err.message || "Failed to deploy asset");
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="bg-white dark:bg-[#050505] border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-2xl transition-colors">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-900 transition-colors">
                <h3 className="text-xs font-bold text-black dark:text-white tracking-[0.2em] uppercase transition-colors">Initialize Directive</h3>
                <button onClick={onCancel} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 border border-red-900/50 bg-red-950/20 text-red-500 text-xs font-mono uppercase tracking-widest flex items-center gap-3">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Title */}
                <div>
                    <input
                        {...register('title')}
                        placeholder="DIRECTIVE TITLE"
                        className="w-full bg-transparent border-0 border-b border-zinc-300 dark:border-zinc-800 px-4 py-3 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 text-lg sm:text-2xl font-black tracking-tighter uppercase focus:ring-0 focus:border-black dark:focus:border-zinc-500 transition-colors"
                    />
                    {errors.title && <p className="text-red-500 text-[10px] mt-2 font-mono uppercase">{errors.title.message}</p>}
                </div>

                {/* Description */}
                <div>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <RichTextEditor
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="Execution details..."
                            />
                        )}
                    />
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Priority */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2 flex-grow-0 shrink-0">
                            <AlertCircle className="w-3 h-3" /> Priority Level
                        </label>
                        <div className="relative">
                            <select {...register('priority')} className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 px-4 py-2.5 text-xs text-black dark:text-white font-bold tracking-widest uppercase focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 cursor-pointer transition-colors">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                    </div>


                    {/* Target Workspace (Only if workspaceId was 'all') */}
                    {workspaceId === 'all' && !isEditing && (
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-3 h-3" /> Target Sector
                            </label>
                            <div className="relative">
                                <select 
                                    value={selectedWorkspaceId}
                                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                                    className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 px-4 py-2.5 text-xs text-black dark:text-white font-bold tracking-widest uppercase focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 cursor-pointer transition-colors"
                                >
                                    {workspaces.map(ws => (
                                        <option key={ws._id} value={ws._id}>{ws.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {/* Due Date */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Deadline
                        </label>
                        <input
                            type="date"
                            {...register('dueDate')}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 px-4 py-2 text-xs text-black dark:text-white font-mono uppercase focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                        />
                    </div>

                </div>


                {/* Attachments Section */}
                <div className="space-y-4">
                    <label className="text-[10px] text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Paperclip className="w-3 h-3" /> Intel Attachments
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Manual Upload Trigger */}
                        <div className="relative group/upload">
                            <input
                                type="file"
                                className="hidden"
                                id="file-upload"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="file-upload"
                                className={`flex flex-col items-center justify-center border-2 border-dashed p-8 transition-all cursor-pointer group ${isUploading
                                    ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-wait'
                                    : 'border-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-black dark:hover:border-white'
                                    }`}
                            >
                                {isUploading ? (
                                    <Loader2 className="w-8 h-8 text-black dark:text-white animate-spin" />
                                ) : (
                                    <Paperclip className="w-8 h-8 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest mt-2 text-zinc-500 group-hover:text-black dark:group-hover:text-white">
                                    {isUploading ? "Uploading..." : "Deploy Asset"}
                                </span>
                            </label>
                        </div>

                        {/* File Previews */}
                        <div className="space-y-2">
                            {attachments.length === 0 && !isUploading && (
                                <div className="h-full flex items-center justify-center border border-zinc-200 dark:border-zinc-900 p-4">
                                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest italic">No assets attached</span>
                                </div>
                            )}
                            {attachments.map((file, idx) => (
                                <div key={file.publicId || idx} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors group">
                                    <div className="w-10 h-10 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                                        {file.fileType === 'image' ? (
                                            <img src={file.url} alt={file.fileName} className="w-full h-full object-cover" />
                                        ) : (
                                            <FileText className="w-5 h-5 text-zinc-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-black dark:text-white uppercase truncate tracking-wider">{file.fileName}</p>
                                        <p className="text-[9px] font-mono text-zinc-500 uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                        className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-900 flex items-center justify-end gap-4 mt-8 transition-colors">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                    >
                        Abort
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-black text-white dark:bg-white dark:text-black px-8 py-3 text-xs font-bold tracking-widest uppercase transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-3 h-3 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></span>
                                Processing
                            </>
                        ) : (
                            'Commit Directive'
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
