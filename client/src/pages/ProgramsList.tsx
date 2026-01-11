import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES, getLanguageLabel } from '../lib/constants';



const createProgramSchema = z.object({
    title: z.string().min(1, "Title is required"),
    languagePrimary: z.string().length(2, "Language code must be 2 chars"),
});



export const ProgramsList: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isCreating, setIsCreating] = useState(false);

    const [filters, setFilters] = useState({
        status: '',
        language: '',
        topic: ''
    });



    const { data: programs, isLoading } = useQuery<any[]>({
        queryKey: ['programs', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.language) params.append('language', filters.language);
            if (filters.topic) params.append('topic', filters.topic);
            const res = await api.get(`/programs?${params.toString()}`);
            return res.data;
        },
    });

    const { data: topics } = useQuery<any[]>({
        queryKey: ['topics'],
        queryFn: async () => (await api.get('/topics')).data,
    });

    const createMutation = useMutation({
        mutationFn: async (data: { title: string; languagePrimary: string }) => {
            const res = await api.post('/programs', { ...data, languagesAvailable: [data.languagePrimary] });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            setIsCreating(false);
            navigate(`/programs/${data.id}`);
        },
    });

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(createProgramSchema)
    });



    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Content...</div>;

    const canEdit = ['ADMIN', 'EDITOR'].includes(user?.role || '');

    return (
        <div className="animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Programs</h2>
                    <p className="text-slate-400 mt-1">Manage your course catalog and curriculum</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <span className="text-lg leading-none">+</span> Create Program
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-8">
                {['ADMIN', 'EDITOR'].includes(user?.role || '') && (
                    <select
                        className="input-field w-40"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                )}
                <select
                    className="input-field w-40"
                    value={filters.language}
                    onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                >
                    <option value="">All Languages</option>
                    {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                </select>
                <select
                    className="input-field w-60"
                    value={filters.topic}
                    onChange={(e) => setFilters(prev => ({ ...prev, topic: e.target.value }))}
                >
                    <option value="">All Topics</option>
                    {topics?.map((topic) => (
                        <option key={topic.id} value={topic.name}>
                            {topic.name}
                        </option>
                    ))}
                </select>
            </div>

            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="w-full max-w-2xl glass-panel p-8 rounded-2xl shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary rounded-full" />
                            New Program Details
                        </h3>
                        <form onSubmit={handleSubmit((d) => createMutation.mutate(d as any))} className="flex gap-6 items-start">
                            <div className="flex-1 space-y-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Program Title</label>
                                <input
                                    {...register('title')}
                                    className="input-field"
                                    placeholder="e.g. Advanced Machine Learning"
                                    autoFocus
                                />
                                {errors.title && <p className="text-red-400 text-xs ml-1 font-medium">{String(errors.title.message)}</p>}
                            </div>
                            <div className="w-40 space-y-2 relative">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide ml-1">Language Code</label>
                                <select
                                    {...register('languagePrimary')}
                                    className="input-field cursor-pointer appearance-none"
                                >
                                    {LANGUAGES.map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.code.toUpperCase()} - {lang.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-9 pointer-events-none text-slate-500 text-xs">▼</div>
                                {errors.languagePrimary && <p className="text-red-400 text-xs ml-1 font-medium">{String(errors.languagePrimary.message)}</p>}
                            </div>
                        </form>
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-6 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit((d) => createMutation.mutate(d as any))}
                                disabled={createMutation.isPending}
                                className="btn-primary"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Program'}
                            </button>
                        </div>
                    </div>
                </div >
            )}

            <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Program Title</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Language</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Last Updated</th>
                            <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {programs?.map((program) => (
                            <tr
                                key={program.id}
                                className="group hover:bg-white/5 transition-all duration-200 cursor-pointer"
                                onClick={() => navigate(`/programs/${program.id}`)}
                            >
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <div className="text-sm font-bold text-white flex items-center gap-3">
                                        <div className="w-12 aspect-[3/4] rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors relative">
                                            {(() => {
                                                const poster = program.assets?.find((a: any) => a.assetType === 'POSTER' && a.variant === 'PORTRAIT' && a.language === program.languagePrimary);
                                                return poster ? (
                                                    <img src={poster.url} alt={program.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-[8px] font-bold text-slate-500 uppercase">No Img</div>
                                                );
                                            })()}
                                        </div>
                                        <div>
                                            {program.title}
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {program.topics?.map((t: any) => (
                                                    <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        {t.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <span className={clsx(
                                        "px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border backdrop-blur-md",
                                        program.status === 'PUBLISHED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                            program.status === 'DRAFT' ? "bg-slate-500/10 text-slate-400 border-slate-500/20" :
                                                "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    )}>
                                        <span className={clsx("w-1.5 h-1.5 rounded-full mr-2 my-auto",
                                            program.status === 'PUBLISHED' ? "bg-emerald-400" :
                                                program.status === 'DRAFT' ? "bg-slate-400" :
                                                    "bg-amber-400"
                                        )}></span>
                                        {program.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-400">
                                    <span className="bg-white/5 border border-white/5 px-2.5 py-1 rounded-md text-xs font-bold text-slate-300 tracking-wider">
                                        {getLanguageLabel(program.languagePrimary)}
                                    </span>
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-500 font-medium">
                                    {new Date(program.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                                    {canEdit && (
                                        <Link
                                            to={`/programs/${program.id}`}
                                            className="text-primary hover:text-sky-300 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Edit <span className="text-xs">→</span>
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {programs && programs.length === 0 && (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500 text-2xl">
                            📚
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">No Programs Yet</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">Get started by creating your first educational program to share with the world.</p>
                        {canEdit && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="btn-primary"
                            >
                                Create Program
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};
