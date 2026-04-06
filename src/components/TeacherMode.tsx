'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/store';
import { showToast } from './ToastContainer';
import {
    GraduationCap, BookOpen, ChevronLeft, ChevronRight, Plus, Trash2,
    Globe, Star, Award, Target, CheckCircle, Lock, Loader2, Send,
    BarChart3, X, Sparkles, Clock, TrendingUp, AlertCircle,
} from 'lucide-react';

interface Course {
    id: string;
    language: string;
    level: string;
    title: string;
    description: string;
    currentLesson: number;
    totalLessons: number;
    completedLessons: number;
    averageGrade: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface Lesson {
    id: string;
    courseId: string;
    lessonNumber: number;
    title: string;
    objective: string;
    content: string;
    exercisePrompt: string;
    status: string;
    createdAt: string;
}

interface Submission {
    id: string;
    lessonId: string;
    courseId: string;
    content: string;
    grade: number | null;
    feedback: string;
    strengths: string;
    improvements: string;
    status: string;
}

interface GradeResult {
    grade: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    letterGrade: string;
}

const LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Japanese', 'Korean', 'Chinese', 'Arabic', 'Russian', 'Hindi',
    'Dutch', 'Swedish', 'Polish', 'Turkish', 'Vietnamese', 'Thai',
];

const LEVELS = [
    { value: 'beginner', label: 'Beginner', icon: '🌱', desc: 'Starting your writing journey' },
    { value: 'intermediate', label: 'Intermediate', icon: '📝', desc: 'Building on fundamentals' },
    { value: 'advanced', label: 'Advanced', icon: '✨', desc: 'Mastering the craft' },
];

function getLetterGrade(grade: number): string {
    if (grade >= 97) return 'A+';
    if (grade >= 93) return 'A';
    if (grade >= 90) return 'A-';
    if (grade >= 87) return 'B+';
    if (grade >= 83) return 'B';
    if (grade >= 80) return 'B-';
    if (grade >= 77) return 'C+';
    if (grade >= 73) return 'C';
    if (grade >= 70) return 'C-';
    if (grade >= 60) return 'D';
    return 'F';
}

function getGradeColor(grade: number): string {
    if (grade >= 90) return 'hsl(142, 71%, 45%)';
    if (grade >= 80) return 'hsl(188, 78%, 41%)';
    if (grade >= 70) return 'hsl(45, 93%, 47%)';
    if (grade >= 60) return 'hsl(25, 95%, 53%)';
    return 'hsl(0, 72%, 51%)';
}

