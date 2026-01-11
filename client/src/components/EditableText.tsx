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
    isEditing: canEdit, // Renamed for clarity, implies permission
    onSave,
    className,
    rows = 2
}) => {
    const [localValue, setLocalValue] = useState(value);
    const [mode, setMode] = useState<'view' | 'edit'>('view');
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
            setTimeout(() => setStatus('saved'), 500);
        }
        setMode('view');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave(); // Trigger blur/save logic
        }
    };

    if (mode === 'view') {
        return (
            <div
                onClick={() => canEdit && setMode('edit')}
                className={clsx(
                    "whitespace-pre-wrap transition-colors duration-200 border border-transparent rounded px-1 -ml-1",
                    canEdit ? "cursor-pointer hover:bg-white/5 hover:border-white/5 group" : "",
                    !value && "italic opacity-50",
                    className
                )}
                title={canEdit ? "Click to edit" : undefined}
            >
                {value || placeholder}
                {canEdit && <span className="opacity-0 group-hover:opacity-30 text-[10px] ml-2 font-sans">✎</span>}
            </div>
        );
    }

    return (
        <div className="relative group animate-[fadeIn_0.1s_ease-out]">
            <textarea
                autoFocus
                className={clsx(
                    "w-full bg-slate-800 border-primary/50 text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary shadow-lg resize-none font-inherit leading-inherit",
                    // We don't pass 'className' here intended for text styling, 
                    // or maybe we should? The original passed 'text-lg' etc.
                    // Let's pass it but ensure bg/border overrides prevail.
                )}
                style={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    lineHeight: 'inherit',
                }}
                placeholder={placeholder}
                rows={rows}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                onFocus={(e) => e.currentTarget.select()}
            />
            <div className="absolute -bottom-5 right-0 text-[9px] font-bold uppercase tracking-wider bg-black/50 px-1 rounded text-slate-400">
                Enter to save
            </div>
        </div>
    );
};
