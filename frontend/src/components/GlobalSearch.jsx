import { useState, useEffect } from 'react';
import { Search, X, Folder, Ticket, User, Command, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const GlobalSearch = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ tasks: [], projects: [], people: [] });
    const navigate = useNavigate();

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSelect = (type, id) => {
        if (type === 'task') navigate(`/projects`); // For now redirect to project
        if (type === 'project') navigate(`/projects/${id}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh] bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                    <Search className="text-slate-400 shrink-0" size={20} />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search for tasks, projects, or team members..."
                        className="flex-1 text-lg border-none outline-none text-slate-900 placeholder:text-slate-300 py-1"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-400 font-bold text-[10px]">
                        <Command size={10} /> K
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                    {query.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <Search size={32} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">What are you looking for?</p>
                                <p className="text-sm text-slate-400">Search across your entire workspace in real-time.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Mock results based on query for demo */}
                            <section>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Tasks (3)</h3>
                                <div className="space-y-1">
                                    {['Orphan Task', 'Implement Navigation Component', 'Fix Responsive Issues'].map((t, i) => (
                                        <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group text-left transition-all border border-transparent hover:border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Ticket size={16} /></div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{t}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Updated 2 days ago • High Priority</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={16} />
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">People (2)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Alice Engineer', 'Bob Designer'].map((p, i) => (
                                        <button key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all text-left">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                                                {p.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{p}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{p.split(' ')[1]}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><Command size={10} className="mt-[-2px]" /> S Save</span>
                        <span className="flex items-center gap-1">↑↓ Navigate</span>
                        <span className="flex items-center gap-1">Enter Select</span>
                    </div>
                    <button onClick={onClose} className="hover:text-slate-600">Close</button>
                </div>
            </div>

            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default GlobalSearch;
