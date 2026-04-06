'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check, AlertCircle, Loader2, X } from 'lucide-react';

export interface OpenRouterModel {
    id: string;
    name: string;
    description: string;
    pricing: {
        prompt: string;
        completion: string;
    };
    context_length: number;
}

interface ModelSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [models, setModels] = useState<OpenRouterModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchModels = async () => {
            setLoading(true);
            try {
                // Try cache first
                const cached = localStorage.getItem('aether-ink-or-models');
                const cacheTime = localStorage.getItem('aether-ink-or-models-time');
                
                if (cached && cacheTime && Date.now() - Number(cacheTime) < 1000 * 60 * 60 * 24) {
                    setModels(JSON.parse(cached));
                    setLoading(false);
                    return;
                }

                const res = await fetch('https://openrouter.ai/api/v1/models');
                const data = await res.json();
                
                // Sort models alphabetically or logically
                const formatted = data.data.sort((a: OpenRouterModel, b: OpenRouterModel) => 
                    a.id.localeCompare(b.id)
                );
                
                setModels(formatted);
                localStorage.setItem('aether-ink-or-models', JSON.stringify(formatted));
                localStorage.setItem('aether-ink-or-models-time', Date.now().toString());
            } catch (err) {
                console.error('Failed to fetch OpenRouter models:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && models.length === 0) {
            fetchModels();
        }
    }, [isOpen, models.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const filteredModels = models.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedModel = models.find(m => m.id === value);
    const displayText = selectedModel ? selectedModel.id : value;

    return (
        <>
            <div 
                className="model-selector-trigger input"
                onClick={() => setIsOpen(true)}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayText || 'Select a model...'}
                </span>
                <ChevronDown size={16} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className="modal-overlay"
                        style={{ zIndex: 200 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div 
                            className="model-side-slider acrylic"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                                boxShadow: 'var(--shadow-28)',
                                borderLeft: '1px solid var(--border)'
                            }}
                        >
                            <div className="model-slider-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Select Architect Model</h3>
                                <button className="btn btn-ghost" onClick={() => setIsOpen(false)} style={{ padding: 8 }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="model-search-container">
                                <Search size={16} className="model-search-icon" />
                                <input 
                                    className="model-search-input input"
                                    placeholder="Search OpenRouter models..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            <div className="model-list">
                                {loading && models.length === 0 ? (
                                    <div className="model-list-message">
                                        <Loader2 size={20} className="spinner" />
                                        <span>Loading models from OpenRouter...</span>
                                    </div>
                                ) : error ? (
                                    <div className="model-list-message error">
                                        <AlertCircle size={20} />
                                        <span>Failed to load models. Using text input instead.</span>
                                        <input 
                                            className="input" 
                                            value={value} 
                                            onChange={(e) => onChange(e.target.value)} 
                                            placeholder="e.g. google/gemini-2.0-flash-001"
                                            style={{ marginTop: 12 }}
                                        />
                                    </div>
                                ) : filteredModels.length === 0 ? (
                                    <div className="model-list-message">
                                        <span>No models found.</span>
                                    </div>
                                ) : (
                                    filteredModels.map(model => (
                                        <div 
                                            key={model.id}
                                            className={`model-item ${value === model.id ? 'selected' : ''}`}
                                            onClick={() => {
                                                onChange(model.id);
                                                setIsOpen(false);
                                            }}
                                            style={{ 
                                                borderRadius: 'var(--radius-sm)',
                                                margin: '2px 8px',
                                                padding: '10px 12px'
                                            }}
                                        >
                                            <div className="model-item-content">
                                                <div className="model-item-title" style={{ fontWeight: 500, fontSize: '0.85rem' }}>{model.id}</div>
                                                <div className="model-item-meta">
                                                    <span>{(model.context_length / 1000).toFixed(0)}k context</span>
                                                </div>
                                            </div>
                                            {value === model.id && <Check size={16} color="var(--accent)" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
