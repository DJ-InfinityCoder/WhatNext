'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, AlertCircle, Clock, PlayCircle, CheckCircle2, Archive, Command } from 'lucide-react';
import { searchTasksGlobal } from '@/lib/actions/task.actions';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Keyboard shortcut to open (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (!isOpen) {
                    // The parent manages open state, so this is handled there
                }
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Debounced search
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            setSelectedIndex(0);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const data = await searchTasksGlobal(query.trim());
                setResults(data);
                setSelectedIndex(0);
            } catch (err) {
                console.error(err);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            navigateToTask(results[selectedIndex]);
        }
    }, [results, selectedIndex]);

    // Scroll selected item into view
    useEffect(() => {
        const container = resultsRef.current;
        if (!container) return;
        const selected = container.children[selectedIndex] as HTMLElement;
        if (selected) {
            selected.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const navigateToTask = (task: any) => {
        const wsId = task.workspaceId?._id || task.workspaceId;
        const statusView = task.status === 'completed' ? 'completed' 
                         : task.status === 'archived' ? 'archived' 
                         : 'active';
        router.push(`/console?ws=${wsId}&view=${statusView}`);
        onClose();
    };

    const stripHtml = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    };

    const truncateText = (text: string, maxLength: number) => {
        if (!text) return '';
        const stripped = stripHtml(text);
        if (stripped.length <= maxLength) return stripped;
        return stripped.substring(0, maxLength).trim() + '…';
    };

    const priorityColors: Record<string, string> = {
        low: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-900',
        medium: 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900',
        high: 'text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
        urgent: 'text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20'
    };

    const statusIcons: Record<string, React.ReactNode> = {
        'pending': <Clock className="w-3.5 h-3.5 text-zinc-400" />,
        'in-progress': <PlayCircle className="w-3.5 h-3.5 text-blue-500" />,
        'completed': <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
        'archived': <Archive className="w-3.5 h-3.5 text-zinc-400" />
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95 slide-in-from-top-2 duration-200 flex flex-col max-h-[60vh]">
                
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <Search className={`w-4 h-4 shrink-0 ${isSearching ? 'text-zinc-400 animate-pulse' : 'text-zinc-500'}`} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search across all directives..."
                        className="flex-1 bg-transparent text-sm text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 font-medium focus:outline-none"
                        autoComplete="off"
                        spellCheck={false}
                    />
                    {query && (
                        <button 
                            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                            className="p-1 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 uppercase">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div ref={resultsRef} className="overflow-y-auto flex-1 custom-scrollbar">
                    {query.trim().length < 2 ? (
                        <div className="px-5 py-12 text-center">
                            <div className="flex justify-center mb-3">
                                <div className="w-10 h-10 border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                                    <Search className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                                Type at least 2 characters to search
                            </p>
                            <p className="text-[9px] text-zinc-400 dark:text-zinc-700 mt-2 uppercase tracking-wider">
                                Search across all workspaces and directives
                            </p>
                        </div>
                    ) : isSearching ? (
                        <div className="px-5 py-12 text-center">
                            <div className="flex justify-center mb-3">
                                <span className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-700 border-t-black dark:border-t-white rounded-full animate-spin" />
                            </div>
                            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                                Scanning directives...
                            </p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <div className="flex justify-center mb-3">
                                <div className="w-10 h-10 border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                                No directives match &ldquo;{query}&rdquo;
                            </p>
                        </div>
                    ) : (
                        <div className="py-2">
                            <div className="px-5 py-2">
                                <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">
                                    {results.length} result{results.length > 1 ? 's' : ''} found
                                </span>
                            </div>
                            {results.map((task, idx) => (
                                <button
                                    key={task._id}
                                    onClick={() => navigateToTask(task)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={`w-full text-left px-5 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
                                        idx === selectedIndex 
                                            ? 'bg-zinc-100 dark:bg-zinc-900' 
                                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-950'
                                    }`}
                                >
                                    {/* Status Icon */}
                                    <div className="mt-0.5 shrink-0">
                                        {statusIcons[task.status] || <Clock className="w-3.5 h-3.5 text-zinc-400" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-xs font-black uppercase tracking-tight text-black dark:text-white truncate">
                                                {task.title}
                                            </h4>
                                        </div>
                                        
                                        {task.description && (
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 leading-relaxed line-clamp-1 mb-1.5">
                                                {truncateText(task.description, 100)}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2">
                                            {task.workspaceId?.name && (
                                                <span className="text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                                    {task.workspaceId.name}
                                                </span>
                                            )}
                                            <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 ${priorityColors[task.priority] || ''}`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Arrow indicator for selected */}
                                    {idx === selectedIndex && (
                                        <div className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-500">
                                            <span className="text-[9px] font-bold">↵</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="px-5 py-2.5 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[9px] text-zinc-400 dark:text-zinc-600">
                            <kbd className="px-1 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-[8px]">↑↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-zinc-400 dark:text-zinc-600">
                            <kbd className="px-1 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-[8px]">↵</kbd>
                            Open
                        </span>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] text-zinc-400 dark:text-zinc-600">
                        <kbd className="px-1 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-[8px]">ESC</kbd>
                        Close
                    </span>
                </div>
            </div>
        </div>
    );
}
