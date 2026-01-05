import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MessageSquare, Clock, Hash, MoreVertical, Paperclip, ChevronRight, X, Tag as TagIcon } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: '', description: '', category: 'OTHER', priority: 'MEDIUM' });
    const [availableTags, setAvailableTags] = useState([]);
    const [newTag, setNewTag] = useState({ name: '', color: '#6366F1' });
    const { user } = useAuthStore();

    const fetchTickets = async () => {
        try {
            const response = await api.get('/tickets/tickets/');
            setTickets(response.data);
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        }
    };

    const fetchTags = async () => {
        try {
            const response = await api.get('/projects/tags/');
            setAvailableTags(response.data);
        } catch (error) {
            console.error('Failed to fetch tags', error);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchTags();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tickets/tickets/', newTicket);
            setIsModalOpen(false);
            setNewTicket({ title: '', description: '', category: 'OTHER', priority: 'MEDIUM' });
            fetchTickets();
        } catch (error) {
            console.error('Failed to create ticket', error);
        }
    };

    const handleCreateTag = async () => {
        if (!newTag.name.trim()) return;
        try {
            await api.post('/projects/tags/', newTag);
            setNewTag({ name: '', color: '#6366F1' });
            fetchTags();
        } catch (error) {
            console.error('Failed to create tag', error);
        }
    };

    const handleDeleteTag = async (id) => {
        try {
            await api.delete(`/projects/tags/${id}/`);
            fetchTags();
        } catch (error) {
            console.error('Failed to delete tag', error);
        }
    };

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'CRITICAL': return 'bg-red-50 text-red-600 border-red-100';
            case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'MEDIUM': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in bg-slate-50/30 min-h-screen">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                        <Hash size={12} /> Support Center
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Support Tickets</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and track your service requests efficiently.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsTagsModalOpen(true)}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-xs shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-all"
                    >
                        <TagIcon size={16} className="inline mr-2" /> Manage Tags
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} /> Create Ticket
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
                <div className="p-6 bg-white border-b border-slate-50 flex gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search tickets by title, ID or submitter..."
                            className="w-full pl-12 pr-6 py-3 bg-slate-50/50 border-transparent focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-50 rounded-2xl text-sm font-medium transition-all outline-none"
                        />
                    </div>
                    <button className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 font-bold text-xs flex items-center gap-2 hover:bg-white hover:border-slate-200 transition-all">
                        <Filter size={18} /> Filters
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[40%]">Ticket Intelligence</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Flow</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgency</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {tickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-indigo-50/20 transition-all group">
                                    <td className="px-8 py-6">
                                        <Link to={`/tickets/${ticket.id}`} className="block">
                                            <p className="text-[10px] font-black text-indigo-500 mb-1.5 tracking-[0.1em] uppercase">{ticket.ticket_number}</p>
                                            <h4 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight text-base mb-2">{ticket.title}</h4>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    <Clock size={12} strokeWidth={3} /> {new Date(ticket.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    <User size={12} strokeWidth={3} /> {ticket.submitted_by_details?.username}
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest shadow-sm ${ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                ticket.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest shadow-sm ${getPriorityStyle(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link to={`/tickets/${ticket.id}`} className="w-10 h-10 bg-slate-50 text-slate-400 p-2.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center justify-center border border-transparent hover:border-indigo-100">
                                                <ChevronRight size={18} strokeWidth={3} />
                                            </Link>
                                            <button className="w-10 h-10 bg-slate-50 text-slate-400 p-2.5 hover:text-slate-900 hover:bg-white rounded-xl transition-all flex items-center justify-center border border-transparent hover:border-slate-100">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ticket Creation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
                        <div className="p-10 border-b border-slate-50 bg-slate-50/50">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">Post Ticket</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Our support team will review this shortly.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Subject</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-2xl py-4 px-6 text-sm font-bold shadow-sm transition-all outline-none"
                                    placeholder="Issue summary..."
                                    value={newTicket.title}
                                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Context</label>
                                <textarea
                                    className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-2xl py-4 px-6 text-sm font-medium shadow-sm transition-all outline-none min-h-[120px] resize-none"
                                    placeholder="Detailed reports help us help you faster..."
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Category</label>
                                    <select
                                        className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl py-4 px-6 text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
                                        value={newTicket.category}
                                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                    >
                                        <option value="BUG">Bug Protocol</option>
                                        <option value="FEATURE">Feature Request</option>
                                        <option value="IT_SUPPORT">Internal IT</option>
                                        <option value="OTHER">Generic Query</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Priority</label>
                                    <select
                                        className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl py-4 px-6 text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
                                        value={newTicket.priority}
                                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                    >
                                        <option value="LOW">Low Alert</option>
                                        <option value="MEDIUM">Standard</option>
                                        <option value="HIGH">High Alert</option>
                                        <option value="CRITICAL">Critical Exit</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">Abort</button>
                                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Submit Support Case</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Tags Modal (Matching Image 4) */}
            {isTagsModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-slide-up">
                        <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm"><Hash size={20} strokeWidth={3} /></div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Tag Management</h2>
                            </div>
                            <button onClick={() => setIsTagsModalOpen(false)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X size={24} /></button>
                        </header>

                        <div className="p-10 space-y-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Create Meta Identifier</label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1 group">
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 rounded-2xl py-4 px-6 text-sm font-bold shadow-sm transition-all outline-none"
                                            placeholder="Tag name..."
                                            value={newTag.name}
                                            onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                                        />
                                        <input
                                            type="color"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-transparent border-none outline-none cursor-pointer"
                                            value={newTag.color}
                                            onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                                        />
                                    </div>
                                    <button onClick={handleCreateTag} className="px-6 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center">Add</button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Active Library ({availableTags.length})</label>
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Select to Delete</span>
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {availableTags.map((tag) => (
                                        <div key={tag.id} className="px-4 py-2.5 rounded-2xl border border-slate-100 bg-white text-[10px] font-black text-slate-600 flex items-center gap-3 group cursor-default shadow-sm hover:border-red-200 transition-all">
                                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: tag.color }}></div>
                                            <span style={{ color: tag.color }}>{tag.name}</span>
                                            <button onClick={() => handleDeleteTag(tag.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14} strokeWidth={4} /></button>
                                        </div>
                                    ))}
                                    {availableTags.length === 0 && (
                                        <p className="text-xs text-slate-300 font-medium italic py-4 w-full text-center">No metadata identifiers initialized.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <footer className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setIsTagsModalOpen(false)} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Sync Library</button>
                        </footer>
                    </div>
                </div>
            )}

            <style jsx="true">{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};

export default Tickets;
