'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { type WritingMode, type Mood, type ThemeVariant, applyTheme } from '@/lib/themes';

// Types
export interface Project {
    id: string;
    title: string;
    description: string;
    mode: WritingMode;
    mood: Mood;
    createdAt: string;
    updatedAt: string;
}

export interface Chapter {
    id: string;
    projectId: string;
    title: string;
    content: string;
    order: number;
    wordCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Snapshot {
    id: string;
    chapterId: string;
    content: string;
    label: string;
    createdAt: string;
}

interface AppState {
    // Data
    projects: Project[];
    currentProject: Project | null;
    chapters: Chapter[];
    currentChapter: Chapter | null;
    snapshots: Snapshot[];

    // UI State
    view: 'dashboard' | 'editor' | 'teacher' | 'settings';
    themeVariant: ThemeVariant;
    mood: Mood;
    sidebarOpen: boolean;
    sidecarOpen: boolean;
    commandPaletteOpen: boolean;
    typewriterMode: boolean;
    focusMode: boolean;
    mapOpen: boolean;

    // Settings
    apiKey: string;
    model: string;

    // Loading
    loading: boolean;
}

type Action =
    | { type: 'SET_PROJECTS'; payload: Project[] }
    | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
    | { type: 'SET_CHAPTERS'; payload: Chapter[] }
    | { type: 'SET_CURRENT_CHAPTER'; payload: Chapter | null }
    | { type: 'SET_SNAPSHOTS'; payload: Snapshot[] }
    | { type: 'SET_VIEW'; payload: 'dashboard' | 'editor' | 'teacher' | 'settings' }
    | { type: 'SET_THEME'; payload: ThemeVariant }
    | { type: 'SET_MOOD'; payload: Mood }
    | { type: 'TOGGLE_SIDEBAR' }
    | { type: 'TOGGLE_SIDECAR' }
    | { type: 'TOGGLE_COMMAND_PALETTE' }
    | { type: 'TOGGLE_TYPEWRITER' }
    | { type: 'TOGGLE_FOCUS' }
    | { type: 'TOGGLE_MAP' }
    | { type: 'SET_API_KEY'; payload: string }
    | { type: 'SET_MODEL'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'UPDATE_CHAPTER_CONTENT'; payload: { id: string; content: string; wordCount: number } };

const initialState: AppState = {
    projects: [],
    currentProject: null,
    chapters: [],
    currentChapter: null,
    snapshots: [],
    view: 'dashboard',
    themeVariant: 'dark',
    mood: 'neutral',
    sidebarOpen: false,
    sidecarOpen: false,
    commandPaletteOpen: false,
    typewriterMode: false,
    focusMode: false,
    mapOpen: false,
    apiKey: '',
    model: 'google/gemini-2.0-flash-001',
    loading: false,
};

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_PROJECTS':
            return { ...state, projects: action.payload };
        case 'SET_CURRENT_PROJECT':
            return { ...state, currentProject: action.payload };
        case 'SET_CHAPTERS':
            return { ...state, chapters: action.payload };
        case 'SET_CURRENT_CHAPTER':
            return { ...state, currentChapter: action.payload };
        case 'SET_SNAPSHOTS':
            return { ...state, snapshots: action.payload };
        case 'SET_VIEW':
            return { ...state, view: action.payload };
        case 'SET_THEME':
            return { ...state, themeVariant: action.payload };
        case 'SET_MOOD':
            return { ...state, mood: action.payload };
        case 'TOGGLE_SIDEBAR':
            return { ...state, sidebarOpen: !state.sidebarOpen };
        case 'TOGGLE_SIDECAR':
            return { ...state, sidecarOpen: !state.sidecarOpen };
        case 'TOGGLE_COMMAND_PALETTE':
            return { ...state, commandPaletteOpen: !state.commandPaletteOpen };
        case 'TOGGLE_TYPEWRITER':
            return { ...state, typewriterMode: !state.typewriterMode };
        case 'TOGGLE_FOCUS':
            return { ...state, focusMode: !state.focusMode };
        case 'TOGGLE_MAP':
            return { ...state, mapOpen: !state.mapOpen };
        case 'SET_API_KEY':
            return { ...state, apiKey: action.payload };
        case 'SET_MODEL':
            return { ...state, model: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'UPDATE_CHAPTER_CONTENT': {
            const updatedChapters = state.chapters.map(ch =>
                ch.id === action.payload.id
                    ? { ...ch, content: action.payload.content, wordCount: action.payload.wordCount }
                    : ch
            );
            const updatedCurrent = state.currentChapter?.id === action.payload.id
                ? { ...state.currentChapter, content: action.payload.content, wordCount: action.payload.wordCount }
                : state.currentChapter;
            return { ...state, chapters: updatedChapters, currentChapter: updatedCurrent };
        }
        default:
            return state;
    }
}