export default function TeacherMode({ onBack }: { onBack: () => void }) {
    const { state } = useApp();
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [showNewCourse, setShowNewCourse] = useState(false);
    const [newLanguage, setNewLanguage] = useState('English');
    const [newLevel, setNewLevel] = useState('beginner');
    const [loading, setLoading] = useState(false);
    const [generatingLesson, setGeneratingLesson] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [studentWork, setStudentWork] = useState('');
    const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
    const [view, setView] = useState<'courses' | 'course' | 'lesson'>('courses');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch courses on mount
    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/courses');
            const data = await res.json();
            setCourses(data);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        }
    };

    const openCourse = async (course: Course) => {
        setActiveCourse(course);
        setLoading(true);
        try {
            const res = await fetch(`/api/courses?courseId=${course.id}`);
            const data = await res.json();
            setLessons(data.lessons || []);
            setSubmissions(data.submissions || []);
            setView('course');
        } catch (err) {
            showToast('Failed to load course', 'error');
        } finally {
            setLoading(false);
        }
    };

    const createCourse = async () => {
        if (!state.apiKey) {
            showToast('Set your API key in Settings first', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: newLanguage, level: newLevel }),
            });
            const course = await res.json();
            showToast('Course created! Welcome aboard 📚', 'success');
            setShowNewCourse(false);
            await fetchCourses();
            openCourse(course);
        } catch (err) {
            showToast('Failed to create course', 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteCourse = async (id: string) => {
        if (!confirm('Delete this course and all progress?')) return;
        try {
            await fetch(`/api/courses?id=${id}`, { method: 'DELETE' });
            showToast('Course deleted', 'info');
            await fetchCourses();
            if (activeCourse?.id === id) {
                setActiveCourse(null);
                setView('courses');
            }
        } catch {
            showToast('Failed to delete course', 'error');
        }
    };

    const openLesson = async (lesson: Lesson) => {
        if (lesson.status === 'locked') {
            showToast('Complete the previous lesson first', 'info');
            return;
        }

        setActiveLesson(lesson);
        setStudentWork('');
        setGradeResult(null);
        setView('lesson');

        // Check if we already have a submission for this lesson
        const existingSub = submissions.find(s => s.lessonId === lesson.id);
        if (existingSub && existingSub.grade !== null) {
            try {
                setGradeResult({
                    grade: existingSub.grade,
                    feedback: existingSub.feedback,
                    strengths: JSON.parse(existingSub.strengths || '[]'),
                    improvements: JSON.parse(existingSub.improvements || '[]'),
                    letterGrade: getLetterGrade(existingSub.grade),
                });
                setStudentWork(existingSub.content);
            } catch { /* ignore parse errors */ }
        }

        // Generate lesson content if not already generated
        if (!lesson.content || lesson.content.length < 50) {
            if (!state.apiKey) {
                showToast('Set your API key in Settings to load lessons', 'error');
                return;
            }
            setGeneratingLesson(true);
            try {
                const res = await fetch('/api/courses/lesson', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'generate',
                        lessonId: lesson.id,
                        courseId: activeCourse!.id,
                        apiKey: state.apiKey,
                        model: state.model,
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    showToast(data.error || 'Failed to generate lesson', 'error');
                } else if (data.lesson) {
                    setActiveLesson(data.lesson);
                    setLessons(prev => prev.map(l => l.id === data.lesson.id ? data.lesson : l));
                }
            } catch {
                showToast('Network error — could not reach the server', 'error');
            } finally {
                setGeneratingLesson(false);
            }
        }
    };

    const submitExercise = async () => {
        if (!studentWork.trim() || !activeLesson || !activeCourse) return;

        const wordCount = studentWork.trim().split(/\s+/).length;
        if (wordCount < 30) {
            showToast('Write at least 30 words before submitting', 'info');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/courses/lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'grade',
                    lessonId: activeLesson.id,
                    courseId: activeCourse.id,
                    apiKey: state.apiKey,
                    model: state.model,
                    submissionContent: studentWork,
                }),
            });
            const data = await res.json();
            if (data.submission) {
                setGradeResult({
                    grade: data.submission.grade,
                    feedback: data.submission.feedback,
                    strengths: data.submission.strengths || [],
                    improvements: data.submission.improvements || [],
                    letterGrade: data.submission.letterGrade || getLetterGrade(data.submission.grade),
                });
                showToast(`Graded: ${getLetterGrade(data.submission.grade)} (${data.submission.grade}/100)`, 'success');

                // Refresh course data
                await openCourse(activeCourse);
            } else if (data.error) {
                showToast(data.error, 'error');
            }
        } catch {
            showToast('Failed to grade submission. Check your API key.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const progressPercent = activeCourse
        ? Math.round((activeCourse.completedLessons / activeCourse.totalLessons) * 100)
        : 0;

    // ─── RENDER: Course List ───
    if (view === 'courses') {
        return (
            <div className="dashboard" style={{ background: 'var(--bg-primary)' }}>
                <div className="dashboard-header">
                    <div className="logo">
                        <div className="logo-icon"><GraduationCap size={16} /></div>
                        <span>Aether Ink</span> · Teacher Mode
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-surface" onClick={onBack}>
                            <ChevronLeft size={14} /> Dashboard
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowNewCourse(true)}>
                            <Plus size={14} /> New Course
                        </button>
                    </div>
                </div>

                <div className="dashboard-content">
                    {courses.length === 0 && !showNewCourse && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ textAlign: 'center', padding: '80px 0' }}
                        >
                            <GraduationCap size={64} style={{ color: 'var(--accent)', opacity: 0.3, marginBottom: 24 }} />
                            <h2 style={{ marginBottom: 12 }}>Welcome to Teacher Mode</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 480, margin: '0 auto 32px' }}>
                                Start a structured creative writing course in any language.
                                Your AI professor will teach you concepts, give exercises, and grade your work honestly.
                            </p>
                            <button className="btn btn-primary" onClick={() => setShowNewCourse(true)} style={{ padding: '12px 24px', fontSize: '1rem' }}>
                                <Plus size={16} /> Start Your First Course
                            </button>
                        </motion.div>
                    )}

                    {courses.length > 0 && (
                        <>
                            <h2 style={{ marginBottom: 24 }}>Your Courses</h2>
                            <div className="project-grid">
                                {courses.map((course, i) => (
                                    <motion.div
                                        key={course.id}
                                        className="project-card"
                                        onClick={() => openCourse(course)}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Globe size={14} style={{ color: 'var(--accent)' }} />
                                                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', fontWeight: 600 }}>
                                                    {course.language} · {course.level}
                                                </span>
                                            </div>
                                            <button
                                                className="btn-icon"
                                                onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }}
                                                style={{ opacity: 0.3, padding: 2 }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>

                                        <div className="project-card-title">{course.title}</div>

                                        {/* Progress bar */}
                                        <div style={{ margin: '16px 0 8px', background: 'var(--bg-tertiary)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${Math.round((course.completedLessons / course.totalLessons) * 100)}%`,
                                                height: '100%',
                                                background: 'var(--accent)',
                                                borderRadius: 4,
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>

                                        <div className="project-card-meta">
                                            <span><BookOpen size={12} /> {course.completedLessons}/{course.totalLessons} lessons</span>
                                            {course.averageGrade > 0 && (
                                                <span><Award size={12} /> {course.averageGrade}% avg</span>
                                            )}
                                            <span style={{ color: course.status === 'completed' ? 'hsl(142, 71%, 45%)' : 'var(--text-tertiary)' }}>
                                                {course.status === 'completed' ? '✓ Complete' : 'In Progress'}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* New Course Modal */}
                <AnimatePresence>
                    {showNewCourse && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNewCourse(false)}
                        >
                            <motion.div
                                className="modal"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <div className="modal-title" style={{ margin: 0 }}>
                                        <GraduationCap size={20} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
                                        Start a New Course
                                    </div>
                                    <button className="btn-icon" onClick={() => setShowNewCourse(false)}><X size={16} /></button>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Language</label>
                                    <select
                                        className="input"
                                        value={newLanguage}
                                        onChange={(e) => setNewLanguage(e.target.value)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {LANGUAGES.map(lang => (
                                            <option key={lang} value={lang}>{lang}</option>
                                        ))}
                                    </select>
                                    <div className="form-hint">
                                        All lessons, exercises, and feedback will be in this language
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Level</label>
                                    <div className="mode-selector">
                                        {LEVELS.map(lvl => (
                                            <div
                                                key={lvl.value}
                                                className={`mode-option ${newLevel === lvl.value ? 'selected' : ''}`}
                                                onClick={() => setNewLevel(lvl.value)}
                                            >
                                                <div className="mode-option-icon">{lvl.icon}</div>
                                                <div className="mode-option-label">{lvl.label}</div>
                                                <div className="mode-option-desc">{lvl.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary"
                                    onClick={createCourse}
                                    disabled={loading}
                                    style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                                >
                                    {loading ? <><Loader2 size={16} className="loading-spinner" /> Creating...</> : <><Sparkles size={16} /> Begin Course</>}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ─── RENDER: Course Detail (Lesson List + Progress) ───
    if (view === 'course' && activeCourse) {
        return (
            <div className="dashboard" style={{ background: 'var(--bg-primary)' }}>
                <div className="dashboard-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn-icon" onClick={() => setView('courses')}>
                            <ChevronLeft size={18} />
                        </button>
                        <div>
                            <div style={{ fontSize: '1rem', fontWeight: 500 }}>{activeCourse.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                {activeCourse.language} · {activeCourse.level}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content" style={{ maxWidth: 900, margin: '0 auto' }}>
                    {/* Progress Overview */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 16,
                            marginBottom: 40,
                        }}
                    >
                        {[
                            { icon: <BookOpen size={18} />, label: 'Progress', value: `${activeCourse.completedLessons}/${activeCourse.totalLessons}`, sub: `${progressPercent}%` },
                            { icon: <Award size={18} />, label: 'Average', value: activeCourse.averageGrade > 0 ? `${activeCourse.averageGrade}%` : '—', sub: activeCourse.averageGrade > 0 ? getLetterGrade(activeCourse.averageGrade) : 'No grades yet' },
                            { icon: <Target size={18} />, label: 'Current', value: `Lesson ${activeCourse.currentLesson}`, sub: 'Up next' },
                            { icon: <TrendingUp size={18} />, label: 'Status', value: activeCourse.status === 'completed' ? 'Complete!' : 'Active', sub: activeCourse.status === 'completed' ? '🎓' : 'Keep going!' },
                        ].map((stat, i) => (
                            <div key={i} style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                padding: 20,
                                textAlign: 'center',
                            }}>
                                <div style={{ color: 'var(--accent)', marginBottom: 8 }}>{stat.icon}</div>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 4 }}>{stat.label}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stat.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{stat.sub}</div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Full progress bar */}
                    <div style={{ margin: '0 0 32px', background: 'var(--bg-tertiary)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            style={{ height: '100%', background: `linear-gradient(90deg, var(--accent), var(--accent-muted))`, borderRadius: 6 }}
                        />
                    </div>

                    {/* Lesson List */}
                    <h3 style={{ marginBottom: 16 }}>Curriculum</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {lessons.map((lesson, i) => {
                            const sub = submissions.find(s => s.lessonId === lesson.id);
                            const isLocked = lesson.status === 'locked';
                            const isCompleted = lesson.status === 'completed';

                            return (
                                <motion.div
                                    key={lesson.id}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => openLesson(lesson)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        padding: '16px 20px',
                                        background: 'var(--bg-secondary)',
                                        border: `1px solid ${isCompleted ? 'hsla(142, 71%, 45%, 0.3)' : 'var(--border-subtle)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                        opacity: isLocked ? 0.5 : 1,
                                        transition: 'all 150ms ease',
                                    }}
                                    whileHover={isLocked ? {} : { x: 4, borderColor: 'var(--accent)' }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isCompleted ? 'hsla(142, 71%, 45%, 0.15)' : 'var(--bg-tertiary)',
                                        color: isCompleted ? 'hsl(142, 71%, 45%)' : isLocked ? 'var(--text-tertiary)' : 'var(--accent)',
                                        fontSize: '0.85rem', fontWeight: 600, flexShrink: 0,
                                    }}>
                                        {isCompleted ? <CheckCircle size={18} /> : isLocked ? <Lock size={14} /> : lesson.lessonNumber}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                                            {lesson.title}
                                        </div>
                                        {lesson.objective && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                {lesson.objective}
                                            </div>
                                        )}
                                    </div>

                                    {sub && sub.grade !== null && (
                                        <div style={{
                                            fontSize: '0.85rem', fontWeight: 600,
                                            color: getGradeColor(sub.grade),
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}>
                                            <Star size={14} />
                                            {sub.grade}%
                                        </div>
                                    )}

                                    {!isLocked && !isCompleted && (
                                        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // ─── RENDER: Lesson View ───
    if (view === 'lesson' && activeLesson && activeCourse) {
        return (
            <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
                {/* Lesson Content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button className="btn-icon" onClick={() => { setView('course'); setActiveLesson(null); }}>
                                <ChevronLeft size={18} />
                            </button>
                            <div>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 600 }}>
                                    Lesson {activeLesson.lessonNumber} of {activeCourse.totalLessons}
                                </div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{activeLesson.title}</div>
                            </div>
                        </div>
                        {gradeResult && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '6px 14px', borderRadius: 'var(--radius-md)',
                                background: `${getGradeColor(gradeResult.grade)}22`,
                                border: `1px solid ${getGradeColor(gradeResult.grade)}44`,
                            }}>
                                <Award size={14} style={{ color: getGradeColor(gradeResult.grade) }} />
                                <span style={{ fontWeight: 600, color: getGradeColor(gradeResult.grade) }}>
                                    {gradeResult.letterGrade} ({gradeResult.grade}/100)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Lesson Content Body */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
                        <div style={{ maxWidth: 720, margin: '0 auto' }}>
                            {generatingLesson ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ textAlign: 'center', padding: '80px 0' }}
                                >
                                    <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                        Professor Aether is preparing your lesson...
                                    </p>
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: 8 }}>
                                        This may take a moment
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="lesson-content"
                                    dangerouslySetInnerHTML={{
                                        __html: renderMarkdown(activeLesson.content || 'No content yet.'),
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Exercise Sidebar */}
                <div style={{
                    width: 420, height: '100vh', borderLeft: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column',
                    flexShrink: 0,
                }}>
                    <div style={{
                        padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <Target size={14} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 600 }}>
                            Exercise
                        </span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Exercise Prompt */}
                        {activeLesson.exercisePrompt && (
                            <div style={{
                                padding: 16, background: 'var(--accent-glow)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '0.875rem', lineHeight: 1.7,
                                color: 'var(--text-primary)',
                            }}>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: renderMarkdown(activeLesson.exercisePrompt),
                                    }}
                                />
                            </div>
                        )}

                        {/* Student Writing Area */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={{
                                fontSize: '0.75rem', textTransform: 'uppercase',
                                letterSpacing: '0.06em', color: 'var(--text-tertiary)',
                                marginBottom: 8, fontWeight: 600,
                            }}>
                                Your Response
                            </label>
                            <textarea
                                ref={textareaRef}
                                value={studentWork}
                                onChange={(e) => setStudentWork(e.target.value)}
                                placeholder="Write your exercise here..."
                                disabled={!!gradeResult}
                                style={{
                                    flex: 1,
                                    minHeight: 200,
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 16,
                                    fontFamily: 'var(--font-story)',
                                    fontSize: '0.95rem',
                                    lineHeight: 1.8,
                                    color: 'var(--text-primary)',
                                    resize: 'none',
                                    outline: 'none',
                                }}
                            />
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                fontSize: '0.7rem', color: 'var(--text-tertiary)',
                                marginTop: 6, padding: '0 4px',
                            }}>
                                <span>{studentWork.trim().split(/\s+/).filter(Boolean).length} words</span>
                                {!gradeResult && <span>Min. 30 words</span>}
                            </div>
                        </div>

                        {/* Grade Result */}
                        <AnimatePresence>
                            {gradeResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        padding: 20, background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        border: `1px solid ${getGradeColor(gradeResult.grade)}44`,
                                    }}
                                >
                                    {/* Grade badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: '50%',
                                            background: `${getGradeColor(gradeResult.grade)}22`,
                                            border: `2px solid ${getGradeColor(gradeResult.grade)}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.1rem', fontWeight: 700,
                                            color: getGradeColor(gradeResult.grade),
                                        }}>
                                            {gradeResult.letterGrade}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{gradeResult.grade}/100</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Professor Aether&apos;s Grade</div>
                                        </div>
                                    </div>

                                    {/* Feedback */}
                                    <div style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                        {gradeResult.feedback}
                                    </div>

                                    {/* Strengths */}
                                    {gradeResult.strengths.length > 0 && (
                                        <div style={{ marginBottom: 12 }}>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(142, 71%, 45%)', fontWeight: 600, marginBottom: 6 }}>
                                                ✓ Strengths
                                            </div>
                                            {gradeResult.strengths.map((s, i) => (
                                                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '3px 0', display: 'flex', gap: 6 }}>
                                                    <span style={{ color: 'hsl(142, 71%, 45%)' }}>•</span> {s}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Areas to improve */}
                                    {gradeResult.improvements.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(45, 93%, 47%)', fontWeight: 600, marginBottom: 6 }}>
                                                ↑ Growth Areas
                                            </div>
                                            {gradeResult.improvements.map((s, i) => (
                                                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '3px 0', display: 'flex', gap: 6 }}>
                                                    <span style={{ color: 'hsl(45, 93%, 47%)' }}>•</span> {s}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Submit Button */}
                    {!gradeResult && (
                        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
                            <button
                                className="btn btn-primary"
                                onClick={submitExercise}
                                disabled={submitting || studentWork.trim().split(/\s+/).filter(Boolean).length < 30}
                                style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                            >
                                {submitting ? (
                                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Grading...</>
                                ) : (
                                    <><Send size={16} /> Submit for Grading</>
                                )}
                            </button>
                        </div>
                    )}

                    {gradeResult && (
                        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
                            <button
                                className="btn btn-surface"
                                onClick={() => { setView('course'); setActiveLesson(null); setGradeResult(null); }}
                                style={{ width: '100%', padding: '12px' }}
                            >
                                <ChevronLeft size={16} /> Back to Curriculum
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}

// Simple markdown renderer
function renderMarkdown(md: string): string {
    return md
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br/>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/<p><h/g, '<h')
        .replace(/<\/h(\d)><\/p>/g, '</h$1>')
        .replace(/<p><blockquote>/g, '<blockquote>')
        .replace(/<\/blockquote><\/p>/g, '</blockquote>')
        .replace(/<p><ul>/g, '<ul>')
        .replace(/<\/ul><\/p>/g, '</ul>')
        .replace(/<p><\/p>/g, '');
}
