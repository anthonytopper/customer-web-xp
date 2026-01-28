'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as BibleAPI from '@/lib/api/bible';

interface ChatToolListProps {
    onToolSelect?: (tool: BibleAPI.ChatTool | null) => void;
}

export function ChatToolList({ onToolSelect }: ChatToolListProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tools, setTools] = useState<BibleAPI.ChatTool[]>([]);
    const [selectedTool, setSelectedTool] = useState<BibleAPI.ChatTool | null>(null);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchTools() {
            try {
                const fetchedTools = await BibleAPI.getChatTools();
                setTools(fetchedTools);
            } catch (error) {
                console.error('Failed to fetch chat tools:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchTools();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleSelectTool = (tool: BibleAPI.ChatTool) => {
        setSelectedTool(tool);
        setIsOpen(false);
        onToolSelect?.(tool);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedTool(null);
        setIsOpen(false);
        onToolSelect?.(null);
    };

    if (loading) {
        return (
            <div className="relative">
                <button
                    disabled
                    className="px-4 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                >
                    Loading tools...
                </button>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Select chat tool"
                aria-expanded={isOpen}
            >
                <span className="min-w-[120px] text-left">
                    {selectedTool ? selectedTool.label : 'Select Tool'}
                </span>
                {selectedTool && (
                    <button
                        onClick={handleClear}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                        aria-label="Clear selection"
                    >
                        ×
                    </button>
                )}
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 max-h-60 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 overflow-y-auto">
                    {tools.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">No tools available</div>
                    ) : (
                        tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => handleSelectTool(tool)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                    selectedTool?.id === tool.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                            >
                                <div className="font-medium">{tool.label}</div>
                                {tool.description && (
                                    <div className="text-xs text-gray-500 mt-1">{tool.description}</div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
