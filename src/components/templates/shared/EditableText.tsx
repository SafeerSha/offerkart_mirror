"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface EditableTextProps {
    value: string;
    onChange?: (val: string) => void;
    isEditable?: boolean;
    placeholder?: string;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function EditableText({
    value,
    onChange,
    isEditable = false,
    placeholder = "Enter text...",
    className,
    as = 'p'
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(value || "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setText(value || "");
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (text !== value && onChange) {
            onChange(text);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setText(value || "");
            setIsEditing(false);
        }
    };

    if (isEditable && isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={cn(
                    "bg-white/90 text-gray-900 border-2 border-orange-500 rounded px-1.5 py-0.5 outline-none w-full shadow-md z-30",
                    className
                )}
            />
        );
    }

    const Component = as;

    return (
        <Component
            onClick={() => {
                if (isEditable) setIsEditing(true);
            }}
            title={isEditable ? "Click to edit text" : undefined}
            className={cn(
                className,
                isEditable && "cursor-pointer hover:outline hover:outline-2 hover:outline-dashed hover:outline-orange-400 hover:outline-offset-2 rounded transition-all"
            )}
        >
            {text || placeholder}
        </Component>
    );
}
