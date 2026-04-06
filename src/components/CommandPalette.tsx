'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { showToast } from '@/components/ToastContainer';
import {
    Search, FileText, BookOpen, PenTool, Sun, Moon,
    AlignCenter, Maximize2, Map, Camera, MessageSquare,
    Menu, Plus, Download, Trash2, ArrowLeft, Eye,
    Sparkles, Type, Keyboard,
} from 'lucide-react';

interface Command {
    id: string;
    label: string;
    category: string;
    icon: React.ReactNode;
    shortcut?: string;
    action: () => void;
}

interface CommandPaletteProps {
    onClose: () => void;
}

export default function CommandPalette({ onClose }: CommandPaletteProps) {
    const { state, dispatch, actions } = useApp();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const commands: Command[] = useMemo(() => {
        const cmds: Command[] = [
            // Navigation
            {
                id: 'back-dashboard',
                label: 'Go to Dashboard',
                category: 'Navigation',
                icon: <ArrowLeft size={16} />,
                action: () => {
                    dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
                    dispatch({ type: 'SET_CURRENT_PROJECT', payload: null });
                    onClose();
                },
            },
            // View toggles
            {
                id: 'toggle-sidebar',
                label: 'Toggle Sidebar',
                category: 'View',
                icon: <Menu size={16} />,
                shortcut: 'Ctrl+B',
                action: () => { dispatch({ type: 'TOGGLE_SIDEBAR' }); onClose(); },
            },
            {
                id: 'toggle-sidecar',
                label: 'Toggle The Architect',
                category: 'View',
                icon: <MessageSquare size={16} />,
                shortcut: 'Ctrl+J',
                action: () => { dispatch({ type: 'TOGGLE_SIDECAR' }); onClose(); },
            },
            {
                id: 'toggle-map',
                label: 'Toggle Document Map',
                category: 'View',
                icon: <Map size={16} />,
                shortcut: 'Ctrl+M',
                action: () => { dispatch({ type: 'TOGGLE_MAP' }); onClose(); },
            },
            {
                id: 'toggle-typewriter',
                label: `${state.typewriterMode ? 'Disable' : 'Enable'} Typewriter Mode`,
                category: 'View',
                icon: <AlignCenter size={16} />,
                action: () => { dispatch({ type: 'TOGGLE_TYPEWRITER' }); onClose(); },
            },
            {
                id: 'toggle-focus',
                label: `${state.focusMode ? 'Disable' : 'Enable'} Focus Mode`,
                category: 'View',
                icon: <Maximize2 size={16} />,
                action: () => { dispatch({ type: 'TOGGLE_FOCUS' }); onClose(); },
            },
            // Theme
            {
                id: 'theme-toggle',
                label: `Switch to ${state.themeVariant === 'dark' ? 'Parchment (Light)' : 'Obsidian (Dark)'} Theme`,
                category: 'Theme',
                icon: state.themeVariant === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
                action: () => {
                    dispatch({ type: 'SET_THEME', payload: state.themeVariant === 'dark' ? 'light' : 'dark' });
                    onClose();
                },
            },
            // Writing Mode
            {
                id: 'mode-story',
                label: 'Switch to Story Mode',
                category: 'Writing Mode',
                icon: <BookOpen size={16} />,
                action: () => { actions.updateProjectMode('story'); onClose(); },
            },
            {
                id: 'mode-script',
                label: 'Switch to Script Mode',
                category: 'Writing Mode',
                icon: <FileText size={16} />,
                action: () => { actions.updateProjectMode('script'); onClose(); },
            },
            {
                id: 'mode-draft',
                label: 'Switch to Draft Mode',
                category: 'Writing Mode',
                icon: <PenTool size={16} />,
                action: () => { actions.updateProjectMode('draft'); onClose(); },
            },
        ];

        // Chapter-specific commands
        if (state.currentProject) {
            cmds.push({
                id: 'new-chapter',
                label: 'New Chapter',
                category: 'Chapters',
                icon: <Plus size={16} />,
                action: () => {
                    actions.createChapter(state.currentProject!.id);
                    showToast('Chapter created', 'success');
                    onClose();
                },
            });

            cmds.push({
                id: 'export-md',
                label: 'Export Project as Markdown',
                category: 'Export',
                icon: <Download size={16} />,
                action: async () => {
                    onClose();
                    try {
                        const a = document.createElement('a');
                        a.href = `/api/export?projectId=${state.currentProject!.id}&format=markdown`;
                        a.download = '';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        showToast('Exporting as Markdown...', 'success');
                    } catch {
                        showToast('Export failed', 'error');
                    }
                },
            });

            cmds.push({
                id: 'export-json',
                label: 'Export Project as JSON',
                category: 'Export',
                icon: <Download size={16} />,
                action: async () => {
                    onClose();
                    try {
                        const res = await fetch(`/api/export?projectId=${state.currentProject!.id}&format=json`);
                        const data = await res.json();
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${state.currentProject!.title.replace(/\s+/g, '-').toLowerCase()}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        showToast('Exported as JSON', 'success');
                    } catch {
                        showToast('Export failed', 'error');
                    }
                },
            });
        }

        // Snapshot
        if (state.currentChapter) {
            cmds.push({
                id: 'save-snapshot',
                label: 'Save Snapshot',
                category: 'Snapshots',
                icon: <Camera size={16} />,
                action: () => {
                    actions.createSnapshot(
                        state.currentChapter!.id,
                        state.currentChapter!.content,
                        `Snapshot — ${new Date().toLocaleString()}`
                    );
                    showToast('Snapshot saved', 'success');
                    onClose();
                },
            });
        }

        // Chapter navigation
        if (state.chapters.length > 0) {
            state.chapters.forEach((ch) => {
                cmds.push({
                    id: `go-chapter-${ch.id}`,
                    label: `Go to: ${ch.title}`,
                    category: 'Chapters',
                    icon: <FileText size={16} />,
                    action: () => {
                        dispatch({ type: 'SET_CURRENT_CHAPTER', payload: ch });
                        onClose();
                    },
                });
            });
        }

        return cmds;
    }, [state, dispatch, actions, onClose]);

    const filteredCommands = useMemo(() => {
        if (!query) return commands;
        const q = query.toLowerCase();
        return commands.filter(
            cmd => cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q)
        );
    }, [query, commands]);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Scroll selected item into view
    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const item = list.children[selectedIndex] as HTMLElement;
        if (item) {
            item.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                }
                break;
            case 'Escape':
                onClose();
                break;
        }
    };

    // Group by category
    const grouped = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {} as Record<string, Command[]>);

    let globalIndex = 0;

    return (
        <motion.div
            className="command-palette-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
        >
            <motion.div
                className="command-palette acrylic"
                initial={{ opacity: 0, scale: 0.96, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-64)',
                }}
            >
                <div className="command-palette-input">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Search size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a command..."
                            style={{ fontSize: '1rem', fontWeight: 400 }}
                        />
                    </div>
                </div>

                <div className="command-list" ref={listRef}>
                    {Object.entries(grouped).map(([category, cmds]) => (
                        <div key={category}>
                            <div style={{
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'var(--text-tertiary)',
                                padding: '8px 12px 4px',
                                fontWeight: 600,
                            }}>
                                {category}
                            </div>
                            {cmds.map((cmd) => {
                                const idx = globalIndex++;
                                return (
                                    <div
                                        key={cmd.id}
                                        className={`command-item ${idx === selectedIndex ? 'selected' : ''}`}
                                        onClick={cmd.action}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                    >
                                        <span style={{ color: 'var(--text-tertiary)' }}>{cmd.icon}</span>
                                        <span>{cmd.label}</span>
                                        {cmd.shortcut && (
                                            <span className="command-item-shortcut">
                                                <kbd>{cmd.shortcut}</kbd>
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {filteredCommands.length === 0 && (
                        <div style={{
                            padding: 32,
                            textAlign: 'center',
                            color: 'var(--text-tertiary)',
                            fontSize: '0.85rem',
                        }}>
                            No matching commands
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
