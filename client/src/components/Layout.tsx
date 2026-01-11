import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const StorageSection: React.FC<{ title: string, storageKey: string, icon: string, currentPath: string }> = ({ title, storageKey, icon, currentPath }) => {
    const [items, setItems] = useState<any[]>([]);

    const loadItems = () => {
        try {
            const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
            setItems(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        loadItems();
        const handleStorageUpdate = () => loadItems();
        window.addEventListener('cms-storage-update', handleStorageUpdate);
        return () => window.removeEventListener('cms-storage-update', handleStorageUpdate);
    }, [storageKey]);

    if (items.length === 0) return null;

    return (
        <div className="pt-4 mt-4 border-t border-white/5">
            <div className="text-xs font-semibold text-slate-500 mb-2 px-4 uppercase tracking-widest flex items-center justify-between">
                {title}
                {items.length > 0 && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (window.confirm(`Clear ${title}?`)) {
                                localStorage.removeItem(storageKey);
                                window.dispatchEvent(new Event('cms-storage-update'));
                            }
                        }}
                        className="text-[9px] hover:text-red-400 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>
            {items.map((item: any) => (
                <Link
                    key={item.id}
                    to={`/programs/${item.id}`}
                    className={clsx(
                        "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group mx-2",
                        currentPath === `/programs/${item.id}`
                            ? "bg-white/10 text-white"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                >
                    <span className="text-xs opacity-70">{icon}</span>
                    <span className="font-medium text-sm truncate">{item.title}</span>
                </Link>
            ))}
        </div>
    );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <div className="flex h-screen bg-background text-slate-100 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-surface/50 backdrop-blur-xl border-r border-white/5 flex flex-col relative z-20 shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="font-bold text-white text-lg">C</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                            CMS Portal
                        </h1>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Admin Dashboard</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="text-xs font-semibold text-slate-500 mb-4 px-4 uppercase tracking-widest">Menu</div>

                    {/* All Programs */}
                    <Link
                        to="/programs"
                        className={clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                            location.pathname === '/programs'
                                ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5"
                                : "text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1"
                        )}
                    >
                        <span className={clsx("w-1.5 h-1.5 rounded-full transition-all", location.pathname === '/programs' ? "bg-primary" : "bg-slate-600 group-hover:bg-slate-400")} />
                        <span className="font-medium">Programs</span>
                    </Link>

                    {/* Pinned Programs Section */}
                    <StorageSection
                        title="Pinned"
                        storageKey="cms_pinned_programs"
                        icon="★"
                        currentPath={location.pathname}
                    />

                    {/* Recently Visited Section */}
                    <StorageSection
                        title="Recent"
                        storageKey="cms_recent_programs"
                        icon="↺"
                        currentPath={location.pathname}
                    />

                    {user?.role === 'ADMIN' && (
                        <div className="pt-4 mt-4 border-t border-white/5">
                            <div className="text-xs font-semibold text-slate-500 mb-2 px-4 uppercase tracking-widest">Admin</div>
                            <Link
                                to="/users"
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    location.pathname.startsWith('/users')
                                        ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1"
                                )}
                            >
                                <span className={clsx("w-1.5 h-1.5 rounded-full transition-all", location.pathname.startsWith('/users') ? "bg-primary" : "bg-slate-600 group-hover:bg-slate-400")} />
                                <span className="font-medium">User Management</span>
                            </Link>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-white/5 bg-surface/30">
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                            {user?.email[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full py-2.5 px-4 rounded-lg bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-bold uppercase tracking-wider border border-white/5 hover:border-red-500/20 transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};
