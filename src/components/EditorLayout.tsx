'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/store';
import { MOOD_THEMES, type WritingMode, type Mood } from '@/lib/themes';
import AetherEditor from './AetherEditor';
import CommandPalette from './CommandPalette';
import { showToast } from './ToastContainer';
import {
    ChevronLeft, ChevronRight, Plus, Trash2, Menu, X,
    BookOpen, FileText, PenTool, Eye, EyeOff, Map, Save,
    Camera, MessageSquare, Sun, Moon, Sparkles, Type,
    AlignCenter, Maximize2, Minimize2, MoreHorizontal, Download,
} from 'lucide-react';

interface HeadingItem {
    level: number;
    text: string;
    id: string;
}

const sidebarVariants = {
    open: { width: 280, opacity: 1 },
    closed: { width: 0, opacity: 0 },
};

const sidecarVariants = {
    open: { width: 360, opacity: 1 },
    closed: { width: 0, opacity: 0 },
};

export default function EditorLayout() {
    const { state, dispatch, actions } = useApp();
    const [headings, setHeadings] = useState<HeadingItem[]>([]);
    const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [toolbarVisible, setToolbarVisible] = useState(false);
    const [renamingChapter, setRenamingChapter] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const toolbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const mode = (state.currentProject?.mode || 'story') as WritingMode;
    const moodTheme = MOOD_THEMES[state.mood as Mood] || MOOD_THEMES.neutral;

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                dispatch({ type: 'TOGGLE_COMMAND_PALETTE' });
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                e.preventDefault();
                dispatch({ type: 'TOGGLE_SIDEBAR' });
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                dispatch({ type: 'TOGGLE_SIDECAR' });
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
                e.preventDefault();
                dispatch({ type: 'TOGGLE_MAP' });
            }
            if (e.key === 'Escape') {
                if (state.commandPaletteOpen) dispatch({ type: 'TOGGLE_COMMAND_PALETTE' });
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [dispatch, state.commandPaletteOpen]);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleToolbarHover = () => {
        setToolbarVisible(true);
        if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
    };

    const handleToolbarLeave = () => {
        toolbarTimeoutRef.current = setTimeout(() => setToolbarVisible(false), 2000);
    };

    const handleSendChat = async () => {
        if (!chatInput.trim() || chatLoading) return;
        const userMsg = { role: 'user', content: chatInput };

        // Include current chapter context
        const contextMsg = state.currentChapter?.content
            ? `[Current chapter context - "${state.currentChapter.title}"]:\n${state.currentChapter.content.replace(/<[^>]*>/g, '').slice(0, 2000)}\n\n---\n\n`
            : '';

        const messagesWithContext = chatMessages.length === 0 && contextMsg
            ? [{ role: 'user', content: contextMsg + chatInput }]
            : [...chatMessages, userMsg];

        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setChatLoading(true);

        try {
            const result = await actions.callLLM('chat', undefined, messagesWithContext);
            const assistantMsg = { role: 'assistant', content: result };
            setChatMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ Failed to get response. Check your API key in Settings.',
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleCreateSnapshot = () => {
        if (!state.currentChapter) return;
        actions.createSnapshot(
            state.currentChapter.id,
            state.currentChapter.content,
            `Before edit — ${new Date().toLocaleString()}`
        );
        showToast('Snapshot saved', 'success');
    };

    const handleExport = () => {
        if (!state.currentProject) return;
        const a = document.createElement('a');
        a.href = `/api/export?projectId=${state.currentProject.id}&format=markdown`;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Exporting project...', 'info');
    };

    const handleRenameChapter = (chapterId: string, newTitle: string) => {
        if (newTitle.trim()) {
            actions.saveChapter(chapterId, state.chapters.find(c => c.id === chapterId)?.content || '', newTitle.trim());
        }
        setRenamingChapter(null);
    };

    const wordCount = state.currentChapter?.wordCount || 0;
    const totalWords = state.chapters.reduce((acc, ch) => acc + (ch.wordCount || 0), 0);

    return (
        <div className="editor-layout">
            {/* Sidebar */}
            <AnimatePresence>
                {state.sidebarOpen && (
                    <motion.div
                        className="sidebar"
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={sidebarVariants}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="sidebar-header">
                            <div className="sidebar-title">Chapters</div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                    className="btn-icon"
                                    onClick={() => state.currentProject && actions.createChapter(state.currentProject.id)}
                                    title="New chapter"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    className="btn-icon"
                                    onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
                                    title="Close sidebar"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="chapter-list stagger">
                            {state.chapters.map((chapter, i) => (
                                <motion.div
                                    key={chapter.id}
                                    className={`chapter-item ${state.currentChapter?.id === chapter.id ? 'active' : ''}`}
                                    onClick={() => dispatch({ type: 'SET_CURRENT_CHAPTER', payload: chapter })}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.3 }}
                                    onDoubleClick={() => {
                                        setRenamingChapter(chapter.id);
                                        setRenameValue(chapter.title);
                                    }}
                                >
                                    <FileText size={14} style={{ flexShrink: 0 }} />
                                    {renamingChapter === chapter.id ? (
                                        <input
                                            className="input"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onBlur={() => handleRenameChapter(chapter.id, renameValue)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameChapter(chapter.id, renameValue);
                                                if (e.key === 'Escape') setRenamingChapter(null);
                                            }}
                                            autoFocus
                                            style={{ padding: '2px 6px', fontSize: '0.85rem' }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {chapter.title}
                                        </span>
                                    )}
                                    <span className="chapter-item-count">{chapter.wordCount || 0}w</span>
                                    {state.chapters.length > 1 && (
                                        <button
                                            className="btn-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete "${chapter.title}"?`)) {
                                                    actions.deleteChapter(chapter.id, chapter.projectId);
                                                }
                                            }}
                                            style={{ opacity: 0.3, padding: 2 }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Project info at bottom */}
                        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                                TOTAL: {totalWords.toLocaleString()} words
                            </div>
                            <div className="mood-indicator">
                                <span className="mood-dot" />
                                {moodTheme.name}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Editor */}
            <div className="editor-main">
                {/* Adaptive Chrome Toolbar */}
                <div
                    className={`editor-toolbar ${toolbarVisible ? 'visible' : ''}`}
                    onMouseEnter={handleToolbarHover}
                    onMouseLeave={handleToolbarLeave}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                            className="btn-icon"
                            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
                            title="Toggle sidebar (Ctrl+B)"
                        >
                            <Menu size={18} />
                        </button>

                        <button
                            className="btn-icon"
                            onClick={() => {
                                dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
                                dispatch({ type: 'SET_CURRENT_PROJECT', payload: null });
                            }}
                            title="Back to dashboard"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <span style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            marginLeft: 8,
                        }}>
                            {state.currentProject?.title}
                            {state.currentChapter && (
                                <span style={{ color: 'var(--text-tertiary)' }}> / {state.currentChapter.title}</span>
                            )}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {/* Mode switcher */}
                        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
                            {(['story', 'script', 'draft'] as WritingMode[]).map((m) => (
                                <button
                                    key={m}
                                    className={`btn-icon ${mode === m ? '' : ''}`}
                                    onClick={() => actions.updateProjectMode(m)}
                                    title={`${m} mode`}
                                    style={{
                                        background: mode === m ? 'var(--bg-surface)' : 'transparent',
                                        color: mode === m ? 'var(--accent)' : 'var(--text-tertiary)',
                                        borderRadius: 4,
                                        padding: '4px 8px',
                                        fontSize: '0.7rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        fontWeight: mode === m ? 600 : 400,
                                    }}
                                >
                                    {m === 'story' ? <BookOpen size={14} /> : m === 'script' ? <FileText size={14} /> : <PenTool size={14} />}
                                </button>
                            ))}
                        </div>

                        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 4px' }} />

                        <button
                            className="btn-icon"
                            onClick={() => dispatch({ type: 'TOGGLE_TYPEWRITER' })}
                            title="Typewriter mode"
                            style={{ color: state.typewriterMode ? 'var(--accent)' : 'var(--text-tertiary)' }}
                        >
                            <AlignCenter size={16} />
                        </button>

                        <button
                            className="btn-icon"
                            onClick={() => dispatch({ type: 'TOGGLE_FOCUS' })}
                            title="Focus mode"
                            style={{ color: state.focusMode ? 'var(--accent)' : 'var(--text-tertiary)' }}
                        >
                            {state.focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>

                        <button
                            className="btn-icon"
                            onClick={() => dispatch({ type: 'TOGGLE_MAP' })}
                            title="Document map (Ctrl+M)"
                            style={{ color: state.mapOpen ? 'var(--accent)' : 'var(--text-tertiary)' }}
                        >
                            <Map size={16} />
                        </button>

                        <button
                            className="btn-icon"
                            onClick={handleCreateSnapshot}
                            title="Save snapshot"
                        >
                            <Camera size={16} />
                        </button>

                        <button
                            className="btn-icon"
                            onClick={handleExport}
                            title="Export project"
                        >
                            <Download size={16} />
                        </button>

                        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 4px' }} />

                        <button
                            className="btn-icon"
                            onClick={() =>
                                dispatch({
                                    type: 'SET_THEME',
                                    payload: state.themeVariant === 'dark' ? 'light' : 'dark',
                                })
                            }
                            title="Toggle theme"
                        >
                            {state.themeVariant === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        <button
                            className="btn-icon"
                            onClick={() => dispatch({ type: 'TOGGLE_SIDECAR' })}
                            title="The Architect (Ctrl+J)"
                            style={{ color: state.sidecarOpen ? 'var(--accent)' : 'var(--text-tertiary)' }}
                        >
                            <MessageSquare size={16} />
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="editor-container">
                    <AetherEditor onHeadingsChange={setHeadings} />
                </div>

                {/* Word Count Bar (shows on hover) */}
                <div
                    className="word-count-bar"
                    onMouseEnter={() => setToolbarVisible(true)}
                >
                    <span>
                        {wordCount.toLocaleString()} words · {state.currentChapter?.title || 'No chapter'}
                    </span>
                    <div className="mood-indicator">
                        <span className="mood-dot" />
                        {moodTheme.name}
                    </div>
                </div>
            </div>

            {/* Document Map */}
            <AnimatePresence>
                {state.mapOpen && headings.length > 0 && !state.sidecarOpen && (
                    <motion.div
                        className="document-map"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.25 }}
                    >
                        {headings.map((h, i) => (
                            <div
                                key={i}
                                className={`map-item h${h.level}`}
                                onClick={() => {
                                    const el = document.querySelector(`[data-heading-id="${h.id}"]`);
                                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                            >
                                {h.text || 'Untitled'}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidecar (The Architect) */}
            <AnimatePresence>
                {state.sidecarOpen && (
                    <motion.div
                        className="sidecar"
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={sidecarVariants}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="sidecar-header">
                            <div className="sidecar-title">
                                <Sparkles size={14} />
                                The Architect
                            </div>
                            <button
                                className="btn-icon"
                                onClick={() => dispatch({ type: 'TOGGLE_SIDECAR' })}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="sidecar-content">
                            {chatMessages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}
                                >
                                    <Sparkles size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                                    <p style={{ fontSize: '0.85rem', marginBottom: 8 }}>
                                        Your narrative architect awaits
                                    </p>
                                    <p style={{ fontSize: '0.75rem' }}>
                                        Ask about plot, characters, atmosphere, or request editorial notes
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 20 }}>
                                        {[
                                            'Review my current chapter',
                                            'Suggest sensory details for this scene',
                                            'Check for plot holes',
                                        ].map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                className="btn btn-surface"
                                                style={{ fontSize: '0.75rem', textAlign: 'left', justifyContent: 'flex-start' }}
                                                onClick={() => {
                                                    setChatInput(suggestion);
                                                }}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {chatMessages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    className={`chat-message ${msg.role}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                >
                                    <div className="chat-message-role">
                                        {msg.role === 'user' ? 'You' : 'The Architect'}
                                    </div>
                                    <div
                                        style={{ whiteSpace: 'pre-wrap' }}
                                        dangerouslySetInnerHTML={{
                                            __html: msg.content
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                                .replace(/\n/g, '<br/>')
                                        }}
                                    />
                                </motion.div>
                            ))}

                            {chatLoading && (
                                <motion.div
                                    className="chat-message assistant"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="chat-message-role">The Architect</div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <span style={{ animation: 'pulse 1.5s ease infinite' }}>●</span>
                                        <span style={{ animation: 'pulse 1.5s ease 0.3s infinite' }}>●</span>
                                        <span style={{ animation: 'pulse 1.5s ease 0.6s infinite' }}>●</span>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        <div className="sidecar-input">
                            <textarea
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask the Architect..."
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendChat();
                                    }
                                }}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                                }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleSendChat}
                                disabled={chatLoading || !chatInput.trim()}
                                style={{ alignSelf: 'flex-end', padding: '10px 14px' }}
                            >
                                <Sparkles size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Command Palette */}
            <AnimatePresence>
                {state.commandPaletteOpen && (
                    <CommandPalette onClose={() => dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })} />
                )}
            </AnimatePresence>
        </div>
    );
}
