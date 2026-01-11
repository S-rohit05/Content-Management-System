import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

interface EditableTextProps {
    value: string;
    placeholder?: string;
    isEditing: boolean;
    onSave: (value: string) => void;
    className?: string;
    rows?: number;
}

export const EditableText: React.FC<EditableTextProps> = ({
    value,
    placeholder = "Add text...",
    isEditing,
    onSave,
    className,
    rows = 2
}) => {
    const [localValue, setLocalValue] = useState(value);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        if (status === 'saved') {
            const timer = setTimeout(() => setStatus('idle'), 2000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleSave = () => {
        if (localValue !== value) {
            setStatus('saving');
            onSave(localValue);
            // Assume save is fast/optimistic? 
            // Better to wait for parent? simpler: show saved shortly after formatting
            setTimeout(() => setStatus('saved'), 500);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.blur();
        }
    };

    if (!isEditing) {
        return (
            <p className={clsx("whitespace-pre-wrap text-slate-400", className)}>
                {value || <span className="italic opacity-50">No content.</span>}
            </p>
        );
    }

    return (
        <div className="relative group">
            <textarea
                className={clsx(
                    "w-full bg-white/5 border border-white/10 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-primary/50 resize-none placeholder-slate-600 transition-all font-sans leading-relaxed",
                    className
                )}
                placeholder={placeholder}
                rows={rows}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
            />
            <div className="absolute bottom-2 right-2 text-[10px] font-bold uppercase tracking-wider transition-opacity duration-300">
                {status === 'saving' && <span className="text-amber-400">Saving...</span>}
                {status === 'saved' && <span className="text-emerald-400">Saved</span>}
            </div>
        </div>
    );
};
