import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

export const UsersList: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Redirect if not admin
    if (user?.role !== 'ADMIN') {
        return <div className="p-8 text-center text-red-500">Access Denied</div>;
    }

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => (await api.get('/users')).data,
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => (await api.post('/users', data)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsCreateModalOpen(false);
        },
        onError: (err: any) => alert(err.response?.data?.message || 'Error creating user'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => (await api.delete(`/users/${id}`)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    });

    const { register, handleSubmit, reset } = useForm();

    const onSubmit = (data: any) => {
        createMutation.mutate(data);
        reset();
    };

    if (isLoading) return <div className="text-center text-slate-400">Loading users...</div>;

    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">User Management</h2>
                    <p className="text-slate-400 mt-1">Manage system access and roles</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary"
                >
                    + Add User
                </button>
            </div>

            <div className="glass-panel overflow-hidden rounded-2xl">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-xs uppercase text-slate-400 font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Created At</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users?.map((u: any) => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-medium text-slate-200">{u.email}</td>
                                <td className="px-6 py-4">
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border",
                                        u.role === 'ADMIN' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                            u.role === 'EDITOR' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                    )}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {u.id !== user?.id && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this user?')) {
                                                    deleteMutation.mutate(u.id);
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-400 text-xs font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="glass-panel w-full max-w-md p-6 rounded-2xl relative animate-[fadeIn_0.2s_ease-out]">
                        <h3 className="text-xl font-bold text-white mb-6">Create New User</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                                <input {...register('email', { required: true })} className="input-field" type="email" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                                <input {...register('password', { required: true, minLength: 6 })} className="input-field" type="password" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Role</label>
                                <select {...register('role')} className="input-field appearance-none">
                                    <option value="VIEWER">Viewer</option>
                                    <option value="EDITOR">Editor</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors text-sm font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="btn-primary"
                                >
                                    {createMutation.isPending ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
