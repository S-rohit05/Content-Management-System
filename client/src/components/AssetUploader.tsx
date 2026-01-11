import React, { useState } from 'react';
import clsx from 'clsx';
import { api } from '../lib/api';

interface AssetUploaderProps {
    currentUrl?: string;
    onSave: (url: string) => void;
    label?: string;
    variant?: string;
    language?: string;
    isEditing: boolean;
}

export const AssetUploader: React.FC<AssetUploaderProps> = ({
    currentUrl,
    onSave,
    label,
    variant,
    language,
    isEditing
}) => {
    const [mode, setMode] = useState<'link' | 'upload'>('upload');
    const [uploading, setUploading] = useState(false);
    const [localUrl, setLocalUrl] = useState(currentUrl || '');

    // Reset local url when prop changes
    React.useEffect(() => {
        setLocalUrl(currentUrl || '');
    }, [currentUrl]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const url = res.data.url;
            setLocalUrl(url); // Optimistic update
            onSave(url);
        } catch (error) {
            console.error('Upload failed', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleUrlBlur = () => {
        if (localUrl !== currentUrl) {
            onSave(localUrl);
        }
    };

    if (!isEditing) {
        // Read-only view
        return null; // The parent usually renders the image. This component controls the INPUT.
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>}
                <div className="flex bg-white/5 rounded-lg p-0.5">
                    <button
                        onClick={() => setMode('upload')}
                        className={clsx("px-2 py-0.5 text-[10px] rounded font-bold uppercase transition-colors", mode === 'upload' ? "bg-primary text-white" : "text-slate-500 hover:text-white")}
                    >
                        Upload
                    </button>
                    <button
                        onClick={() => setMode('link')}
                        className={clsx("px-2 py-0.5 text-[10px] rounded font-bold uppercase transition-colors", mode === 'link' ? "bg-primary text-white" : "text-slate-500 hover:text-white")}
                    >
                        Link
                    </button>
                </div>
            </div>

            {mode === 'upload' ? (
                <div className="relative group">
                    <label className={clsx(
                        "flex flex-col items-center justify-center w-full h-20 border border-dashed rounded-lg cursor-pointer hover:bg-white/5 transition-colors",
                        uploading ? "border-primary/50 bg-primary/5" : "border-white/10"
                    )}>
                        {uploading ? (
                            <div className="text-center">
                                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-1" />
                                <span className="text-[10px] text-primary">Uploading...</span>
                            </div>
                        ) : (
                            <div className="text-center">
                                <span className="text-xl mb-1 block">☁️</span>
                                <span className="text-[10px] text-slate-500">Click to upload</span>
                            </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>
            ) : (
                <div className="relative">
                    <input
                        className="input-field text-xs pr-8"
                        placeholder="https://..."
                        value={localUrl}
                        onChange={(e) => setLocalUrl(e.target.value)}
                        onBlur={handleUrlBlur}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔗</span>
                </div>
            )}

            {/* Visual feedback if something is set but not saved? handled by blur */}
            <p className="text-[10px] text-slate-600">
                {variant} • {language}
            </p>
        </div>
    );
};
