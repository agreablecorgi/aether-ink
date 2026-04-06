'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, type Project } from '@/lib/store';
import { type WritingMode } from '@/lib/themes';
import {
    Plus, Settings, Sun, Moon, BookOpen, FileText, PenTool,
    Trash2, Clock, Type, Search, Sparkles, GraduationCap
} from 'lucide-react';

const modeIcons: Record<WritingMode, React.ReactNode> = {
    story: <BookOpen size={24} />,
    script: <FileText size={24} />,
    draft: <PenTool size={24} />,
};

const modeDescriptions: Record<WritingMode, string> = {
    story: 'Serif fonts, wide spacing',
    script: 'Monospace, screenplay format',
    draft: 'Clean sans-serif, compact',
};

export default function Dashboard({ onTeacherMode }: { onTeacherMode?: () => void }) {
    const { state, dispatch, actions } = useApp();
    const [showNewProject, setShowNewProject] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newMode, setNewMode] = useState<WritingMode>('story');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        actions.fetchProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateProject = async () => {
        if (!newTitle.trim()) return;
        const project = await actions.createProject(newTitle.trim(), newMode);
        setNewTitle('');
        setNewMode('story');
        setShowNewProject(false);
        if (project) {
            actions.openProject(project);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this project? This cannot be undone.')) {
            await actions.deleteProject(id);
        }
    };

    const filteredProjects = state.projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <motion.header
                className="dashboard-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="logo">
                    <div className="logo-icon">
                        <Sparkles size={16} color="white" />
                    </div>
                    <span>Aether</span> Ink
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-tertiary)',
                            }}
                        />
                        <input
                            className="input"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: 36, width: 240 }}
                        />
                    </div>

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
                        {state.themeVariant === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <button
                        className="btn-icon"
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'settings' })}
                        title="Settings"
                    >
                        <Settings size={18} />
                    </button>

                    <button
                        className="btn btn-surface"
                        onClick={onTeacherMode}
                        title="Teacher Mode — Learn creative writing"
                        style={{ gap: 6 }}
                    >
                        <GraduationCap size={16} /> Learn
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={() => setShowNewProject(true)}
                    >
                        <Plus size={16} /> New Project
                    </button>
                </div>
            </motion.header>

            {/* Projects Grid */}
            <motion.div
                className="dashboard-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                {filteredProjects.length === 0 && !state.loading ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            textAlign: 'center',
                            padding: '120px 0',
                            color: 'var(--text-tertiary)',
                        }}
                    >
                        <Sparkles size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 400, marginBottom: 8 }}>
                            {searchQuery ? 'No matching projects' : 'Your writing journey begins here'}
                        </h2>
                        <p style={{ fontSize: '0.875rem', marginBottom: 24 }}>
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Create your first project to start writing'}
                        </p>
                        {!searchQuery && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowNewProject(true)}
                            >
                                <Plus size={16} /> Create Project
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className="project-grid stagger">
                        <AnimatePresence>
                            {filteredProjects.map((project, i) => (
                                <motion.div
                                    key={project.id}
                                    className="project-card glow-border"
                                    onClick={() => actions.openProject(project)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    whileHover={{ y: -4 }}
                                    layout
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div className="project-card-mode">
                                            {modeIcons[project.mode as WritingMode]}
                                            <span>{project.mode}</span>
                                        </div>
                                        <button
                                            className="btn-icon"
                                            onClick={(e) => handleDeleteProject(e, project.id)}
                                            style={{ opacity: 0.3 }}
                                            onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
                                            onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.3'; }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <h3 className="project-card-title" style={{ marginTop: 16 }}>
                                        {project.title}
                                    </h3>

                                    {project.description && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                            {project.description}
                                        </p>
                                    )}

                                    <div className="project-card-meta">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={12} />
                                            {formatDate(project.updatedAt)}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* New Project Modal */}
            <AnimatePresence>
                {showNewProject && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowNewProject(false)}
                    >
                        <motion.div
                            className="modal"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="modal-title">New Project</h2>

                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    className="input"
                                    placeholder="Enter a title for your project..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateProject();
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Writing Mode</label>
                                <div className="mode-selector">
                                    {(['story', 'script', 'draft'] as WritingMode[]).map((mode) => (
                                        <div
                                            key={mode}
                                            className={`mode-option ${newMode === mode ? 'selected' : ''}`}
                                            onClick={() => setNewMode(mode)}
                                        >
                                            <div className="mode-option-icon">{modeIcons[mode]}</div>
                                            <div className="mode-option-label" style={{ textTransform: 'capitalize' }}>
                                                {mode}
                                            </div>
                                            <div className="mode-option-desc">{modeDescriptions[mode]}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button className="btn btn-ghost" onClick={() => setShowNewProject(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateProject}
                                    disabled={!newTitle.trim()}
                                >
                                    Create Project
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
