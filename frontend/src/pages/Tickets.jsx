import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, AlertCircle, Clock, MessageSquare, X,
    Sparkles, Loader2, Check, Shield, TrendingUp, AlertTriangle,
    CheckCircle2, BarChart2, Activity, Timer
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
    const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'sla'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'MEDIUM', category: 'BUG' });
    const [isTriaging, setIsTriaging] = useState(false);
    const [aiTriageResult, setAiTriageResult] = useState(null);
    const [slaLoading, setSlaLoading] = useState(false);
    const { user } = useAuthStore();

    const fetchTickets = async () => {
        try {
            const res = await api.get('/tickets/tickets/');
            setTickets(res.data?.results || res.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchTickets(); }, []);

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
            const res = await api.post('/tickets/tickets/', newTicket);
            setTickets([res.data, ...tickets]);
            setIsCreateModalOpen(false);
            setNewTicket({ title: '', description: '', priority: 'MEDIUM', category: 'BUG' });
            setAiTriageResult(null);
            showToast('Ticket created successfully!', 'success');
        } catch (err) {
            showToast('Failed to create ticket', 'error');
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase()) ||
            t.ticket_number?.toLowerCase().includes(search.toLowerCase());
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
                        <div className="flex gap-2 flex-wrap">
                            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1.5 rounded text-sm font-bold transition-all border ${filterStatus === status ? 'bg-[#0052CC] text-white border-[#0052CC]' : 'bg-white text-[#42526E] border-[#DFE1E6] hover:border-[#0052CC]'}`}
                                >
                                    {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                                </button>
                            ))}
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
                            </div>
                            <div className="p-5 border-t border-[#DFE1E6] flex justify-end gap-2">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-bold text-[#42526E] hover:bg-[#EBECF0] rounded transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded text-sm font-bold transition-colors">Create Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets;
