'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import { type WritingMode } from '@/lib/themes';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3, Quote, List, ListOrdered,
    Minus, Highlighter, Undo, Redo,
} from 'lucide-react';

interface HeadingItem {
    level: number;
    text: string;
    id: string;
}

interface AetherEditorProps {
    onHeadingsChange?: (headings: HeadingItem[]) => void;
}

export default function AetherEditor({ onHeadingsChange }: AetherEditorProps) {
    const { state, actions } = useApp();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const moodTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [activeNodePos, setActiveNodePos] = useState<number | null>(null);
    const [showToolbar, setShowToolbar] = useState(false);
    const toolbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const chapter = state.currentChapter;
    const mode = (state.currentProject?.mode || 'story') as WritingMode;

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: false,
            }),
            Heading.configure({
                levels: [1, 2, 3],
            }),
            Placeholder.configure({
                placeholder: mode === 'script'
                    ? 'INT. LOCATION — DAY'
                    : mode === 'draft'
                        ? 'Start writing your draft...'
                        : 'Begin your story...',
            }),
            Typography,
            Underline,
            Highlight.configure({
                multicolor: true,
            }),
            TextStyle,
        ],
        content: chapter?.content || '',
        editorProps: {
            attributes: {
                class: `tiptap editor-${mode}`,
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const text = editor.getText();

            // Update headings for document map
            if (onHeadingsChange) {
                const headings: HeadingItem[] = [];
                editor.state.doc.descendants((node, pos) => {
                    if (node.type.name === 'heading') {
                        headings.push({
                            level: node.attrs.level,
                            text: node.textContent,
                            id: `heading-${pos}`,
                        });
                    }
                });
                onHeadingsChange(headings);
            }

            // Auto-save with debounce
            if (chapter) {
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = setTimeout(() => {
                    actions.saveChapter(chapter.id, html);
                }, 1000);
            }

            // Mood analysis with longer debounce
            if (state.apiKey && text.length > 200) {
                if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current);
                moodTimeoutRef.current = setTimeout(() => {
                    const words = text.split(/\s+/);
                    const last500 = words.slice(-500).join(' ');
                    actions.analyzeMood(last500);
                }, 15000);
            }
        },
        onSelectionUpdate: ({ editor }) => {
            // Track active node for typewriter mode
            const { from } = editor.state.selection;
            const editorEl = editor.view.dom;
            const children = editorEl.children;
            let activeIdx = -1;

            let nodeStart = 0;
            editor.state.doc.forEach((node, offset, idx) => {
                if (from >= offset && from <= offset + node.nodeSize) {
                    activeIdx = idx;
                }
            });

            setActiveNodePos(activeIdx);

            // Apply active node class for typewriter mode
            for (let i = 0; i < children.length; i++) {
                children[i].classList.toggle('is-active-node', i === activeIdx);
            }

            // Scroll active line to center in typewriter mode
            if (state.typewriterMode && activeIdx >= 0 && children[activeIdx]) {
                const activeEl = children[activeIdx] as HTMLElement;
                const container = editorEl.closest('.editor-container');
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const elRect = activeEl.getBoundingClientRect();
                    const scrollCenter = elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2;
                    container.scrollBy({ top: scrollCenter, behavior: 'smooth' });
                }
            }
        },
    });

    // Update content when chapter changes
    useEffect(() => {
        if (editor && chapter) {
            const currentContent = editor.getHTML();
            if (currentContent !== chapter.content && chapter.content) {
                editor.commands.setContent(chapter.content, { emitUpdate: false });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chapter?.id]);

    // Update editor mode class when mode changes
    useEffect(() => {
        if (editor) {
            editor.setOptions({
                editorProps: {
                    attributes: {
                        class: `tiptap editor-${mode}`,
                    },
                },
            });
        }
    }, [mode, editor]);

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current);
        };
    }, []);

    if (!editor) return null;

    const editorClassNames = [
        state.typewriterMode ? 'typewriter-mode' : '',
        state.focusMode ? 'focus-mode' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={editorClassNames} style={{ width: '100%' }}>
            {/* Floating Format Toolbar */}
            <div
                className="format-toolbar"
                onMouseEnter={() => {
                    setShowToolbar(true);
                    if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
                }}
                onMouseLeave={() => {
                    toolbarTimeoutRef.current = setTimeout(() => setShowToolbar(false), 2000);
                }}
                style={{ opacity: showToolbar ? 1 : 0 }}
            >
                <div className="format-toolbar-inner">
                    <button
                        className={`fmt-btn ${editor.isActive('bold') ? 'active' : ''}`}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        title="Bold"
                    >
                        <Bold size={15} />
                    </button>
                    <button
                        className={`fmt-btn ${editor.isActive('italic') ? 'active' : ''}`}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        title="Italic"
                    >
                        <Italic size={15} />
                    </button>
                    <button
                        className={`fmt-btn ${editor.isActive('underline') ? 'active' : ''}`}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        title="Underline"
                    >
                        <UnderlineIcon size={15} />
                    </button>
                    <button
                        className={`fmt-btn ${editor.isActive('strike') ? 'active' : ''}`}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        title="Strikethrough"
                    >
                        <Strikethrough size={15} />
                    </button>
                    <button
                        className={`fmt-btn ${editor.isActive('highlight') ? 'active' : ''}`}
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        title="Highlight"
                    >
                        <Highlighter size={15} />
                    </button>

                    <div className="fmt-sep" />

                    <button
                        className={`fmt-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        title="Heading 1"
                    >
                        <Heading1 size={15} />
                    </button>
                    <button
                        className={`fmt-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        title="Heading 2"
                    >
                        <Heading2 size={15} />
                    </button>
                    <button
                        className={`fmt-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        title="Heading 3"
                    >
                        <Heading3 size={15} />
                    </button>

                    <div className="fmt-sep" />

                    <button
                        className={`fmt-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        title="Bullet List"
                    >
                        <List size={15} />
                    </button>
                    <button
                        className={`fmt-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        title="Ordered List"
                    >
                        <ListOrdered size={15} />
                    </button>
                    <button
                        className={`fmt-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        title="Blockquote"
                    >
                        <Quote size={15} />
                    </button>
                    <button
                        className="fmt-btn"
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Rule"
                    >
                        <Minus size={15} />
                    </button>

                    <div className="fmt-sep" />

                    <button
                        className="fmt-btn"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo"
                    >
                        <Undo size={15} />
                    </button>
                    <button
                        className="fmt-btn"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo"
                    >
                        <Redo size={15} />
                    </button>
                </div>
            </div>

            <div
                className={`editor-scroll ${mode === 'script' ? 'script-mode' : ''}`}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
