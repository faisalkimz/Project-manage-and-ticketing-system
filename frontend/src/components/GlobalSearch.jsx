import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    X,
    Briefcase,
    CheckCircle2,
    User,
    ChevronRight,
    Command,
    Sparkles,
    ArrowUpRight,
    SearchSlash as NoResults,
    Zap,
    Box,
    Layers
} from 'lucide-react';
import api from '../services/api';

const GlobalSearch = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ tasks: [], projects: [], people: [] });
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setResults({ tasks: [], projects: [], people: [] });
            setActiveIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) {
                setResults({ tasks: [], projects: [], people: [] });
                return;
            }
            setLoading(true);
            try {
                const res = await api.get(`/users/search/?q=${query}`);
                setResults(res.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Flatten results for keyboard navigation
    const flatResults = [
        ...results.projects.map(p => ({ ...p, type: 'Project' })),
        ...results.tasks.map(t => ({ ...t, type: 'Task' })),
        ...results.people.map(u => ({ ...u, type: 'Person' }))
    ];

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % (flatResults.length || 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + flatResults.length) % (flatResults.length || 1));
        } else if (e.key === 'Enter') {
            if (flatResults[activeIndex]) {
                handleSelect(flatResults[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleSelect = (item) => {
        onClose();
        if (item.type === 'Project') navigate(`/projects/${item.id}`);
        else if (item.type === 'Task') navigate(`/projects/${item.project}?task=${item.id}`);
        else if (item.type === 'Person') navigate('/team');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-6 animate-fade-in" onKeyDown={handleKeyDown}>
            {/* Ultra-soft Backdrop */}
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-2xl" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.15)] border border-white/20 overflow-hidden animate-slide-up">
                {/* Search Bar Canvas */}
                <div className="relative flex items-center h-24 px-10 border-b border-zinc-50 bg-[#FDFCFB]/50">
                    <div className="w-12 h-12 flex items-center justify-center text-zinc-300">
                        {loading ? <Zap size={28} className="animate-pulse text-indigo-500" /> : <Search size={28} strokeWidth={1.5} />}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search initiatives, tasks, or teammates..."
                        className="flex-1 h-full bg-transparent border-none outline-none text-xl font-serif italic text-zinc-900 placeholder:text-zinc-200 px-6"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center gap-2">
                            <span className="text-[10px] font-bold text-zinc-400">ESC</span>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-white rounded-2xl transition-all shadow-sm">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Results Storyboard */}
                <div className="max-h-[60vh] overflow-y-auto p-10 custom-scrollbar bg-white">
                    {query.length < 2 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center text-zinc-100">
                                <Sparkles size={40} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xl font-serif italic text-zinc-400">Discover your workspace</p>
                                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest leading-relaxed">Type to find what you're looking for</p>
                            </div>
                        </div>
                    ) : flatResults.length === 0 && !loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                            <NoResults size={48} className="text-zinc-100" />
                            <p className="text-lg font-serif italic text-zinc-300">Nothing found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {flatResults.map((item, index) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => handleSelect(item)}
                                    className={`group flex items-center gap-6 p-6 rounded-[2.5rem] transition-all cursor-pointer ${activeIndex === index
                                            ? 'bg-zinc-900 text-white shadow-2xl scale-[1.02]'
                                            : 'hover:bg-zinc-50/50 grayscale hover:grayscale-0'
                                        }`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${activeIndex === index ? 'bg-white/10' : 'bg-zinc-50 border border-zinc-100 text-zinc-300'
                                        }`}>
                                        {item.type === 'Project' && <Layers size={24} strokeWidth={1.5} />}
                                        {item.type === 'Task' && <Briefcase size={24} strokeWidth={1.5} />}
                                        {item.type === 'Person' && <User size={24} strokeWidth={1.5} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${activeIndex === index ? 'text-indigo-400' : 'text-zinc-300'}`}>
                                                {item.type}
                                            </span>
                                            {item.status && (
                                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${activeIndex === index ? 'border-white/20 bg-white/10' : 'border-zinc-100 bg-zinc-50 text-zinc-400'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className={`text-xl font-serif italic tracking-tight mt-1 truncate ${activeIndex === index ? 'text-white' : 'text-zinc-900'}`}>
                                            {item.name || item.title || item.username}
                                        </h4>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeIndex === index ? 'bg-white/10 text-white' : 'text-zinc-100 opacity-0'
                                        }`}>
                                        <ArrowUpRight size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Command Footer */}
                <div className="px-10 py-6 border-t border-zinc-50 bg-[#FDFCFB]/50 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 text-zinc-400">
                            <div className="px-2 py-1 bg-white border border-zinc-100 rounded-lg text-[9px] font-bold">↑↓</div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Navigate</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-400">
                            <div className="px-2 py-1 bg-white border border-zinc-100 rounded-lg text-[9px] font-bold">ENTER</div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Select</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Command size={14} className="text-zinc-200" />
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">Mbabali Studio Portal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
