import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES } from '../lib/constants';
import { AssetUploader } from '../components/AssetUploader';

export const LessonEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: lesson, isLoading } = useQuery({
        queryKey: ['lesson', id],
        queryFn: async () => (await api.get(`/lessons/${id}`)).data,
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => (await api.put(`/lessons/${id}`, data)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lesson', id] });
            alert('Saved!');
        },
        onError: (err: any) => alert(err.response?.data?.message || 'Error saving'),
    });

    const { register, handleSubmit, watch, setValue } = useForm({
        values: lesson, // Auto-populate
    });

    const status = watch('status');

    const onSubmit = (data: any) => {
        const payload: any = {
            title: data.title,
            lessonNumber: data.lessonNumber,
            durationMs: data.durationMs,
            status: data.status,
            contentLanguagesAvailable: data.contentLanguagesAvailable,
            contentUrlsByLanguage: {},
            subtitleLanguages: data.subtitleLanguages || [],
            subtitleUrlsByLanguage: {},
        };

        // Handle publishAt date format (ISO 8601 required)
        if (data.publishAt) {
            payload.publishAt = new Date(data.publishAt).toISOString();
        } else {
            payload.publishAt = null;
        }

        // Clean content URLs (remove empty strings)
        if (data.contentUrlsByLanguage) {
            Object.entries(data.contentUrlsByLanguage).forEach(([lang, url]) => {
                if (typeof url === 'string' && url.length > 0) {
                    payload.contentUrlsByLanguage[lang] = url;
                }

                // Clean subtitle URLs
                if (data.subtitleUrlsByLanguage) {
                    Object.entries(data.subtitleUrlsByLanguage).forEach(([lang, url]) => {
                        if (typeof url === 'string' && url.length > 0) {
                            payload.subtitleUrlsByLanguage[lang] = url;
                        }
                    });
                }
            });
        }

        // Note: Assets are excluded from payload to prevent schema validation errors
        // (The UI for assets is currently read-only/placeholder) <-- This comment is outdated, we ARE sending assets.
        if (data.assets && Array.isArray(data.assets)) {
            payload.assets = data.assets
                .filter((a: any) => a.url && a.url.trim().length > 0) // Filter empty URLs
                .map((a: any) => ({
                    language: a.language,
                    variant: a.variant,
                    url: a.url
                }));
        }

        updateMutation.mutate(payload);
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading lesson...</div>;
    if (!lesson) return <div className="p-8 text-center text-red-400">Lesson not found</div>;

    return (
        <div className="max-w-5xl mx-auto animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center gap-6 mb-8">
                <Link
                    to={lesson?.term?.programId ? `/programs/${lesson.term.programId}` : '/programs'}
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
                    <p className="text-slate-400 text-sm mt-1">Edit lesson content and publishing settings</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Content) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Basic Info */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-1 h-5 bg-primary rounded-full" />
                                Basic Information
                            </h3>
                            <div className="space-y-5">
                                <div className="grid grid-cols-4 gap-5">
                                    <div className="col-span-3 space-y-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Title</label>
                                        <input {...register('title')} className="input-field" disabled={!['ADMIN', 'EDITOR'].includes(user?.role || '')} />
                                    </div>
                                    <div className="col-span-1 space-y-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Number</label>
                                        <input type="number" {...register('lessonNumber', { valueAsNumber: true })} className="input-field text-center font-mono" disabled={!['ADMIN', 'EDITOR'].includes(user?.role || '')} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Content Type</label>
                                        <div className="input-field bg-white/5 border-dashed border-white/10 text-slate-500 cursor-not-allowed">
                                            {lesson.contentType}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Duration</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="input-field pr-8 font-mono text-right"
                                                    min={0}
                                                    defaultValue={lesson.durationMs ? Math.floor(lesson.durationMs / 60000) : 0}
                                                    onChange={(e) => {
                                                        const m = parseInt(e.target.value) || 0;
                                                        const s = parseInt((document.getElementById('duration-sec') as HTMLInputElement)?.value) || 0;
                                                        setValue('durationMs', (m * 60 + s) * 1000, { shouldDirty: true });
                                                    }}
                                                    disabled={!['ADMIN', 'EDITOR'].includes(user?.role || '')}
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">m</span>
                                            </div>
                                            <div className="relative flex-1">
                                                <input
                                                    id="duration-sec"
                                                    type="number"
                                                    placeholder="0"
                                                    className="input-field pr-8 font-mono text-right"
                                                    min={0}
                                                    max={59}
                                                    defaultValue={lesson.durationMs ? Math.round((lesson.durationMs % 60000) / 1000) : 0}
                                                    onChange={(e) => {
                                                        const s = parseInt(e.target.value) || 0;
                                                        const m = parseInt(((e.target.parentElement?.previousElementSibling?.querySelector('input') as HTMLInputElement)?.value)) || 0;
                                                        setValue('durationMs', (m * 60 + s) * 1000, { shouldDirty: true });
                                                    }}
                                                    disabled={!['ADMIN', 'EDITOR'].includes(user?.role || '')}
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">s</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content URLs */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-1 h-5 bg-secondary rounded-full" />
                                Content URLs
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4 p-3 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Add Language:</span>
                                    <select
                                        id="new-lang-select"
                                        className="input-field w-32 py-1 text-xs"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select...</option>
                                        {LANGUAGES.map(l => (
                                            <option key={l.code} value={l.code}>{l.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const select = document.getElementById('new-lang-select') as HTMLSelectElement;
                                            const val = select.value;
                                            const currentLangs = watch('contentLanguagesAvailable') || [];
                                            if (val && !currentLangs.includes(val)) {
                                                setValue('contentLanguagesAvailable', [...currentLangs, val]);
                                                select.value = "";
                                            }
                                        }}
                                        className="text-primary hover:text-white text-xs font-bold uppercase border border-primary/20 hover:bg-primary/20 px-3 py-1.5 rounded transition-colors"
                                    >
                                        + Add
                                    </button>
                                </div>
                                {watch('contentLanguagesAvailable')?.map((lang: string) => (
                                    <div key={lang} className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 flex items-center justify-between">
                                            <span>Video URL ({lang})</span>
                                            {lang === lesson.contentLanguagePrimary && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">PRIMARY</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...register(`contentUrlsByLanguage.${lang}`)}
                                                className="input-field pl-10"
                                                placeholder="https://..."
                                                disabled={!['ADMIN', 'EDITOR'].includes(user?.role || '')}
                                            />
                                            <div className="absolute left-3 top-2.5 text-slate-500">
                                                🔗
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Subtitles */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-1 h-5 bg-pink-500 rounded-full" />
                                Subtitles
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4 p-3 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Add Language:</span>
                                    <input
                                        id="new-sub-lang-input"
                                        placeholder="e.g. fr"
                                        className="input-field w-20 py-1 text-center lowercase"
                                        maxLength={2}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const input = e.currentTarget;
                                                const val = input.value.toLowerCase();
                                                const currentLangs = watch('subtitleLanguages') || [];
                                                if (val && val.length === 2 && !currentLangs.includes(val)) {
                                                    setValue('subtitleLanguages', [...currentLangs, val]);
                                                    input.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('new-sub-lang-input') as HTMLInputElement;
                                            const val = input.value.toLowerCase();
                                            const currentLangs = watch('subtitleLanguages') || [];
                                            if (val && val.length === 2 && !currentLangs.includes(val)) {
                                                setValue('subtitleLanguages', [...currentLangs, val]);
                                                input.value = '';
                                            }
                                        }}
                                        className="text-pink-500 hover:text-white text-xs font-bold uppercase border border-pink-500/20 hover:bg-pink-500/20 px-3 py-1.5 rounded transition-colors"
                                    >
                                        + Add
                                    </button>
                                </div>
                                {watch('subtitleLanguages')?.length > 0 ? (
                                    watch('subtitleLanguages').map((lang: string) => (
                                        <div key={lang} className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 flex items-center justify-between">
                                                <span>Subtitle URL ({lang})</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentLangs = watch('subtitleLanguages') || [];
                                                        setValue('subtitleLanguages', currentLangs.filter((l: string) => l !== lang));
                                                        // Also clear the URL value
                                                        setValue(`subtitleUrlsByLanguage.${lang}`, undefined);
                                                    }}
                                                    className="text-[10px] text-red-400 hover:text-red-300"
                                                >
                                                    Remove
                                                </button>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    {...register(`subtitleUrlsByLanguage.${lang}`)}
                                                    className="input-field pl-10"
                                                    placeholder="https://... (.vtt or .srt)"
                                                    disabled={!['ADMIN', 'EDITOR'].includes(user?.role || '')}
                                                />
                                                <div className="absolute left-3 top-2.5 text-slate-500">
                                                    📄
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-slate-500 text-sm italic">
                                        No subtitles added yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assets (Thumbnails) */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                                Asset Management
                            </h3>
                            <p className="text-xs text-slate-500 mb-6 ml-3">Manage thumbnails and posters for this lesson.</p>

                            <div className="space-y-4">
                                {['PORTRAIT', 'LANDSCAPE', 'SQUARE', 'BANNER'].map((variant) => {
                                    const currentAsset = watch('assets')?.find((a: any) => a.assetType === 'THUMBNAIL' && a.variant === variant && a.language === lesson.contentLanguagePrimary);

                                    return (
                                        <div key={variant} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-sm font-bold text-slate-300 capitalize">{variant.toLowerCase()} Thumbnail</span>
                                                <span className="text-[10px] font-mono bg-white/10 text-slate-400 px-1.5 py-0.5 rounded uppercase">{lesson.contentLanguagePrimary}</span>
                                            </div>
                                            {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                                                <div className="mb-2">
                                                    <AssetUploader
                                                        currentUrl={currentAsset?.url}
                                                        isEditing={true}
                                                        label={`${variant} Thumbnail`}
                                                        variant={variant}
                                                        language={lesson.contentLanguagePrimary}
                                                        onSave={(url) => {
                                                            const currentAssets = watch('assets') || [];
                                                            const otherAssets = currentAssets.filter((a: any) => !(a.assetType === 'THUMBNAIL' && a.variant === variant && a.language === lesson.contentLanguagePrimary));

                                                            if (url) {
                                                                setValue('assets', [
                                                                    ...otherAssets,
                                                                    {
                                                                        language: lesson.contentLanguagePrimary,
                                                                        variant: variant,
                                                                        assetType: 'THUMBNAIL',
                                                                        url: url
                                                                    }
                                                                ], { shouldDirty: true });
                                                            } else {
                                                                if (currentAsset) {
                                                                    setValue('assets', otherAssets, { shouldDirty: true });
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {currentAsset?.url && (
                                                <div className={clsx(
                                                    "mt-2 rounded-lg bg-black/40 border border-white/5 overflow-hidden relative group",
                                                    variant === 'PORTRAIT' ? "w-24 aspect-[3/4]" :
                                                        variant === 'LANDSCAPE' ? "w-32 aspect-video" :
                                                            variant === 'SQUARE' ? "w-24 aspect-square" : "w-full aspect-[3/1]"
                                                )}>
                                                    <img
                                                        src={currentAsset.url}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Publishing) */}
                    <div className="space-y-8">
                        <div className="glass-panel p-6 rounded-2xl sticky top-8">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-1 h-5 bg-amber-500 rounded-full" />
                                Publishing
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Status</label>
                                    <select {...register('status')} className="input-field appearance-none cursor-pointer" disabled={!['ADMIN', 'EDITOR'].includes(user?.role || '')}>
                                        <option value="DRAFT">Draft</option>
                                        <option value="SCHEDULED">Scheduled</option>
                                        <option value="PUBLISHED">Published</option>
                                        <option value="ARCHIVED">Archived</option>
                                    </select>
                                </div>

                                {status === 'SCHEDULED' && (
                                    <div className="space-y-2 animate-[fadeIn_0.3s_ease-out]">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Publish At (UTC)</label>
                                        <input
                                            type="datetime-local"
                                            {...register('publishAt')}
                                            className="input-field"
                                            disabled={!['ADMIN', 'EDITOR'].includes(user?.role || '')}
                                        />
                                        <p className="text-[10px] text-amber-500/80 ml-1">
                                            ⚠️ Must be a future date for auto-publishing
                                        </p>
                                    </div>
                                )}

                                {lesson.publishedAt && (
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                        <p className="text-xs text-emerald-400 font-medium flex items-center gap-2">
                                            <span>✅</span> Published on {new Date(lesson.publishedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-white/5">
                                    {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                                        <button
                                            type="submit"
                                            disabled={updateMutation.isPending}
                                            className="w-full btn-primary"
                                        >
                                            {updateMutation.isPending ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="animate-spin w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full" />
                                                    Saving...
                                                </span>
                                            ) : 'Save Changes'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
