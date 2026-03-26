'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Code, Quote } from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert focus:outline-none max-w-none text-black dark:text-white font-mono min-h-[120px] w-full bg-zinc-50 dark:bg-black px-4 py-3 text-xs tracking-wider border-b border-x border-zinc-300 dark:border-zinc-800 transition-colors',
            },
        },
    });

    // Sync external value changes (like when loading initial data)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return <div className="min-h-[120px] w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 animate-pulse transition-colors"></div>;
    }

    return (
        <div className="rich-text-container w-full">
            {/* Toolbar */}
            <div className="flex flex-wrap border-t border-x border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 px-2 py-1.5 gap-1 items-center transition-colors">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    icon={<Bold className="w-3.5 h-3.5" />}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    icon={<Italic className="w-3.5 h-3.5" />}
                />
                <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-800 mx-1 transition-colors" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    icon={<List className="w-3.5 h-3.5" />}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    icon={<ListOrdered className="w-3.5 h-3.5" />}
                />
                <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-800 mx-1 transition-colors" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    icon={<Quote className="w-3.5 h-3.5" />}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive('codeBlock')}
                    icon={<Code className="w-3.5 h-3.5" />}
                />
            </div>

            {/* Editor Input Area */}
            <div className="relative">
                {editor.isEmpty && placeholder && (
                    <div className="absolute top-3 left-4 text-xs font-mono tracking-wider text-zinc-400 dark:text-zinc-700 pointer-events-none transition-colors">
                        {placeholder}
                    </div>
                )}
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

function ToolbarButton({ onClick, isActive, icon }: { onClick: () => void, isActive: boolean, icon: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-1.5 transition-colors ${isActive ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
        >
            {icon}
        </button>
    );
}
