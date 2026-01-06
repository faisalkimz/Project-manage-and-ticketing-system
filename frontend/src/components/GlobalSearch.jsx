import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, X, Briefcase, User, Layers, ArrowRight, Loader
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
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 p-4 animate-fade-in" onKeyDown={handleKeyDown}>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-sm shadow-2xl animate-scale-in flex flex-col max-h-[80vh] overflow-hidden">
                {/* Search Header */}
                <div className="flex items-center p-4 border-b border-[#DFE1E6]">
                    <Search className="text-[#5E6C84] mr-3 shrink-0" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search boards, tasks, or members..."
                        className="flex-1 text-[#172B4D] placeholder-[#5E6C84] outline-none text-base bg-transparent font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {loading && <Loader size={16} className="text-[#0079BF] animate-spin mr-3" />}
                    <button onClick={onClose} className="p-1 hover:bg-[#EBECF0] rounded-sm text-[#5E6C84] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Results List */}
                <div className="overflow-y-auto p-2 custom-scrollbar bg-[#F4F5F7]">
                    {query.length < 2 && (
                        <div className="p-8 text-center text-[#5E6C84]">
                            <p className="text-sm">Type to search...</p>
                        </div>
                    )}

                    {query.length >= 2 && flatResults.length === 0 && !loading && (
                        <div className="p-8 text-center text-[#5E6C84]">
                            <p className="text-sm">No results found.</p>
                        </div>
                    )}

                    <div className="space-y-1">
                        {flatResults.map((item, index) => (
                            <button
                                key={`${item.type}-${item.id}`}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => handleSelect(item)}
                                className={`w-full flex items-center gap-3 p-3 text-left rounded-sm transition-colors ${activeIndex === index
                                        ? 'bg-[#E4F0F6] text-[#0079BF]'
                                        : 'bg-white hover:bg-[#FAFBFC] text-[#172B4D] border border-transparent hover:border-[#DFE1E6]'
                                    } shadow-sm`}
                            >
                                <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${activeIndex === index ? 'bg-[#0079BF] text-white' : 'bg-[#EBECF0] text-[#5E6C84]'
                                    }`}>
                                    {item.type === 'Project' && <Layers size={16} />}
                                    {item.type === 'Task' && <Briefcase size={16} />}
                                    {item.type === 'Person' && <User size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={`text-xs font-bold uppercase ${activeIndex === index ? 'text-[#0079BF]' : 'text-[#5E6C84]'}`}>
                                            {item.type}
                                        </span>
                                        {item.status && (
                                            <span className="text-[10px] font-semibold bg-[#EBECF0] text-[#5E6C84] px-1.5 py-0.5 rounded-sm uppercase">
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-semibold truncate">{item.name || item.title || item.username}</h4>
                                </div>
                                {activeIndex === index && <ArrowRight size={16} className="shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-[#EBECF0] border-t border-[#DFE1E6] flex items-center justify-between text-xs text-[#5E6C84]">
                    <div className="flex gap-4">
                        <span><strong className="px-1 bg-white rounded border border-[#C1C7D0]">↑↓</strong> Navigate</span>
                        <span><strong className="px-1 bg-white rounded border border-[#C1C7D0]">↵</strong> Select</span>
                    </div>
                    <span>ESC to close</span>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
