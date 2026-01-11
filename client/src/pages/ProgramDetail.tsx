import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { formatDuration } from '../lib/utils';
import { EditableText } from '../components/EditableText';
import { AssetUploader } from '../components/AssetUploader';
import { getProgramPoster, getLessonThumbnail } from '../lib/assetHelpers';

export const ProgramDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: program, isLoading } = useQuery({
        queryKey: ['program', id],
        queryFn: async () => (await api.get(`/programs/${id}`)).data,
    });

    const { data: allTopics } = useQuery({
        queryKey: ['topics'],
        queryFn: async () => (await api.get('/topics')).data,
    });

    const [posterLanguage, setPosterLanguage] = useState<string>('');
    const [isTopicMenuOpen, setIsTopicMenuOpen] = useState<boolean>(false);
    const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});
    const [newTopicName, setNewTopicName] = useState('');

    // Initialize poster language and expanded terms when program loads
    useEffect(() => {
        if (program) {
            if (program.languagePrimary && !posterLanguage) {
                setPosterLanguage(program.languagePrimary);
            }
            // Initialize terms as expanded by default
            if (program.terms) {
                setExpandedTerms(prev => {
                    const newAcc = { ...prev };
                    program.terms.forEach((t: any) => {
                        if (newAcc[t.id] === undefined) newAcc[t.id] = true;
                    });
                    return newAcc;
                });
            }
        }
    }, [program]);

    // Local Storage Logic: Recent & Pinned
    const [isPinned, setIsPinned] = useState(false);

    useEffect(() => {
        if (!program) return;

        // Add to Recent
        try {
            const recent = JSON.parse(localStorage.getItem('cms_recent_programs') || '[]');
            const newRecent = [
                { id: program.id, title: program.title, timestamp: Date.now() },
                ...recent.filter((p: any) => p.id !== program.id)
            ].slice(0, 5); // Keep top 5
            localStorage.setItem('cms_recent_programs', JSON.stringify(newRecent));
            window.dispatchEvent(new Event('cms-storage-update'));
        } catch (e) { console.error('Recent storage error', e); }

        // Check Pinned
        try {
            const pinned = JSON.parse(localStorage.getItem('cms_pinned_programs') || '[]');
            setIsPinned(pinned.some((p: any) => p.id === program.id));
        } catch (e) { console.error('Pinned check error', e); }
    }, [program?.id, program?.title]); // Only on main info change

    const togglePin = () => {
        if (!program) return;
        try {
            const pinned = JSON.parse(localStorage.getItem('cms_pinned_programs') || '[]');
            let newPinned;
            if (isPinned) {
                newPinned = pinned.filter((p: any) => p.id !== program.id);
            } else {
                newPinned = [...pinned, { id: program.id, title: program.title }];
            }
            localStorage.setItem('cms_pinned_programs', JSON.stringify(newPinned));
            setIsPinned(!isPinned);
            window.dispatchEvent(new Event('cms-storage-update'));
        } catch (e) { console.error('Pin toggle error', e); }
    };

    const updateMutation = useMutation({
        mutationFn: async (data: any) => (await api.put(`/programs/${id}`, data)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program', id] }),
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to update program';
            if (error.response?.data?.code === 'VALIDATION_ERROR') {
                alert(`Cannot Publish:\n${message}`);
            } else {
                alert(message);
            }
        }
    });

    const updateTermMutation = useMutation({
        mutationFn: async ({ id, ...data }: any) => (await api.put(`/terms/${id}`, data)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program', id] }),
    });

    const createTermMutation = useMutation({
        mutationFn: async () => (await api.post('/terms', { programId: id, termNumber: (program?.terms?.length || 0) + 1, title: 'New Term' })).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program', id] }),
    });



    const createLessonMutation = useMutation({
        mutationFn: async ({ termId, lessonNumber }: { termId: string, lessonNumber: number }) => {
            return (await api.post('/lessons', {
                termId,
                lessonNumber,
                title: 'New Lesson',
                description: '',
                contentType: 'VIDEO',
                contentLanguagePrimary: program.languagePrimary,
                contentLanguagesAvailable: [program.languagePrimary],
                contentUrlsByLanguage: {}
            })).data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program', id] }),
    });

    const createTopicMutation = useMutation({
        mutationFn: async (name: string) => (await api.post('/topics', { name })).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topics'] });
            setNewTopicName('');
        }
    });

    const toggleTerm = (termId: string) => {
        setExpandedTerms(prev => ({
            ...prev,
            [termId]: !prev[termId]
        }));
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Program...</div>;
    if (!program) return <div className="p-8 text-center text-red-500">Program not found</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out] pb-20">
            {/* Header */}
            <div className="flex items-center gap-6">
                <Link
                    to="/programs"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                    ←
                </Link>
                <button
                    onClick={togglePin}
                    className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center border transition-all",
                        isPinned ? "bg-primary/20 text-primary border-primary/50" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    )}
                    title={isPinned ? "Unpin Program" : "Pin Program"}
                >
                    {isPinned ? "★" : "☆"}
                </button>
                <div>
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold text-white tracking-tight">{program.title}</h2>
                        {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                            <select
                                className={clsx(
                                    "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border backdrop-blur-md cursor-pointer appearance-none",
                                    program.status === 'PUBLISHED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                        program.status === 'DRAFT' ? "bg-slate-500/10 text-slate-400 border-slate-500/20" :
                                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                )}
                                value={program.status}
                                onChange={(e) => updateMutation.mutate({ status: e.target.value })}
                            >
                                <option value="DRAFT" className="bg-slate-800 text-slate-400">DRAFT</option>
                                <option value="PUBLISHED" className="bg-slate-800 text-emerald-400">PUBLISHED</option>
                                <option value="ARCHIVED" className="bg-slate-800 text-amber-400">ARCHIVED</option>
                            </select>
                        )}

                        {['ADMIN'].includes(user?.role || '') && (
                            <button
                                onClick={async () => {
                                    if (window.confirm('Are you sure you want to DELETE this entire program? This cannot be undone.')) {
                                        try {
                                            await api.delete(`/programs/${id}`);
                                            window.location.href = '/programs';
                                        } catch (e) {
                                            alert('Failed to delete program');
                                        }
                                    }
                                }}
                                className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors ml-2"
                            >
                                Delete Program
                            </button>
                        )}
                    </div>
                    {/* Topics Display in Header */}
                    {program.topics && program.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {program.topics.map((t: any) => (
                                <span key={t.id} className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                                    {t.name}
                                </span>
                            ))}
                        </div>
                    )}
                    {/* Topic Selection */}
                    {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                        <div className="mt-4 relative z-50">
                            <button
                                onClick={() => setIsTopicMenuOpen(!isTopicMenuOpen)}
                                className={clsx(
                                    "text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg border",
                                    isTopicMenuOpen ? "bg-white/10 border-white/10 text-white" : "border-transparent hover:bg-white/5 hover:border-white/5"
                                )}
                            >
                                + Manage Topics
                            </button>

                            {isTopicMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsTopicMenuOpen(false)} />
                                    <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-[#1a1b26] border border-white/10 rounded-xl shadow-xl z-50 animate-[fadeIn_0.1s_ease-out]">
                                        <h5 className="text-xs font-bold text-white mb-2 uppercase tracking-wider flex justify-between items-center">
                                            Select Topics
                                            <button onClick={() => setIsTopicMenuOpen(false)} className="text-slate-500 hover:text-white">✕</button>
                                        </h5>

                                        {/* New Topic Creation Input */}
                                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
                                            <input
                                                type="text"
                                                placeholder="New topic name..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                                                value={newTopicName}
                                                onChange={(e) => setNewTopicName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && newTopicName.trim() && createTopicMutation.mutate(newTopicName.trim())}
                                            />
                                            <button
                                                disabled={!newTopicName.trim() || createTopicMutation.isPending}
                                                onClick={() => newTopicName.trim() && createTopicMutation.mutate(newTopicName.trim())}
                                                className="text-xs font-bold bg-primary/20 text-primary hover:bg-primary/30 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                            {allTopics?.map((topic: any) => {
                                                const isSelected = program.topics?.some((t: any) => t.id === topic.id);
                                                return (
                                                    <label key={topic.id} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                const currentIds = program.topics?.map((t: any) => t.id) || [];
                                                                let newIds;
                                                                if (e.target.checked) {
                                                                    newIds = [...currentIds, topic.id];
                                                                } else {
                                                                    newIds = currentIds.filter((id: string) => id !== topic.id);
                                                                }
                                                                updateMutation.mutate({ topicIds: newIds });
                                                            }}
                                                            className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                                                        />
                                                        <span className={clsx("text-xs transition-colors", isSelected ? "text-white font-medium" : "text-slate-400")}>{topic.name}</span>
                                                    </label>
                                                );
                                            })}
                                            {allTopics?.length === 0 && (
                                                <p className="text-xs text-slate-500 italic p-2">No topics available.</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                        <p className="text-slate-400 mt-2 text-xs">Manage content, terms, and lessons</p>
                    )}
                </div>
            </div>

            {/* Basic Info Card */}
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                {/* Hero Background - Landscape Poster */}
                {(() => {
                    const heroUrl = getProgramPoster(program, 'LANDSCAPE', posterLanguage);
                    if (heroUrl) {
                        return (
                            <>
                                <div className="absolute inset-0 z-0">
                                    <img src={heroUrl} alt="Hero" className="w-full h-full object-cover opacity-80 blur-sm scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-slate-900/20" />
                                </div>
                            </>
                        );
                    }
                    return (
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
                    );
                })()}

                <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-white/5 flex items-center gap-2">
                    <span className="w-1 h-5 bg-secondary rounded-full" />
                    {['ADMIN', 'EDITOR'].includes(user?.role || '') ? 'Program Details' : 'About this Course'}
                </h3>
                <div className="flex gap-8 items-start relative z-10">
                    <div className="flex-1 space-y-4">

                        <div className="space-y-3 mb-8">
                            <EditableText
                                value={program.description}
                                isEditing={['ADMIN', 'EDITOR'].includes(user?.role || '')}
                                onSave={(val) => updateMutation.mutate({ description: val })}
                                className="min-h-[80px] text-lg text-slate-200 leading-relaxed font-medium"
                                rows={3}
                                placeholder="Add a course overview..."
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Duration</span>
                                <span className="text-xl font-mono font-bold text-white">
                                    {formatDuration(program.terms?.reduce((acc: number, t: any) => acc + (t.lessons?.reduce((lAcc: number, l: any) => lAcc + (l.durationMs || 0), 0) || 0), 0) || 0)}
                                </span>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Terms</span>
                                <span className="text-xl font-bold text-white">{program.terms?.length || 0}</span>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Lessons</span>
                                <span className="text-xl font-bold text-white">
                                    {program.terms?.reduce((acc: number, t: any) => acc + (t.lessons?.length || 0), 0) || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Program Assets (Admin Only) */}
                {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                    <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="w-1 h-4 bg-purple-500 rounded-full" />
                                Program Posters
                            </h4>
                            <select
                                className="input-field py-1 px-3 text-xs w-auto min-w-[100px]"
                                value={posterLanguage}
                                onChange={(e) => setPosterLanguage(e.target.value)}
                            >
                                {program.languagesAvailable?.map((lang: string) => (
                                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-6 bg-purple-500/5 p-4 rounded-xl border border-purple-500/10">
                            {['PORTRAIT', 'LANDSCAPE'].map((variant) => {
                                const currentAsset = program.assets?.find((a: any) => a.assetType === 'POSTER' && a.variant === variant && a.language === posterLanguage);

                                return (
                                    <div key={variant} className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{variant} Poster</label>
                                            <span className="text-[10px] font-mono bg-white/10 text-slate-400 px-1.5 py-0.5 rounded uppercase">{posterLanguage}</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className={clsx(
                                                "relative overflow-hidden rounded-lg bg-black/40 border border-white/10 flex-shrink-0 group",
                                                variant === 'PORTRAIT' ? "w-20 aspect-[3/4]" : "w-32 aspect-video"
                                            )}>
                                                {currentAsset?.url ? (
                                                    <img src={currentAsset.url} alt={variant} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                        <span className="text-[10px]">Empty</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <AssetUploader
                                                    currentUrl={currentAsset?.url}
                                                    isEditing={['ADMIN', 'EDITOR'].includes(user?.role || '')}
                                                    label={`${variant} Poster`}
                                                    variant={variant}
                                                    language={posterLanguage}
                                                    onSave={(url) => {
                                                        if (!url && !currentAsset) return;
                                                        const otherAssets = program.assets?.filter((a: any) => !(a.assetType === 'POSTER' && a.variant === variant && a.language === posterLanguage)) || [];
                                                        const newAssets = [...otherAssets];
                                                        if (url) {
                                                            newAssets.push({
                                                                language: posterLanguage,
                                                                variant: variant,
                                                                assetType: 'POSTER',
                                                                url: url
                                                            });
                                                        }
                                                        updateMutation.mutate({ assets: newAssets });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Curriculum */}
            <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        {['ADMIN', 'EDITOR'].includes(user?.role || '') ? 'Curriculum' : 'Course Content'}
                        <span className="text-sm font-normal text-slate-500 py-1 px-3 bg-white/5 rounded-full border border-white/5">
                            {program.terms?.length || 0} Terms
                        </span>
                    </h3>
                    {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                        <button
                            onClick={() => createTermMutation.mutate()}
                            className="text-primary hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-colors font-semibold border border-transparent hover:border-white/5"
                        >
                            + Add Term
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {program.terms?.map((term: any) => (
                        <div key={term.id} className="glass-card rounded-2xl overflow-hidden group border border-white/5 shadow-sm">
                            {/* Term Header / Collapsible Trigger */}
                            <div
                                className={clsx(
                                    "p-5 flex justify-between items-center cursor-pointer transition-all",
                                    expandedTerms[term.id] ? "bg-white/5 border-b border-white/5" : "hover:bg-white/5"
                                )}
                                onClick={() => toggleTerm(term.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono transition-colors",
                                        expandedTerms[term.id] ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-slate-400 border border-white/10"
                                    )}>
                                        T{term.termNumber}
                                    </div>
                                    <div>
                                        <div onClick={(e) => e.stopPropagation()} className="font-bold text-lg text-slate-200">
                                            <EditableText
                                                value={term.title || `Term ${term.termNumber}`}
                                                isEditing={['ADMIN', 'EDITOR'].includes(user?.role || '')}
                                                onSave={(val) => updateTermMutation.mutate({ id: term.id, title: val })}
                                                className="hover:bg-white/10 rounded px-2 -ml-2 transition-colors cursor-text"
                                            />
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
                                            <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{term.lessons?.length || 0} Lessons</span>
                                            {expandedTerms[term.id] && <span className="text-[10px] text-primary font-bold tracking-wide uppercase">Active</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                                        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Are you sure you want to delete this term?')) {
                                                        await api.delete(`/terms/${term.id}`);
                                                        queryClient.invalidateQueries({ queryKey: ['program', id] });
                                                    }
                                                }}
                                                className="text-[10px] text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded transition-colors uppercase tracking-wide opacity-80 hover:opacity-100"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => createLessonMutation.mutate({ termId: term.id, lessonNumber: (term.lessons?.length || 0) + 1 })}
                                                className="text-xs bg-white/5 text-slate-300 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-all font-bold uppercase tracking-wide"
                                            >
                                                + Add Lesson
                                            </button>
                                        </div>
                                    )}
                                    <span className={clsx("transform transition-transform duration-300 text-slate-500", expandedTerms[term.id] ? "rotate-180" : "rotate-0")}>
                                        ▼
                                    </span>
                                </div>
                            </div>

                            {/* Term Content (Collapsible) */}
                            {expandedTerms[term.id] && (
                                <div className="animate-[fadeIn_0.2s_ease-out] bg-black/10">
                                    {/* Term Description Field */}
                                    <div className="p-4 px-6 border-b border-white/5 bg-black/10">
                                        <EditableText
                                            value={term.description}
                                            isEditing={['ADMIN', 'EDITOR'].includes(user?.role || '')}
                                            onSave={(val) => updateTermMutation.mutate({ id: term.id, description: val })}
                                            placeholder="Add a brief description for this term (e.g., 'Introduction to core concepts')..."
                                            className="text-sm text-slate-400 italic"
                                        />
                                    </div>

                                    <div className="divide-y divide-white/5">
                                        {term.lessons?.map((lesson: any) => (
                                            <div key={lesson.id} className="p-4 pl-6 hover:bg-white/5 transition-colors flex justify-between items-center group/lesson relative">
                                                {/* Nesting Line */}
                                                <div className="absolute left-10 top-0 bottom-0 w-px bg-white/5 -z-10 group-hover/lesson:bg-white/10 transition-colors" />

                                                <div className="flex items-center gap-5 flex-1">
                                                    {/* Visual Hierarchy: Portrait Thumbnail (User Request) */}
                                                    <div className="relative pl-6 flex items-center gap-4 flex-1">
                                                        <div className="flex-shrink-0 w-16 aspect-[3/4] rounded-lg bg-white/5 overflow-hidden border border-white/10 relative shadow-sm">
                                                            {(() => {
                                                                const thumbUrl = getLessonThumbnail(lesson, 'PORTRAIT', program.languagePrimary);

                                                                if (thumbUrl) {
                                                                    return <img src={thumbUrl} alt={lesson.title || 'Lesson Thumbnail'} className="w-full h-full object-cover" />;
                                                                }
                                                                // Fallback Icon if no thumbnail
                                                                return (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 bg-white/5">
                                                                        <span className="text-xs">{lesson.contentType === 'VIDEO' ? '▶️' : '📄'}</span>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-xs font-mono text-slate-500 opacity-70">#{lesson.lessonNumber}</span>
                                                                <Link to={`/lessons/${lesson.id}/view`} className="font-bold text-slate-200 group-hover/lesson:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4 truncate block">
                                                                    {lesson.title}
                                                                </Link>
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                                                {lesson.durationMs && (
                                                                    <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                                                        ⏱ {formatDuration(lesson.durationMs)}
                                                                    </span>
                                                                )}
                                                                {/* Display Available Languages */}
                                                                {lesson.contentLanguagesAvailable && lesson.contentLanguagesAvailable.length > 0 && (
                                                                    <div className="flex gap-1 ml-2">
                                                                        {lesson.contentLanguagesAvailable.map((lang: string) => (
                                                                            <span key={lang} className={clsx(
                                                                                "text-[9px] px-1 py-0.5 rounded font-mono uppercase border",
                                                                                lang === lesson.contentLanguagePrimary
                                                                                    ? "bg-primary/20 text-primary border-primary/20"
                                                                                    : "bg-white/5 text-slate-500 border-white/10"
                                                                            )}>
                                                                                {lang}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {/* Hide additional meta for viewers to reduce clutter, as requested */}
                                                                {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                                                                    <span className="capitalize opacity-50 ml-2">{lesson.contentType?.toLowerCase()}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Side Actions / Meta */}
                                                <div className="flex items-center gap-4 pl-4">
                                                    {['ADMIN', 'EDITOR'].includes(user?.role || '') ? (
                                                        <>
                                                            <span className={clsx(
                                                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                                                                lesson.status === 'PUBLISHED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                                    lesson.status === 'SCHEDULED' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                                        "bg-white/5 text-slate-500 border-white/10"
                                                            )}>
                                                                {lesson.status}
                                                            </span>
                                                            <div className="flex items-center opacity-0 group-hover/lesson:opacity-100 transition-opacity gap-2">
                                                                <Link
                                                                    to={`/lessons/${lesson.id}/edit`}
                                                                    className="px-3 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors border border-white/10"
                                                                >
                                                                    Edit
                                                                </Link>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (window.confirm('Are you sure you want to delete this lesson?')) {
                                                                            await api.delete(`/lessons/${lesson.id}`);
                                                                            queryClient.invalidateQueries({ queryKey: ['program', id] });
                                                                        }
                                                                    }}
                                                                    // Replaced Emoji with text
                                                                    className="px-3 py-1.5 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        // Viewer View: Just a clean arrow or nothing
                                                        <Link to={`/lessons/${lesson.id}/view`} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                                                            →
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {term.lessons?.length === 0 && (
                                            <div className="p-8 text-center bg-black/20">
                                                <p className="text-slate-600 italic text-sm mb-3">No lessons in this term yet.</p>
                                                {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                                                    <button
                                                        onClick={() => createLessonMutation.mutate({ termId: term.id, lessonNumber: 1 })}
                                                        className="text-xs text-primary hover:text-white hover:underline"
                                                    >
                                                        + Add the first lesson
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {program.terms?.length === 0 && (
                        <div className="p-12 text-center bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                                📚
                            </div>
                            <h4 className="text-white font-bold text-lg mb-2">Curriculum is empty</h4>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                                {['ADMIN', 'EDITOR'].includes(user?.role || '')
                                    ? "Start building your course by adding the first term."
                                    : "No content has been added to this course yet. Check back soon!"}
                            </p>
                            {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                                <button
                                    onClick={() => createTermMutation.mutate()}
                                    className="btn-primary"
                                >
                                    + Create First Term
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
