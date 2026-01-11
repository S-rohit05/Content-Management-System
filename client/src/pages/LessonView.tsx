import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { EditableText } from '../components/EditableText';
import { formatDuration } from '../lib/utils';
import { getLessonThumbnail } from '../lib/assetHelpers';

export const LessonView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: lesson, isLoading } = useQuery({
        queryKey: ['lesson', id],
        queryFn: async () => (await api.get(`/lessons/${id}`)).data,
        enabled: !!id,
    });

    const updateLessonMutation = useMutation({
        mutationFn: async ({ id, ...data }: any) => (await api.put(`/lessons/${id}`, data)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lesson', id] }),
    });

    // Local Progress State
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');

    useEffect(() => {
        if (id) {
            const completed = JSON.parse(localStorage.getItem('completed_lessons') || '[]');
            setIsCompleted(completed.includes(id));
        }
    }, [id]);

    useEffect(() => {
        if (lesson && lesson.contentLanguagePrimary && !selectedLanguage) {
            setSelectedLanguage(lesson.contentLanguagePrimary);
        }
    }, [lesson, selectedLanguage]);

    const toggleCompletion = () => {
        const completed = JSON.parse(localStorage.getItem('completed_lessons') || '[]');
        let newCompleted;
        if (isCompleted) {
            newCompleted = completed.filter((lid: string) => lid !== id);
        } else {
            newCompleted = [...completed, id];
        }
        localStorage.setItem('completed_lessons', JSON.stringify(newCompleted));
        setIsCompleted(!isCompleted);
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading lesson...</div>;
    if (!lesson) return <div className="p-8 text-center text-red-400">Lesson not found</div>;

    const currentUrl = lesson.contentUrlsByLanguage?.[selectedLanguage] || '';
    const availableLanguages = lesson.contentLanguagesAvailable || [lesson.contentLanguagePrimary];

    // Helper for navigation disabled state style
    const navBtnClass = "flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5";

    return (
        <div className="max-w-7xl mx-auto animate-[fadeIn_0.5s_ease-out] pb-20">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        to={lesson.term?.programId ? `/programs/${lesson.term.programId}` : '/programs'}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        ←
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-400 font-bold">
                                #{lesson.lessonNumber}
                            </span>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{lesson.title}</h2>
                        </div>
                        {lesson.term && (
                            <div className="text-xs text-slate-500 mt-1 ml-1">
                                Term {lesson.term.termNumber}: {lesson.term.title}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Action Bar */}
                <div className="flex items-center gap-3 bg-black/20 p-1.5 rounded-xl border border-white/5">
                    <Link
                        to={lesson.prevLessonId ? `/lessons/${lesson.prevLessonId}/view` : '#'}
                        className={`${navBtnClass} ${!lesson.prevLessonId ? 'pointer-events-none opacity-30' : ''}`}
                    >
                        ← Prev
                    </Link>

                    <button
                        onClick={toggleCompletion}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-bold text-sm",
                            isCompleted
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        {isCompleted ? (
                            <>
                                <span className="text-lg">✓</span> Completed
                            </>
                        ) : (
                            <>
                                <span className="opacity-0 w-0 md:opacity-100 md:w-auto">Mark as </span> Complete
                            </>
                        )}
                    </button>

                    <Link
                        to={lesson.nextLessonId ? `/lessons/${lesson.nextLessonId}/view` : '#'}
                        className={`${navBtnClass} ${!lesson.nextLessonId ? 'pointer-events-none opacity-30' : ''}`}
                    >
                        Next →
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content (Video Player) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                        {currentUrl ? (
                            <iframe
                                src={(() => {
                                    try {
                                        // Simple converter for Standard share URLs
                                        if (currentUrl.includes('youtu.be/')) return currentUrl.replace('youtu.be/', 'youtube.com/embed/');
                                        if (currentUrl.includes('youtube.com/watch?v=')) return currentUrl.replace('watch?v=', 'embed/');
                                        return currentUrl;
                                    } catch (e) {
                                        return currentUrl;
                                    }
                                })()}
                                title={lesson.title}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            // Fallback to Landscape Thumbnail if no video content
                            (() => {
                                const thumbUrl = getLessonThumbnail(lesson, 'LANDSCAPE', selectedLanguage);
                                if (thumbUrl) {
                                    return (
                                        <div className="w-full h-full relative">
                                            <img src={thumbUrl} alt={lesson.title} className="w-full h-full object-cover opacity-50" />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-4xl mb-4 drop-shadow-xl">📺</span>
                                                <p className="text-white drop-shadow-md font-bold">Content coming soon</p>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                        <span className="text-4xl mb-4">📺</span>
                                        <p>No content available for this language.</p>
                                    </div>
                                );
                            })()
                        )}
                    </div>

                    <div className="glass-panel p-8 rounded-2xl">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="w-1 h-5 bg-primary rounded-full"></span>
                                About this lesson
                            </h2>
                            {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                                <Link
                                    to={`/lessons/${id}/edit`}
                                    className="text-xs font-bold text-primary hover:text-white transition-colors uppercase tracking-wide"
                                >
                                    Edit Content
                                </Link>
                            )}
                        </div>

                        {/* Improved Typography for Description */}
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                            {['ADMIN', 'EDITOR'].includes(user?.role || '') ? (
                                <EditableText
                                    value={lesson.description}
                                    isEditing={true}
                                    onSave={(val) => updateLessonMutation.mutate({ id: lesson.id, description: val })}
                                    placeholder="Add a detailed description, learning objectives, or notes for this lesson..."
                                    rows={6}
                                    className="bg-black/20 border-white/5 focus:border-primary/50 text-base"
                                />
                            ) : (
                                <div className="whitespace-pre-wrap">
                                    {lesson.description || "No description provided for this lesson."}
                                </div>
                            )}
                        </div>

                        {/* Objectives Placeholder (If we had fields for it, for now using static or description part) */}
                        {!lesson.description && !['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                            <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/5">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">Lesson Context</h4>
                                <p className="text-slate-500 italic">No specific objectives listed.</p>
                            </div>
                        )}

                    </div>
                </div>

                {/* Sidebar (Language & Meta) */}
                <div className="space-y-6">
                    {/* Language Selector */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                            {['ADMIN', 'EDITOR'].includes(user?.role || '') ? 'Audio Language' : 'Language'}
                        </h3>
                        <div className="space-y-2">
                            {availableLanguages.map((lang: string) => (
                                <button
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={clsx(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 group",
                                        selectedLanguage === lang
                                            ? "bg-primary/10 border-primary/50 text-white shadow-lg shadow-primary/5"
                                            : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                                    )}
                                >
                                    <span className="font-bold uppercase tracking-wider text-sm">{lang}</span>
                                    {selectedLanguage === lang && (
                                        <span className="flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="glass-panel p-6 rounded-2xl space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Details</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Duration</span>
                                <span className="text-slate-200 font-mono bg-white/5 px-2 py-0.5 rounded">
                                    {formatDuration(lesson.durationMs)}
                                </span>
                            </div>
                            {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                                <>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Type</span>
                                        <span className="text-slate-200 capitalize">{lesson.contentType?.toLowerCase()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Status</span>
                                        <span className={clsx(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                                            lesson.status === 'PUBLISHED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                "bg-white/5 text-slate-500 border-white/10"
                                        )}>
                                            {lesson.status}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
