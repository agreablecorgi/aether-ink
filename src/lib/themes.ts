// Aether Ink Theme System
// "Obsidian & Parchment" with mood-adaptive accent colors

export type WritingMode = 'story' | 'script' | 'draft';
export type Mood = 'neutral' | 'adventure' | 'mystery' | 'romance' | 'horror' | 'comedy' | 'melancholy' | 'tension' | 'wonder' | 'fury';
export type ThemeVariant = 'dark' | 'light';

export interface MoodTheme {
    accent: string;
    accentMuted: string;
    accentGlow: string;
    bgTint: string;
    name: string;
}

export const MOOD_THEMES: Record<Mood, MoodTheme> = {
    neutral: {
        accent: 'hsl(220, 14%, 60%)',
        accentMuted: 'hsl(220, 14%, 40%)',
        accentGlow: 'hsla(220, 14%, 60%, 0.15)',
        bgTint: 'transparent',
        name: 'Still Waters',
    },
    adventure: {
        accent: 'hsl(32, 85%, 55%)',
        accentMuted: 'hsl(32, 70%, 40%)',
        accentGlow: 'hsla(32, 85%, 55%, 0.12)',
        bgTint: 'hsla(32, 50%, 50%, 0.03)',
        name: 'Ember Light',
    },
    mystery: {
        accent: 'hsl(260, 45%, 55%)',
        accentMuted: 'hsl(260, 35%, 40%)',
        accentGlow: 'hsla(260, 45%, 55%, 0.12)',
        bgTint: 'hsla(260, 30%, 40%, 0.04)',
        name: 'Violet Fog',
    },
    romance: {
        accent: 'hsl(340, 65%, 60%)',
        accentMuted: 'hsl(340, 50%, 45%)',
        accentGlow: 'hsla(340, 65%, 60%, 0.12)',
        bgTint: 'hsla(340, 40%, 50%, 0.03)',
        name: 'Rose Dusk',
    },
    horror: {
        accent: 'hsl(0, 60%, 45%)',
        accentMuted: 'hsl(0, 45%, 35%)',
        accentGlow: 'hsla(0, 60%, 45%, 0.15)',
        bgTint: 'hsla(0, 30%, 30%, 0.05)',
        name: 'Crimson Shade',
    },
    comedy: {
        accent: 'hsl(45, 80%, 55%)',
        accentMuted: 'hsl(45, 60%, 42%)',
        accentGlow: 'hsla(45, 80%, 55%, 0.12)',
        bgTint: 'hsla(45, 50%, 50%, 0.03)',
        name: 'Golden Hour',
    },
    melancholy: {
        accent: 'hsl(210, 30%, 50%)',
        accentMuted: 'hsl(210, 25%, 38%)',
        accentGlow: 'hsla(210, 30%, 50%, 0.12)',
        bgTint: 'hsla(210, 20%, 40%, 0.04)',
        name: 'Slate Rain',
    },
    tension: {
        accent: 'hsl(15, 70%, 50%)',
        accentMuted: 'hsl(15, 55%, 38%)',
        accentGlow: 'hsla(15, 70%, 50%, 0.15)',
        bgTint: 'hsla(15, 40%, 40%, 0.04)',
        name: 'Burnt Edge',
    },
    wonder: {
        accent: 'hsl(190, 60%, 50%)',
        accentMuted: 'hsl(190, 45%, 38%)',
        accentGlow: 'hsla(190, 60%, 50%, 0.12)',
        bgTint: 'hsla(190, 35%, 45%, 0.03)',
        name: 'Azure Dream',
    },
    fury: {
        accent: 'hsl(355, 75%, 50%)',
        accentMuted: 'hsl(355, 60%, 38%)',
        accentGlow: 'hsla(355, 75%, 50%, 0.18)',
        bgTint: 'hsla(355, 40%, 35%, 0.05)',
        name: 'Scarlet Storm',
    },
};

