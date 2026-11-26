import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, AlertCircle, Clock, MessageSquare, X,
    Sparkles, Loader2, Check, Shield, TrendingUp, AlertTriangle,
    CheckCircle2, BarChart2, Activity, Timer, Zap, Inbox, Users, Trash2
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/Toast';

const Tickets = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'sla' | 'queues'
    const [queues, setQueues] = useState([]);
    const [users, setUsers] = useState([]);
    const [filterQueue, setFilterQueue] = useState('ALL');
    const [showQueueModal, setShowQueueModal] = useState(false);
    const [newQueue, setNewQueue] = useState({ name: '', description: '', is_default: false, auto_assign: true, assigned_users: [] });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'MEDIUM', category: 'BUG', queue: '' });
    const [isTriaging, setIsTriaging] = useState(false);
    const [aiTriageResult, setAiTriageResult] = useState(null);
    const [slaLoading, setSlaLoading] = useState(false);
    const [isEscalating, setIsEscalating] = useState(false);
    const { user } = useAuthStore();

    const fetchTickets = async () => {
        try {
            const res = await api.get('/tickets/tickets/');
            setTickets(res.data?.results || res.data || []);
        } catch (err) { console.error(err); }
    };

    const handleAutoEscalate = async () => {
        try {
            setIsEscalating(true);
            const res = await api.post('/tickets/tickets/auto-escalate/', {});
            showToast(res.data.message || 'SLA breach auto-escalation completed!', 'success');
            fetchTickets();
        } catch (err) {
            console.error('Failed to auto-escalate breached tickets', err);
            showToast('Failed to execute auto-escalation engine', 'error');
        } finally {
            setIsEscalating(false);
        }
    };

    const fetchQueues = async () => {
        try {
            const res = await api.get('/tickets/queues/');
            setQueues(res.data?.results || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/list/');
            setUsers(res.data?.results || res.data || []);
        } catch (err) { console.error(err); }
    };

    const handleCreateQueue = async (e) => {
        e.preventDefault();
        if (!newQueue.name.trim()) return;
        try {
            const res = await api.post('/tickets/queues/', newQueue);
            setQueues(prev => [...prev, res.data]);
            setNewQueue({ name: '', description: '', is_default: false, auto_assign: true, assigned_users: [] });
            setShowQueueModal(false);
            showToast('Ticket queue created!', 'success');
        } catch (err) {
            showToast('Failed to create queue', 'error');
        }
    };

    const handleToggleQueueAutoAssign = async (queue) => {
        try {
            const res = await api.patch(`/tickets/queues/${queue.id}/`, { auto_assign: !queue.auto_assign });
            setQueues(prev => prev.map(q => q.id === queue.id ? res.data : q));
            showToast(`Auto-assign ${res.data.auto_assign ? 'enabled' : 'disabled'} for ${queue.name}`, 'info');
        } catch (err) {
            showToast('Failed to update queue', 'error');
        }
    };

    const handleDeleteQueue = async (queueId) => {
        try {
            await api.delete(`/tickets/queues/${queueId}/`);
            setQueues(prev => prev.filter(q => q.id !== queueId));
            showToast('Queue deleted', 'info');
        } catch (err) {
            showToast('Failed to delete queue', 'error');
        }
    };

    useEffect(() => { fetchTickets(); fetchQueues(); fetchUsers(); }, []);

    const handleAiTriage = async () => {
        if (!newTicket.title) { showToast('Enter a ticket title first', 'info'); return; }
        setIsTriaging(true);
        try {
            const res = await api.post('/ai/prioritize-ticket/', {
                title: newTicket.title,
                description: newTicket.description || '',
                customer_tier: 'ENTERPRISE'
            });
            const data = res.data;
            setAiTriageResult(data);
            setNewTicket(prev => ({
                ...prev,
                priority: data.priority || prev.priority,
                category: data.category === 'BUG' ? 'BUG' : data.category === 'FEATURE' ? 'FEATURE' : 'IT_SUPPORT'
            }));
            showToast(`AI prioritized as ${data.priority}!`, 'success');
        } catch (err) {
            showToast('AI Triage failed', 'error');
        } finally {
            setIsTriaging(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newTicket };
            if (!payload.queue) delete payload.queue;
            const res = await api.post('/tickets/tickets/', payload);
            setTickets([res.data, ...tickets]);
            setIsCreateModalOpen(false);
            setNewTicket({ title: '', description: '', priority: 'MEDIUM', category: 'BUG', queue: '' });
            setAiTriageResult(null);
            showToast(
                res.data.assigned_to_username
                    ? `Ticket created & auto-assigned to ${res.data.assigned_to_username}!`
                    : 'Ticket created successfully!',
                'success'
            );
        } catch (err) {
            showToast('Failed to create ticket', 'error');
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase()) ||
            t.ticket_number?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        const matchesQueue = filterQueue === 'ALL' || String(t.queue) === String(filterQueue);
        return matchesSearch && matchesStatus && matchesQueue;
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

    // ─── SLA Analytics helpers ───────────────────────────────────────────────
    const computeSLAMetrics = () => {
        const resolved = tickets.filter(t => t.status === 'RESOLVED' && t.resolved_at);
        const open = tickets.filter(t => t.status !== 'RESOLVED');
        const breached = tickets.filter(t => t.sla_breached);
        const critical = tickets.filter(t => t.priority === 'CRITICAL' && t.status !== 'RESOLVED');

        const avgResolutionHrs = resolved.length > 0
            ? resolved.reduce((sum, t) => {
                const created = new Date(t.created_at);
                const resolved_at = new Date(t.resolved_at);
                return sum + (resolved_at - created) / 3600000;
            }, 0) / resolved.length
            : null;

        const breachRate = tickets.length > 0 ? Math.round((breached.length / tickets.length) * 100) : 0;

        return { resolved, open, breached, critical, avgResolutionHrs, breachRate };
    };

    const sla = computeSLAMetrics();

    // Priority distribution
    const priorityDist = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => ({
        label: p,
        count: tickets.filter(t => t.priority === p).length,
        color: { CRITICAL: '#EB5A46', HIGH: '#FF9F1A', MEDIUM: '#F2D600', LOW: '#61BD4F' }[p]
    }));

    // Status distribution
    const statusDist = [
        { label: 'Open', count: tickets.filter(t => t.status === 'OPEN').length, color: '#DFE1E6' },
        { label: 'In Progress', count: tickets.filter(t => t.status === 'IN_PROGRESS').length, color: '#0079BF' },
        { label: 'Resolved', count: tickets.filter(t => t.status === 'RESOLVED').length, color: '#61BD4F' },
        { label: 'Closed', count: tickets.filter(t => t.status === 'CLOSED').length, color: '#42526E' },
    ];

    return (
        <div className="min-h-screen bg-[#FAFBFC] p-4 md:p-6 pb-24 md:pb-6">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#172B4D] mb-0.5">Support Tickets</h1>
                    <p className="text-sm text-[#5E6C84]">Manage support requests with SLA compliance</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-md text-sm font-bold shadow-sm transition-all">
                    <Plus size={16} /> Create Ticket
                </button>
            </header>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#DFE1E6] w-fit mb-6 shadow-sm">
                <button onClick={() => setActiveTab('tickets')} className={`px-4 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'tickets' ? 'bg-[#0052CC] text-white' : 'text-[#5E6C84] hover:bg-[#F4F5F7]'}`}>
                    <MessageSquare size={14} /> Tickets
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'tickets' ? 'bg-white/20' : 'bg-[#EBECF0]'}`}>{tickets.length}</span>
                </button>
                <button onClick={() => setActiveTab('sla')} className={`px-4 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sla' ? 'bg-[#0052CC] text-white' : 'text-[#5E6C84] hover:bg-[#F4F5F7]'}`}>
                    <Shield size={14} /> SLA Dashboard
                    {sla.breached.length > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'sla' ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>{sla.breached.length}</span>
                    )}
                </button>
                <button onClick={() => setActiveTab('queues')} className={`px-4 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'queues' ? 'bg-[#0052CC] text-white' : 'text-[#5E6C84] hover:bg-[#F4F5F7]'}`}>
                    <Inbox size={14} /> Queues & Routing
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'queues' ? 'bg-white/20' : 'bg-[#EBECF0]'}`}>{queues.length}</span>
                </button>
            </div>

            {/* ── TICKET LIST TAB ── */}
            {activeTab === 'tickets' && (
                <>
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-3 mb-5">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={15} />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                className="w-full pl-9 pr-3 py-2 border border-[#DFE1E6] rounded-md text-sm outline-none focus:border-[#0052CC] bg-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1.5 rounded text-sm font-bold transition-all border ${filterStatus === status ? 'bg-[#0052CC] text-white border-[#0052CC]' : 'bg-white text-[#42526E] border-[#DFE1E6] hover:border-[#0052CC]'}`}
                                >
                                    {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                                </button>
                            ))}
                            {queues.length > 0 && (
                                <select
                                    value={filterQueue}
                                    onChange={(e) => setFilterQueue(e.target.value)}
                                    className="px-3 py-1.5 rounded text-sm font-medium border border-[#DFE1E6] bg-white text-[#42526E] outline-none focus:border-[#0052CC]"
                                >
                                    <option value="ALL">All Queues</option>
                                    {queues.map(q => (
                                        <option key={q.id} value={q.id}>{q.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-[#DFE1E6] rounded-md overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[#F4F5F7] border-b border-[#DFE1E6]">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold text-[#5E6C84] uppercase">Ticket</th>
                                    <th className="px-4 py-3 text-xs font-bold text-[#5E6C84] uppercase">Title</th>
                                    <th className="px-4 py-3 text-xs font-bold text-[#5E6C84] uppercase">Priority</th>
                                    <th className="px-4 py-3 text-xs font-bold text-[#5E6C84] uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-bold text-[#5E6C84] uppercase">SLA</th>
                                    <th className="px-4 py-3 text-xs font-bold text-[#5E6C84] uppercase">Category</th>
                                    <th className="px-4 py-3 text-xs font-bold text-[#5E6C84] uppercase">Submitted By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#DFE1E6]">
                                {filteredTickets.map(ticket => (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                                        className="hover:bg-[#F4F5F7] cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm font-bold text-[#0079BF]">{ticket.ticket_number}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare size={13} className="text-[#5E6C84] flex-shrink-0" />
                                                <span className="text-sm text-[#172B4D] font-medium line-clamp-1">{ticket.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2.5 h-2.5 rounded-sm ${getPriorityColor(ticket.priority)}`} />
                                                <span className="text-xs text-[#5E6C84]">{ticket.priority}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(ticket.status)}`}>
                                                {ticket.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {ticket.sla_breached ? (
                                                <span className="flex items-center gap-1 text-xs text-red-600 font-bold"><AlertTriangle size={12} /> Breached</span>
                                            ) : ticket.status === 'RESOLVED' ? (
                                                <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><CheckCircle2 size={12} /> Met</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-[#5E6C84]"><Timer size={12} /> Active</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#5E6C84]">{ticket.category}</td>
                                        <td className="px-4 py-3 text-sm text-[#5E6C84]">{ticket.submitted_by_username || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTickets.length === 0 && (
                            <div className="py-16 text-center">
                                <AlertCircle size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                                <p className="text-[#5E6C84] font-medium">No tickets found</p>
                                <p className="text-xs text-[#5E6C84] mt-1">Try adjusting your search or filter</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── SLA DASHBOARD TAB ── */}
            {activeTab === 'sla' && (
                <div className="space-y-6">
                    {/* KPI Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border border-[#DFE1E6] p-5 shadow-sm">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                                <MessageSquare size={18} />
                            </div>
                            <p className="text-2xl font-bold text-[#172B4D]">{tickets.length}</p>
                            <p className="text-xs text-[#5E6C84] font-medium mt-0.5">Total Tickets</p>
                        </div>
                        <div className="bg-white rounded-xl border border-[#DFE1E6] p-5 shadow-sm">
                            <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-3">
                                <CheckCircle2 size={18} />
                            </div>
                            <p className="text-2xl font-bold text-[#172B4D]">{sla.resolved.length}</p>
                            <p className="text-xs text-[#5E6C84] font-medium mt-0.5">Resolved</p>
                        </div>
                        <div className={`rounded-xl border p-5 shadow-sm ${sla.breached.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#DFE1E6]'}`}>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${sla.breached.length > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                                <AlertTriangle size={18} />
                            </div>
                            <p className={`text-2xl font-bold ${sla.breached.length > 0 ? 'text-red-600' : 'text-[#172B4D]'}`}>{sla.breached.length}</p>
                            <p className="text-xs text-[#5E6C84] font-medium mt-0.5">SLA Breaches</p>
                        </div>
                        <div className="bg-white rounded-xl border border-[#DFE1E6] p-5 shadow-sm">
                            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                                <Clock size={18} />
                            </div>
                            <p className="text-2xl font-bold text-[#172B4D]">
                                {sla.avgResolutionHrs !== null ? `${sla.avgResolutionHrs.toFixed(1)}h` : '—'}
                            </p>
                            <p className="text-xs text-[#5E6C84] font-medium mt-0.5">Avg. Resolution Time</p>
                        </div>
                    </div>

                    {/* SLA Compliance Meter */}
                    <div className="bg-white rounded-xl border border-[#DFE1E6] shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <Shield size={18} className="text-[#0052CC]" />
                            <div>
                                <h3 className="font-bold text-[#172B4D]">SLA Compliance Rate</h3>
                                <p className="text-xs text-[#5E6C84]">Percentage of tickets resolved within SLA targets</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex-1">
                                <div className="flex justify-between text-xs font-bold text-[#5E6C84] mb-2">
                                    <span>Compliance</span>
                                    <span>{100 - sla.breachRate}%</span>
                                </div>
                                <div className="w-full bg-[#EBECF0] rounded-full h-4 overflow-hidden">
                                    <div
                                        className={`h-4 rounded-full transition-all ${sla.breachRate > 20 ? 'bg-red-500' : sla.breachRate > 10 ? 'bg-amber-500' : 'bg-green-500'}`}
                                        style={{ width: `${100 - sla.breachRate}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-xs text-[#5E6C84]">{sla.breached.length} breached of {tickets.length} total</span>
                                    <span className={`text-xs font-bold ${sla.breachRate > 20 ? 'text-red-600' : sla.breachRate > 10 ? 'text-amber-600' : 'text-green-600'}`}>
                                        {sla.breachRate > 20 ? '⚠ Needs Attention' : sla.breachRate > 10 ? '~ Improving' : '✓ On Target'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className={`text-5xl font-black ${sla.breachRate > 20 ? 'text-red-500' : sla.breachRate > 10 ? 'text-amber-500' : 'text-green-500'}`}>
                                    {100 - sla.breachRate}%
                                </div>
                                <p className="text-xs text-[#5E6C84] font-medium">SLA Met</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Priority Distribution */}
                        <div className="bg-white rounded-xl border border-[#DFE1E6] shadow-sm p-5">
                            <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-[#0052CC]" /> Priority Breakdown</h3>
                            <div className="space-y-3">
                                {priorityDist.map(({ label, count, color }) => {
                                    const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
                                    return (
                                        <div key={label}>
                                            <div className="flex justify-between text-xs font-bold text-[#5E6C84] mb-1">
                                                <span>{label}</span>
                                                <span>{count} ({pct}%)</span>
                                            </div>
                                            <div className="w-full bg-[#EBECF0] rounded-full h-2">
                                                <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Status Distribution */}
                        <div className="bg-white rounded-xl border border-[#DFE1E6] shadow-sm p-5">
                            <h3 className="font-bold text-[#172B4D] mb-4 flex items-center gap-2"><Activity size={16} className="text-[#0052CC]" /> Status Distribution</h3>
                            <div className="space-y-3">
                                {statusDist.map(({ label, count, color }) => {
                                    const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
                                    return (
                                        <div key={label}>
                                            <div className="flex justify-between text-xs font-bold text-[#5E6C84] mb-1">
                                                <span>{label}</span>
                                                <span>{count} ({pct}%)</span>
                                            </div>
                                            <div className="w-full bg-[#EBECF0] rounded-full h-2">
                                                <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Cross-System SLA Intelligence & Auto-Escalation Engine (Roadmap 5.1) */}
                    <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 border border-red-500/30 rounded-xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 shrink-0">
                                <Zap size={22} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-white text-base">Cross-System SLA Intelligence & Auto-Escalation</h3>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full">
                                        SLA Engine Live
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                                    Automatically scans for tickets with breached SLA response/resolution targets, escalates priority to Critical, and provisions urgent linked Engineering Tasks across projects to accelerate triage.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleAutoEscalate}
                            disabled={isEscalating}
                            className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-red-900/40 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <Zap size={14} className={isEscalating ? 'animate-bounce' : ''} />
                            {isEscalating ? 'Executing Escalation...' : 'Run SLA Auto-Escalation'}
                        </button>
                    </div>

                    {/* Breached Tickets List */}
                    {sla.breached.length > 0 && (
                        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                            <div className="p-5 bg-red-50 border-b border-red-200 flex items-center gap-3">
                                <AlertTriangle size={18} className="text-red-600" />
                                <div>
                                    <h3 className="font-bold text-red-700">SLA Breached Tickets — Immediate Action Required</h3>
                                    <p className="text-xs text-red-600">{sla.breached.length} ticket{sla.breached.length > 1 ? 's' : ''} exceeded SLA response/resolution targets</p>
                                </div>
                            </div>
                            <table className="w-full">
                                <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                                    <tr>
                                        {['Ticket', 'Title', 'Priority', 'Status', 'Created'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#5E6C84] uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#DFE1E6]">
                                    {sla.breached.map(ticket => (
                                        <tr
                                            key={ticket.id}
                                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                                            className="hover:bg-red-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3 text-sm font-bold text-red-600">{ticket.ticket_number}</td>
                                            <td className="px-4 py-3 text-sm text-[#172B4D] font-medium">{ticket.title}</td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-block w-2.5 h-2.5 rounded-sm ${getPriorityColor(ticket.priority)}`} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[#5E6C84]">
                                                {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Critical Open Tickets */}
                    {sla.critical.length > 0 && (
                        <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
                            <div className="p-5 bg-orange-50 border-b border-orange-200 flex items-center gap-3">
                                <AlertCircle size={18} className="text-orange-600" />
                                <div>
                                    <h3 className="font-bold text-orange-700">Critical Priority — Open Tickets</h3>
                                    <p className="text-xs text-orange-600">{sla.critical.length} critical ticket{sla.critical.length > 1 ? 's' : ''} awaiting resolution</p>
                                </div>
                            </div>
                            <div className="divide-y divide-[#DFE1E6]">
                                {sla.critical.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                                        className="px-5 py-3 flex items-center justify-between hover:bg-orange-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-orange-600">{ticket.ticket_number}</span>
                                            <span className="text-sm text-[#172B4D]">{ticket.title}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(ticket.status)}`}>
                                            {ticket.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tickets.length === 0 && (
                        <div className="bg-white rounded-xl border border-[#DFE1E6] py-16 text-center">
                            <Shield size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                            <p className="text-[#5E6C84] font-medium">No ticket data yet</p>
                            <p className="text-xs text-[#5E6C84] mt-1">SLA metrics will appear once tickets are created</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── QUEUES TAB ── */}
            {activeTab === 'queues' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-[#DFE1E6] shadow-sm">
                        <div>
                            <h2 className="text-base font-bold text-[#172B4D]">Ticket Queues & Auto-Assignment</h2>
                            <p className="text-xs text-[#5E6C84] mt-0.5">
                                Route incoming tickets to specialized queues and automatically balance workload across assigned agents.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowQueueModal(true)}
                            className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus size={14} /> New Queue
                        </button>
                    </div>

                    {queues.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-[#DFE1E6] rounded-xl p-10 text-center">
                            <Inbox size={32} className="mx-auto text-[#0052CC] mb-3" />
                            <h3 className="text-sm font-bold text-[#172B4D]">No Ticket Queues Configured</h3>
                            <p className="text-xs text-[#5E6C84] mt-1">Create a queue like "Tier 1 Support" or "Billing" and enable round-robin auto-assignment.</p>
                            <button
                                onClick={() => setShowQueueModal(true)}
                                className="mt-4 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-xs font-bold"
                            >
                                Create First Queue
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {queues.map(q => (
                                <div key={q.id} className="bg-white border border-[#DFE1E6] rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-[#172B4D] text-sm">{q.name}</h3>
                                                {q.is_default && (
                                                    <span className="px-1.5 py-0.5 bg-[#DEEBFF] text-[#0052CC] text-[10px] font-bold rounded uppercase">Default</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteQueue(q.id)}
                                                className="p-1 text-[#5E6C84] hover:text-[#DE350B] rounded"
                                                title="Delete queue"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-[#5E6C84]">{q.description || 'No description provided.'}</p>
                                        <div className="flex items-center justify-between pt-2 text-xs">
                                            <span className="text-[#5E6C84] font-medium">{q.ticket_count || 0} tickets</span>
                                            <span className="text-[#5E6C84] flex items-center gap-1">
                                                <Users size={12} /> {q.assigned_users_details?.length || 0} agents
                                            </span>
                                        </div>
                                        {q.assigned_users_details?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {q.assigned_users_details.map(u => (
                                                    <span key={u.id} className="px-2 py-0.5 bg-[#F4F5F7] text-[#172B4D] rounded-full text-[10px] font-semibold">
                                                        {u.username}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-[#F4F5F7] flex items-center justify-between">
                                        <span className="text-xs font-semibold text-[#172B4D]">Auto-Assign (Round-Robin)</span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleQueueAutoAssign(q)}
                                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${q.auto_assign ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#EBECF0] text-[#5E6C84]'}`}
                                        >
                                            {q.auto_assign ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Create Modal ── */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
                    onClick={() => setIsCreateModalOpen(false)}
                >
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleCreateTicket}>
                            <div className="p-5 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="text-lg font-bold text-[#172B4D]">Create Ticket</h3>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded-sm text-[#5E6C84]">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Title</label>
                                    <input
                                        type="text" required autoFocus
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                        placeholder="Brief description of the issue..."
                                        value={newTicket.title}
                                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <textarea
                                        required
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] min-h-[90px] resize-none"
                                        placeholder="Provide more details..."
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    />
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={handleAiTriage}
                                            disabled={isTriaging}
                                            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-sm"
                                        >
                                            {isTriaging ? <><Loader2 size={13} className="animate-spin" /> Analyzing...</> : <><Sparkles size={13} /> AI Auto-Triage & Predict SLA</>}
                                        </button>
                                    </div>
                                </div>
                                {aiTriageResult && (
                                    <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900 space-y-1">
                                        <div className="flex items-center justify-between font-bold">
                                            <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-purple-600" /> AI Triage</span>
                                            {aiTriageResult.sla_target_hours && <span className="px-2 py-0.5 bg-purple-200 rounded font-mono">SLA: {aiTriageResult.sla_target_hours}h</span>}
                                        </div>
                                        <p className="text-purple-800 leading-relaxed">{aiTriageResult.reasoning}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Category</label>
                                        <select className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] bg-white" value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}>
                                            <option value="BUG">Bug</option>
                                            <option value="FEATURE">Feature Request</option>
                                            <option value="IT_SUPPORT">IT Support</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Priority</label>
                                        <select className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] bg-white" value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}>
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>
                                </div>
                                {queues.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Queue</label>
                                        <select
                                            className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] bg-white"
                                            value={newTicket.queue}
                                            onChange={(e) => setNewTicket({ ...newTicket, queue: e.target.value })}
                                        >
                                            <option value="">Default Queue</option>
                                            {queues.map(q => (
                                                <option key={q.id} value={q.id}>
                                                    {q.name}{q.auto_assign ? ' (Auto-Assign)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 border-t border-[#DFE1E6] flex justify-end gap-2">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-bold text-[#42526E] hover:bg-[#EBECF0] rounded transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded text-sm font-bold transition-colors">Create Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Create Queue Modal ── */}
            {showQueueModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={() => setShowQueueModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleCreateQueue}>
                            <div className="p-5 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="text-lg font-bold text-[#172B4D]">New Ticket Queue</h3>
                                <button type="button" onClick={() => setShowQueueModal(false)} className="p-1 hover:bg-[#EBECF0] rounded-sm text-[#5E6C84]">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Queue Name</label>
                                    <input
                                        type="text" required autoFocus
                                        placeholder="e.g. Tier 1 Support"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                        value={newQueue.name}
                                        onChange={e => setNewQueue({ ...newQueue, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <input
                                        type="text"
                                        placeholder="Optional routing notes..."
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                        value={newQueue.description}
                                        onChange={e => setNewQueue({ ...newQueue, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-[#172B4D] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newQueue.auto_assign}
                                            onChange={e => setNewQueue({ ...newQueue, auto_assign: e.target.checked })}
                                        />
                                        Enable Auto-Assign
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-semibold text-[#172B4D] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newQueue.is_default}
                                            onChange={e => setNewQueue({ ...newQueue, is_default: e.target.checked })}
                                        />
                                        Default Queue
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Assign Agents</label>
                                    <div className="max-h-36 overflow-y-auto border border-[#DFE1E6] rounded p-2 space-y-1">
                                        {users.map(u => {
                                            const checked = newQueue.assigned_users.includes(u.id);
                                            return (
                                                <label key={u.id} className="flex items-center gap-2 text-xs text-[#172B4D] cursor-pointer p-1 hover:bg-[#F4F5F7] rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={e => {
                                                            const next = e.target.checked
                                                                ? [...newQueue.assigned_users, u.id]
                                                                : newQueue.assigned_users.filter(id => id !== u.id);
                                                            setNewQueue({ ...newQueue, assigned_users: next });
                                                        }}
                                                    />
                                                    <span>{u.username}</span>
                                                    <span className="text-[10px] text-[#5E6C84] ml-auto">{u.role}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 border-t border-[#DFE1E6] flex justify-end gap-2">
                                <button type="button" onClick={() => setShowQueueModal(false)} className="px-4 py-2 text-sm font-bold text-[#42526E] hover:bg-[#EBECF0] rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded text-sm font-bold">Create Queue</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets;
