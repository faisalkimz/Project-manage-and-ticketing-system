import React, { useState } from 'react';
import { Bold, Italic, Code, List, Eye, Edit3, AtSign, Link as LinkIcon } from 'lucide-react';

const RichTextEditor = ({
    value = '',
    onChange,
    placeholder = 'Add a detailed description (Markdown supported)...',
    members = [],
    minHeight = '110px'
}) => {
    const [mode, setMode] = useState('edit'); // 'edit' | 'preview'
    const [showMentionPicker, setShowMentionPicker] = useState(false);

    const insertFormatting = (prefix, suffix = '') => {
        const textarea = document.getElementById('rich-text-textarea');
        if (!textarea) {
            onChange(value + prefix + suffix);
            return;
        }
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const selected = value.substring(start, end);
        const replacement = prefix + (selected || 'text') + suffix;
        const newValue = value.substring(0, start) + replacement + value.substring(end);
        onChange(newValue);
    };

    const insertMention = (username) => {
        onChange((value ? value + ' ' : '') + `@${username} `);
        setShowMentionPicker(false);
    };

    // Lightweight markdown parser for preview
    const renderMarkdown = (text) => {
        if (!text) return '<p class="text-[#5E6C84] italic">No description provided.</p>';
        let html = text
            // Escape HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre class="bg-[#091E420F] p-3 rounded font-mono text-xs my-2 overflow-x-auto">$1</pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="bg-[#091E420F] px-1.5 py-0.5 rounded font-mono text-xs text-[#E5493A]">$1</code>')
            // Bold
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Mentions
            .replace(/@([a-zA-Z0-9_]+)/g, '<span class="bg-[#DEEBFF] text-[#0052CC] font-bold px-1.5 py-0.5 rounded text-xs">@$1</span>')
            // Bullet lists
            .replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
            // Line breaks
            .replace(/\n/g, '<br/>');

        return html;
    };

    return (
        <div className="border border-[#DFE1E6] rounded-md overflow-hidden bg-white focus-within:border-[#0052CC] transition-colors">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-1.5 bg-[#FAFBFC] border-b border-[#DFE1E6] text-xs">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => insertFormatting('**', '**')}
                        className="p-1.5 hover:bg-[#EBECF0] rounded text-[#42526E]"
                        title="Bold (**text**)"
                    >
                        <Bold size={13} />
                    </button>
                    <button
                        type="button"
                        onClick={() => insertFormatting('*', '*')}
                        className="p-1.5 hover:bg-[#EBECF0] rounded text-[#42526E]"
                        title="Italic (*text*)"
                    >
                        <Italic size={13} />
                    </button>
                    <button
                        type="button"
                        onClick={() => insertFormatting('`', '`')}
                        className="p-1.5 hover:bg-[#EBECF0] rounded text-[#42526E]"
                        title="Inline Code (`code`)"
                    >
                        <Code size={13} />
                    </button>
                    <button
                        type="button"
                        onClick={() => insertFormatting('```\n', '\n```')}
                        className="px-1.5 py-0.5 hover:bg-[#EBECF0] rounded text-[11px] font-mono text-[#42526E]"
                        title="Code Block"
                    >
                        &lt;/&gt;
                    </button>
                    <button
                        type="button"
                        onClick={() => insertFormatting('\n- ')}
                        className="p-1.5 hover:bg-[#EBECF0] rounded text-[#42526E]"
                        title="Bullet List (- item)"
                    >
                        <List size={13} />
                    </button>
                    <div className="h-4 w-px bg-[#DFE1E6] mx-1" />
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowMentionPicker(!showMentionPicker)}
                            className="p-1.5 hover:bg-[#EBECF0] rounded text-[#0052CC] flex items-center gap-1 font-bold"
                            title="@Mention user"
                        >
                            <AtSign size={13} />
                        </button>
                        {showMentionPicker && members.length > 0 && (
                            <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-[#DFE1E6] shadow-lg rounded-md py-1 z-30">
                                <span className="text-[10px] uppercase font-bold text-[#5E6C84] px-3 py-1 block">Mention user</span>
                                {members.map((m, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => insertMention(m.username)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-[#172B4D] hover:bg-[#F4F5F7] flex items-center gap-1.5"
                                    >
                                        <span className="w-4 h-4 rounded-full bg-[#0052CC] text-white text-[9px] font-bold flex items-center justify-center">
                                            {m.username[0].toUpperCase()}
                                        </span>
                                        <span>@{m.username}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex bg-[#EBECF0] p-0.5 rounded">
                    <button
                        type="button"
                        onClick={() => setMode('edit')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${mode === 'edit' ? 'bg-white text-[#0052CC] shadow-xs' : 'text-[#5E6C84]'}`}
                    >
                        <Edit3 size={11} /> Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('preview')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${mode === 'preview' ? 'bg-white text-[#0052CC] shadow-xs' : 'text-[#5E6C84]'}`}
                    >
                        <Eye size={11} /> Preview
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {mode === 'edit' ? (
                <textarea
                    id="rich-text-textarea"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full p-3 text-sm text-[#172B4D] outline-none resize-none bg-white font-sans"
                    style={{ minHeight }}
                />
            ) : (
                <div
                    className="p-3 text-sm text-[#172B4D] leading-relaxed overflow-y-auto bg-white custom-scrollbar prose prose-sm max-w-none"
                    style={{ minHeight }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
                />
            )}
        </div>
    );
};

export default RichTextEditor;