export const MODE_FONTS: Record<WritingMode, { family: string; className: string; lineHeight: string; letterSpacing: string }> = {
    story: {
        family: "'Ibarra Real Nova', 'Georgia', serif",
        className: 'font-story',
        lineHeight: '1.9',
        letterSpacing: '0.01em',
    },
    script: {
        family: "'JetBrains Mono', 'Courier New', monospace",
        className: 'font-script',
        lineHeight: '1.6',
        letterSpacing: '0em',
    },
    draft: {
        family: "'Inter', 'Helvetica Neue', sans-serif",
        className: 'font-draft',
        lineHeight: '1.75',
        letterSpacing: '0em',
    },
};

export function applyTheme(variant: ThemeVariant, mood: Mood) {
    const moodTheme = MOOD_THEMES[mood];
    const root = document.documentElement;

    root.style.setProperty('--accent', moodTheme.accent);
    root.style.setProperty('--accent-muted', moodTheme.accentMuted);
    root.style.setProperty('--accent-glow', moodTheme.accentGlow);
    root.style.setProperty('--bg-tint', moodTheme.bgTint);

    // Derived accents for gradients and high-impact UI elements
    const accentHsl = moodTheme.accent.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (accentHsl) {
        const [_, h, s, l] = accentHsl;
        root.style.setProperty('--accent-light', `hsl(${h}, ${s}%, ${Math.min(90, parseInt(l) + 15)}%)`);
        root.style.setProperty('--accent-dark', `hsl(${h}, ${s}%, ${Math.max(10, parseInt(l) - 15)}%)`);
    } else {
        root.style.setProperty('--accent-light', moodTheme.accent);
        root.style.setProperty('--accent-dark', moodTheme.accentMuted);
    }

    // Bronze brand variables (Brand-wide primary action color)
    root.style.setProperty('--bronze-light', 'hsl(32, 85%, 60%)');
    root.style.setProperty('--bronze-main', 'hsl(32, 70%, 45%)');
    root.style.setProperty('--bronze-dark', 'hsl(32, 60%, 35%)');

    if (variant === 'dark') {
        root.style.setProperty('--bg-primary', 'hsl(225, 15%, 8%)');
        root.style.setProperty('--bg-secondary', 'hsl(225, 14%, 11%)');
        root.style.setProperty('--bg-tertiary', 'hsl(225, 13%, 14%)');
        root.style.setProperty('--bg-surface', 'hsl(225, 12%, 16%)');
        root.style.setProperty('--bg-hover', 'hsl(225, 12%, 18%)');
        root.style.setProperty('--text', 'hsl(40, 15%, 94%)'); // Softened white
        root.style.setProperty('--text-secondary', 'hsl(40, 10%, 82%)');
        root.style.setProperty('--text-tertiary', 'hsl(40, 8%, 65%)');
        root.style.setProperty('--border', 'hsl(40, 5%, 32%)');
        root.style.setProperty('--border-subtle', 'hsl(40, 5%, 22%)');
        root.style.setProperty('--mica', 'hsl(225, 14%, 10%)');
        root.style.setProperty('--acrylic', 'hsla(225, 14%, 12%, 0.85)');
    } else {
        root.style.setProperty('--bg-primary', 'hsl(38, 30%, 96%)');
        root.style.setProperty('--bg-secondary', 'hsl(38, 25%, 92%)');
        root.style.setProperty('--bg-tertiary', 'hsl(38, 20%, 88%)');
        root.style.setProperty('--bg-surface', 'hsl(38, 18%, 98%)');
        root.style.setProperty('--bg-hover', 'hsl(38, 18%, 90%)');
        root.style.setProperty('--text', 'hsl(38, 20%, 12%)'); // Rich ink black
        root.style.setProperty('--text-secondary', 'hsl(38, 15%, 28%)');
        root.style.setProperty('--text-tertiary', 'hsl(38, 10%, 45%)');
        root.style.setProperty('--border', 'hsla(38, 20%, 20%, 0.28)');
        root.style.setProperty('--border-subtle', 'hsla(38, 20%, 20%, 0.18)');
        root.style.setProperty('--mica', 'hsl(38, 30%, 98%)');
        root.style.setProperty('--acrylic', 'hsla(38, 30%, 98%, 0.85)');
    }

    root.setAttribute('data-theme', variant);
}
