import { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, MoreHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Tickets = () => {
    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'MEDIUM', category: 'BUG' });
    const { user } = useAuthStore();

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/tickets/tickets/');
            setTickets(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/tickets/tickets/', newTicket);
            setTickets([...tickets, res.data]);
            setIsCreateModalOpen(false);
            setNewTicket({ title: '', description: '', priority: 'MEDIUM', category: 'BUG' });
        } catch (err) {
            console.error(err);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.ticket_number.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const priorityColor = (p) => {
        switch (p) {
            case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
            case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            default: return 'text-zinc-600 bg-zinc-50 border-zinc-200';
        }
    };

    const statusIcon = (s) => {
        switch (s) {
            case 'OPEN': return <AlertCircle size={14} className="text-zinc-500" />;
            case 'IN_PROGRESS': return <Clock size={14} className="text-amber-500" />;
            case 'RESOLVED': return <CheckCircle2 size={14} className="text-emerald-500" />;
            default: return <Clock size={14} className="text-zinc-400" />;
        }
    };

    return (
        <div className="layout-container p-6 animate-fade-in space-y-6">
            <header className="flex justify-between items-center pb-6 border-b border-zinc-200">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Tickets</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage support requests and issues.</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
                    <Plus size={16} /> New Ticket
                </button>
            </header>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        className="input-field pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${filterStatus === status
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                                }`}
                        >
                            {status === 'ALL' ? 'All View' : status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium select-none">
                        <tr>
                            <th className="px-6 py-3 w-32">ID</th>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3 w-32">Status</th>
                            <th className="px-6 py-3 w-32">Priority</th>
                            <th className="px-6 py-3 w-40">Submitted By</th>
                            <th className="px-6 py-3 w-40 text-right">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {filteredTickets.map(ticket => (
                            <tr key={ticket.id} className="group hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/tickets/${ticket.id}`}>
                                <td className="px-6 py-3.5 font-mono text-xs text-zinc-500">
                                    {ticket.ticket_number}
                                </td>
                                <td className="px-6 py-3.5 font-medium text-zinc-900">
                                    {ticket.title}
                                    <div className="text-xs text-zinc-400 font-normal mt-0.5 line-clamp-1">{ticket.description}</div>
                                </td>
                                <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-2">
                                        {statusIcon(ticket.status)}
                                        <span className="text-xs font-medium text-zinc-700">{ticket.status.replace('_', ' ')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${priorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                                            {ticket.submitted_by_username?.[0]?.toUpperCase()}
                                        </div>
                                        <span className="text-xs text-zinc-600">{ticket.submitted_by_username}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono text-xs text-zinc-400">
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {filteredTickets.length === 0 && (
                            <tr>
                                <td colSpan="6" className="py-12 text-center text-zinc-400">No tickets found matching your filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h3 className="font-semibold text-zinc-900">Create New Ticket</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Title</label>
                                <input type="text" required className="input-field" placeholder="Brief summary of the issue"
                                    value={newTicket.title} onChange={e => setNewTicket({ ...newTicket, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Category</label>
                                    <select className="input-field" value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}>
                                        <option value="BUG">Bug Report</option>
                                        <option value="FEATURE">Feature Request</option>
                                        <option value="IT_SUPPORT">IT Support</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Priority</label>
                                    <select className="input-field" value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Description</label>
                                <textarea required rows="4" className="input-field resize-none" placeholder="Detailed description..."
                                    value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets;
