import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertCircle, Clock, MessageSquare, X } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Tickets = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'MEDIUM', category: 'BUG' });
    const { user } = useAuthStore();

    const fetchTickets = async () => {
        try {
            const res = await api.get('/tickets/tickets/');
            setTickets(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/tickets/tickets/', newTicket);
            setTickets([res.data, ...tickets]);
            setIsCreateModalOpen(false);
            setNewTicket({ title: '', description: '', priority: 'MEDIUM', category: 'BUG' });
        } catch (err) { console.error(err); }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.ticket_number.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getPriorityColor = (p) => {
        switch (p) {
            case 'CRITICAL': return 'bg-[#EB5A46]';
            case 'HIGH': return 'bg-[#FF9F1A]';
            case 'MEDIUM': return 'bg-[#F2D600]';
            default: return 'bg-[#61BD4F]';
        }
    };

    const getStatusColor = (s) => {
        switch (s) {
            case 'RESOLVED': return 'bg-[#61BD4F] text-white';
            case 'IN_PROGRESS': return 'bg-[#0079BF] text-white';
            default: return 'bg-[#EBECF0] text-[#172B4D]';
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFBFC] p-6">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-[#172B4D] mb-1">Support Tickets</h1>
                    <p className="text-sm text-[#5E6C84]">Manage and track customer support requests</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="trello-btn trello-btn-primary">
                    <Plus size={16} />
                    <span>Create Ticket</span>
                </button>
            </header>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={16} />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        className="trello-input pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`trello-btn ${filterStatus === status ? 'trello-btn-primary' : 'trello-btn-secondary'}`}
                        >
                            {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white border border-[#DFE1E6] rounded-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#F4F5F7] border-b border-[#DFE1E6]">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-[#5E6C84] uppercase">Ticket</th>
                            <th className="px-4 py-3 text-xs font-semibold text-[#5E6C84] uppercase">Title</th>
                            <th className="px-4 py-3 text-xs font-semibold text-[#5E6C84] uppercase">Priority</th>
                            <th className="px-4 py-3 text-xs font-semibold text-[#5E6C84] uppercase">Status</th>
                            <th className="px-4 py-3 text-xs font-semibold text-[#5E6C84] uppercase">Category</th>
                            <th className="px-4 py-3 text-xs font-semibold text-[#5E6C84] uppercase">Submitted By</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFE1E6]">
                        {filteredTickets.map(ticket => (
                            <tr
                                key={ticket.id}
                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                className="hover:bg-[#F4F5F7] cursor-pointer transition-colors"
                            >
                                <td className="px-4 py-3 text-sm font-medium text-[#0079BF]">
                                    {ticket.ticket_number}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={14} className="text-[#5E6C84]" />
                                        <span className="text-sm text-[#172B4D] font-medium">{ticket.title}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className={`w-3 h-3 rounded-sm ${getPriorityColor(ticket.priority)}`} title={ticket.priority} />
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`trello-badge ${getStatusColor(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-[#5E6C84]">{ticket.category}</td>
                                <td className="px-4 py-3 text-sm text-[#5E6C84]">{ticket.submitted_by_username || 'Unknown'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredTickets.length === 0 && (
                    <div className="py-16 text-center">
                        <AlertCircle size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                        <p className="text-[#5E6C84]">No tickets found</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 animate-fade-in"
                    onClick={() => setIsCreateModalOpen(false)}
                >
                    <div className="trello-modal w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleCreateTicket}>
                            <div className="p-6 border-b border-[#DFE1E6]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-[#172B4D]">Create Ticket</h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="p-1 hover:bg-[#EBECF0] rounded-sm text-[#5E6C84] transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        className="trello-input"
                                        placeholder="Brief description of the issue..."
                                        value={newTicket.title}
                                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <textarea
                                        required
                                        className="trello-input min-h-[100px]"
                                        placeholder="Provide more details..."
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Category</label>
                                        <select
                                            className="trello-input"
                                            value={newTicket.category}
                                            onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                        >
                                            <option value="BUG">Bug</option>
                                            <option value="FEATURE">Feature Request</option>
                                            <option value="IT_SUPPORT">IT Support</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Priority</label>
                                        <select
                                            className="trello-input"
                                            value={newTicket.priority}
                                            onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-[#DFE1E6] flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="trello-btn trello-btn-subtle"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="trello-btn trello-btn-primary">
                                    Create Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets;
