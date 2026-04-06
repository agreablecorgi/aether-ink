'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { ChevronLeft, Settings, Sun, Moon } from 'lucide-react';
import ModelSelector from './ModelSelector';

export default function SettingsPage({ onBack }: { onBack: () => void }) {
    const { state, dispatch } = useApp();
    const [apiKeyInput, setApiKeyInput] = useState(state.apiKey);
    const [modelInput, setModelInput] = useState(state.model);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setIsDirty(apiKeyInput !== state.apiKey || modelInput !== state.model);
    }, [apiKeyInput, modelInput, state.apiKey, state.model]);

    const handleSave = () => {
        if (apiKeyInput !== state.apiKey) {
            dispatch({ type: 'SET_API_KEY', payload: apiKeyInput });
        }
        if (modelInput !== state.model) {
            dispatch({ type: 'SET_MODEL', payload: modelInput });
        }
        onBack();
    };

    return (
        <div className="dashboard" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <motion.header
                className="dashboard-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button
                        className="btn-icon"
                        onClick={onBack}
                        title="Back to Dashboard"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="logo">
                        <span className="logo-aether">Aether</span> <span className="logo-ink">Settings</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        className="btn btn-ghost"
                        onClick={onBack}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={!isDirty}
                    >
                        Save Settings
                    </button>
                </div>
            </motion.header>

            {/* Content */}
            <motion.div
                className="dashboard-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                style={{
                    maxWidth: 680,
                    margin: '0 auto',
                    width: '100%',
                    paddingTop: 64,
                    paddingBottom: 64
                }}
            >
                <div style={{ padding: '0 24px' }}>
                    <div className="form-group" style={{ marginBottom: 36 }}>
                        <label className="form-label" style={{ fontSize: '0.85rem' }}>OpenRouter API Key</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="sk-or-v1-..."
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                        />
                        <p className="form-hint" style={{ fontSize: '0.8rem', marginTop: 8 }}>
                            Get your API key securely from{' '}
                            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                                openrouter.ai/keys
                            </a>
                        </p>
                    </div>

                    <div className="form-group" style={{ marginBottom: 36 }}>
                        <label className="form-label" style={{ fontSize: '0.85rem' }}>Architect Model</label>
                        <ModelSelector
                            value={modelInput}
                            onChange={setModelInput}
                        />
                        <p className="form-hint" style={{ fontSize: '0.8rem', marginTop: 8 }}>
                            Select the AI model used for the conversational Architect sidecar.
                        </p>
                    </div>

                    <div className="form-group" style={{ marginBottom: 36 }}>
                        <label className="form-label" style={{ fontSize: '0.85rem' }}>Theme Engine</label>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <button
                                className={`btn ${state.themeVariant === 'dark' ? 'btn-primary' : 'btn-surface'}`}
                                onClick={() => dispatch({ type: 'SET_THEME', payload: 'dark' })}
                                style={{ padding: '12px 24px' }}
                            >
                                <Moon size={16} /> Obsidian
                            </button>
                            <button
                                className={`btn ${state.themeVariant === 'light' ? 'btn-primary' : 'btn-surface'}`}
                                onClick={() => dispatch({ type: 'SET_THEME', payload: 'light' })}
                                style={{ padding: '12px 24px' }}
                            >
                                <Sun size={16} /> Parchment
                            </button>
                        </div>
                        <p className="form-hint" style={{ fontSize: '0.8rem', marginTop: 8 }}>
                            Instantly switch between dark (Obsidian) and light (Parchment) aesthetics.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