const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    actions: ReturnType<typeof useActions>;
} | null>(null);

function useActions(dispatch: React.Dispatch<Action>, stateRef: { current: AppState }) {
    const fetchProjects = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            dispatch({ type: 'SET_PROJECTS', payload: data });
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [dispatch]);

    const createProject = useCallback(async (title: string, mode: WritingMode) => {
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, mode }),
            });
            const data = await res.json();
            await fetchProjects();
            return data;
        } catch (err) {
            console.error('Failed to create project:', err);
        }
    }, [fetchProjects]);

    const deleteProject = useCallback(async (id: string) => {
        try {
            await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
            await fetchProjects();
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    }, [fetchProjects]);

    const openProject = useCallback(async (project: Project) => {
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
        dispatch({ type: 'SET_MOOD', payload: (project.mood as Mood) || 'neutral' });

        try {
            const res = await fetch(`/api/chapters?projectId=${project.id}`);
            const chapters = await res.json();
            dispatch({ type: 'SET_CHAPTERS', payload: chapters });
            if (chapters.length > 0) {
                dispatch({ type: 'SET_CURRENT_CHAPTER', payload: chapters[0] });
            }
            dispatch({ type: 'SET_VIEW', payload: 'editor' });
        } catch (err) {
            console.error('Failed to load chapters:', err);
        }
    }, [dispatch]);

    const saveChapter = useCallback(async (id: string, content: string, title?: string) => {
        const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
        dispatch({ type: 'UPDATE_CHAPTER_CONTENT', payload: { id, content, wordCount } });

        try {
            await fetch('/api/chapters', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, content, ...(title ? { title } : {}) }),
            });
        } catch (err) {
            console.error('Failed to save chapter:', err);
        }
    }, [dispatch]);

    const createChapter = useCallback(async (projectId: string, title?: string) => {
        try {
            const res = await fetch('/api/chapters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, title }),
            });
            const chapter = await res.json();
            const chapRes = await fetch(`/api/chapters?projectId=${projectId}`);
            const chapters = await chapRes.json();
            dispatch({ type: 'SET_CHAPTERS', payload: chapters });
            dispatch({ type: 'SET_CURRENT_CHAPTER', payload: chapter });
            return chapter;
        } catch (err) {
            console.error('Failed to create chapter:', err);
        }
    }, [dispatch]);

    const deleteChapter = useCallback(async (id: string, projectId: string) => {
        try {
            await fetch(`/api/chapters?id=${id}`, { method: 'DELETE' });
            const res = await fetch(`/api/chapters?projectId=${projectId}`);
            const chapters = await res.json();
            dispatch({ type: 'SET_CHAPTERS', payload: chapters });
            if (chapters.length > 0) {
                dispatch({ type: 'SET_CURRENT_CHAPTER', payload: chapters[0] });
            } else {
                dispatch({ type: 'SET_CURRENT_CHAPTER', payload: null });
            }
        } catch (err) {
            console.error('Failed to delete chapter:', err);
        }
    }, [dispatch]);

    const createSnapshot = useCallback(async (chapterId: string, content: string, label?: string) => {
        try {
            const res = await fetch('/api/snapshots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapterId, content, label }),
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to create snapshot:', err);
        }
    }, []);

    const fetchSnapshots = useCallback(async (chapterId: string) => {
        try {
            const res = await fetch(`/api/snapshots?chapterId=${chapterId}`);
            const data = await res.json();
            dispatch({ type: 'SET_SNAPSHOTS', payload: data });
        } catch (err) {
            console.error('Failed to fetch snapshots:', err);
        }
    }, [dispatch]);

    const callLLM = useCallback(async (task: string, content?: string, messages?: Array<{ role: string; content: string }>) => {
        const state = stateRef.current;
        try {
            const res = await fetch('/api/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task,
                    content,
                    messages,
                    apiKey: state.apiKey,
                    model: state.model,
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            return data.result;
        } catch (err) {
            console.error('LLM error:', err);
            throw err;
        }
    }, [stateRef]);

    const analyzeMood = useCallback(async (content: string) => {
        try {
            const result = await callLLM('sentiment', content);
            const parsed = JSON.parse(result);
            if (parsed.mood) {
                dispatch({ type: 'SET_MOOD', payload: parsed.mood as Mood });
                // Update project mood in DB
                const state = stateRef.current;
                if (state.currentProject) {
                    await fetch('/api/projects/update', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: state.currentProject.id, mood: parsed.mood }),
                    });
                }
            }
            return parsed;
        } catch {
            // Silently fail mood analysis
        }
    }, [callLLM, dispatch, stateRef]);

    const updateProjectMode = useCallback(async (mode: WritingMode) => {
        const state = stateRef.current;
        if (!state.currentProject) return;

        dispatch({ type: 'SET_CURRENT_PROJECT', payload: { ...state.currentProject, mode } });
        try {
            await fetch('/api/projects/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: state.currentProject.id, mode }),
            });
        } catch (err) {
            console.error('Failed to update project mode:', err);
        }
    }, [dispatch, stateRef]);

    return {
        fetchProjects,
        createProject,
        deleteProject,
        openProject,
        saveChapter,
        createChapter,
        deleteChapter,
        createSnapshot,
        fetchSnapshots,
        callLLM,
        analyzeMood,
        updateProjectMode,
    };
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Keep a mutable ref for actions that need current state
    const stateRef = useRef(state);
    stateRef.current = state;

    const actions = useActions(dispatch, stateRef);

    // Apply theme whenever variant or mood changes
    useEffect(() => {
        applyTheme(state.themeVariant, state.mood);
    }, [state.themeVariant, state.mood]);

    // Initialize database on mount
    useEffect(() => {
        fetch('/api/init', { method: 'POST' })
            .then(() => console.log('✓ Database initialized'))
            .catch((err) => console.error('Database init failed:', err));
    }, []);

    // Track whether we've loaded settings yet
    const hydrated = useRef(false);

    // Helper to persist a setting to the DB
    const saveSetting = useCallback((key: string, value: string) => {
        fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value }),
        }).catch(() => { /* silent — localStorage is the fallback */ });
    }, []);

    // Load settings: localStorage first (instant), then DB (async, takes priority)
    useEffect(() => {
        // 1. Instant hydration from localStorage
        const savedKey = localStorage.getItem('aether-ink-api-key');
        const savedModel = localStorage.getItem('aether-ink-model');
        const savedTheme = localStorage.getItem('aether-ink-theme') as ThemeVariant;
        if (savedKey) dispatch({ type: 'SET_API_KEY', payload: savedKey });
        if (savedModel) dispatch({ type: 'SET_MODEL', payload: savedModel });
        if (savedTheme) dispatch({ type: 'SET_THEME', payload: savedTheme });

        // 2. Then load from DB (survives server resets)
        fetch('/api/settings')
            .then(res => res.json())
            .then((settings: Record<string, string>) => {
                if (settings['api-key']) {
                    dispatch({ type: 'SET_API_KEY', payload: settings['api-key'] });
                    localStorage.setItem('aether-ink-api-key', settings['api-key']);
                }
                if (settings['model']) {
                    dispatch({ type: 'SET_MODEL', payload: settings['model'] });
                    localStorage.setItem('aether-ink-model', settings['model']);
                }
                if (settings['theme']) {
                    dispatch({ type: 'SET_THEME', payload: settings['theme'] as ThemeVariant });
                    localStorage.setItem('aether-ink-theme', settings['theme']);
                }
            })
            .catch(() => { /* DB not ready yet — localStorage values are fine */ })
            .finally(() => {
                hydrated.current = true;
            });
    }, [dispatch]);

    // Save settings to both localStorage AND the DB (only after hydration)
    useEffect(() => {
        if (!hydrated.current) return;
        if (state.apiKey) {
            localStorage.setItem('aether-ink-api-key', state.apiKey);
            saveSetting('api-key', state.apiKey);
        } else {
            localStorage.removeItem('aether-ink-api-key');
            saveSetting('api-key', '');
        }
    }, [state.apiKey, saveSetting]);

    useEffect(() => {
        if (!hydrated.current) return;
        localStorage.setItem('aether-ink-model', state.model);
        saveSetting('model', state.model);
    }, [state.model, saveSetting]);

    useEffect(() => {
        if (!hydrated.current) return;
        localStorage.setItem('aether-ink-theme', state.themeVariant);
        saveSetting('theme', state.themeVariant);
    }, [state.themeVariant, saveSetting]);

    // Apply theme whenever themeVariant or mood changes
    useEffect(() => {
        applyTheme(state.themeVariant, state.mood);
    }, [state.themeVariant, state.mood]);

    return (
        <AppContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
