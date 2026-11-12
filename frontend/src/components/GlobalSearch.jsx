import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, X, Briefcase, User, Layers, ArrowRight, Loader,
    MessageSquare, BookOpen, Clock, Tag, Sparkles
} from 'lucide-react';
import api from '../services/api';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'projects', label: 'Projects', icon: Layers },
    { id: 'tasks', label: 'Tasks', icon: Briefcase },
    { id: 'tickets', label: 'Tickets', icon: MessageSquare },
    { id: 'knowledge', label: 'Wiki & Docs', icon: BookOpen },
    { id: 'users', label: 'Team', icon: User },
];

const GlobalSearch = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [results, setResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('omni_recent_searches') || '[]');
            setRecentSearches(saved);
        } catch (e) {
            setRecentSearches([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setResults([]);
            setActiveIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const res = await api.get('/search/search/', {
                    params: { q: query.trim(), type: category }
                });
                setResults(res.data || []);
                setActiveIndex(0);
            } catch (err) {
                console.error('Search query failed:', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 250);
        return () => clearTimeout(timer);
    }, [query, category]);

    const saveRecentSearch = (text) => {
        try {
            const updated = [text, ...recentSearches.filter(s => s !== text)].slice(0, 6);
            setRecentSearches(updated);
            localStorage.setItem('omni_recent_searches', JSON.stringify(updated));
        } catch (e) { }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % (results.length || 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + results.length) % (results.length || 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[activeIndex]) {
                handleSelect(results[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleSelect = (item) => {
        if (query.trim()) saveRecentSearch(query.trim());
        onClose();
        if (item.url) {
            navigate(item.url);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'PROJECT': return <Layers size={16} className="text-blue-600" />;
            case 'TASK': return <Briefcase size={16} className="text-indigo-600" />;
            case 'TICKET': return <MessageSquare size={16} className="text-amber-600" />;
            case 'USER': return <User size={16} className="text-emerald-600" />;
            case 'DOCUMENT':
            case 'WIKI': return <BookOpen size={16} className="text-purple-600" />;
            default: return <Tag size={16} className="text-slate-500" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 p-4 animate-fade-in"
            onKeyDown={handleKeyDown}
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Dialog */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[80vh] animate-scale-in">
                {/* Search Bar */}
                <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
                    <Search className="text-slate-400 shrink-0" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search tasks, boards, tickets, wiki docs, or members..."
                        className="flex-1 text-slate-800 placeholder-slate-400 outline-none text-base bg-transparent font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {loading && <Loader size={18} className="text-indigo-600 animate-spin shrink-0" />}
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                                category === cat.id
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="overflow-y-auto p-3 bg-white flex-1 min-h-[220px]">
                    {/* Empty Query: Recent Searches */}
                    {query.trim().length < 2 && (
                        <div className="p-4 space-y-4">
                            {recentSearches.length > 0 ? (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Recent Searches
                                        </span>
                                        <button
                                            onClick={() => {
                                                localStorage.removeItem('omni_recent_searches');
                                                setRecentSearches([]);
                                            }}
                                            className="text-[11px] text-slate-400 hover:text-slate-600"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {recentSearches.map((term, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setQuery(term)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium rounded-lg transition"
                                            >
                                                <Clock size={12} className="text-slate-400" />
                                                <span>{term}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm font-medium text-slate-600">Quick Global Command Search</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Type at least 2 characters to search across all workspaces, sprints, tickets, and docs.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results Found */}
                    {query.trim().length >= 2 && results.length > 0 && (
                        <div className="space-y-1">
                            {results.map((item, index) => (
                                <button
                                    key={`${item.type}-${item.id}-${index}`}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => handleSelect(item)}
                                    className={`w-full flex items-center gap-3 p-3 text-left rounded-xl transition ${
                                        activeIndex === index
                                            ? 'bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-200'
                                            : 'hover:bg-slate-50 text-slate-800'
                                    }`}
                                >
                                    <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                                        {getTypeIcon(item.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <h4 className="text-sm font-bold truncate text-slate-900">
                                                {item.title}
                                            </h4>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                {item.type}
                                            </span>
                                        </div>
                                        {item.preview && (
                                            <p className="text-xs text-slate-400 truncate">
                                                {item.preview}
                                            </p>
                                        )}
                                    </div>
                                    {activeIndex === index && (
                                        <ArrowRight size={16} className="text-indigo-600 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {query.trim().length >= 2 && results.length === 0 && !loading && (
                        <div className="text-center py-12 text-slate-400">
                            <p className="text-sm font-medium text-slate-600">No results found for "{query}"</p>
                            <p className="text-xs text-slate-400 mt-1">Try selecting a different category or searching another term.</p>
                        </div>
                    )}
                </div>

                {/* Footer with Keyboard Hints */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] shadow-2xs font-sans">↑↓</kbd> Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] shadow-2xs font-sans">↵</kbd> Select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] shadow-2xs font-sans">ESC</kbd> Close
                        </span>
                    </div>
                    <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                        <Sparkles size={12} /> Instant Indexing
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
