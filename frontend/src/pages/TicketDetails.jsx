import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft, Send, Paperclip, MoreHorizontal, User, Clock,
    AlertCircle, Hash, MessageSquare, Plus, FileText, CheckCircle2,
    X, ArrowRight, Tag as TagIcon, LayoutGrid, Calendar, ShieldAlert,
    UserPlus, Check, ChevronDown, Flag, AlertTriangle, Zap,
    History, Lock, Globe, Download, Search, Info, HelpCircle,
    ArrowUpRight, Share2, CornerDownRight, CircleDot, Inbox,
    ArrowRightCircle, Mail, ShieldCheck, ZapOff
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const TicketDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [ticket, setTicket] = useState(null);
    const [isInternal, setIsInternal] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    const commentEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const fetchTicket = async () => {
        try {
            const response = await api.get(`/tickets/tickets/${id}/`);
            setTicket(response.data);
        } catch (error) {
            console.error('Failed to fetch ticket', error);
        }
    };

    const fetchMeta = async () => {
        try {
            const [uRes, pRes] = await Promise.all([
                api.get('/users/list/'),
                api.get('/projects/projects/')
            ]);
            setUsers(uRes.data);
            setProjects(pRes.data);
        } catch (e) { }
    };

    useEffect(() => {
        fetchTicket();
        if (user?.role !== 'EMPLOYEE') fetchMeta();
    }, [id]);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post('/activity/comments/', {
                text: newComment,
                is_internal: isInternal,
                content_type: 'ticket',
                object_id: id
            });
            fetchTicket();
            setNewComment('');
        } catch (error) {
            console.error('Comment failed', error);
        }
    };

    const handleUpdateField = async (field, value) => {
        setIsUpdating(true);
        try {
            const res = await api.patch(`/tickets/tickets/${id}/`, { [field]: value });
            setTicket(res.data);
            setIsUpdating(false);
        } catch (error) {
            setIsUpdating(false);
        }
    };

    const handleConvert = async () => {
        if (!selectedProject) return;
        setIsConverting(true);
        try {
            await api.post(`/tickets/tickets/${id}/convert-to-task/`, { project_id: selectedProject });
            fetchTicket();
            setIsConverting(false);
        } catch (error) {
            setIsConverting(false);
        }
    };

    if (!ticket) return null;

    const combinedFeed = [
        ...(ticket.comments_details?.map(c => ({ ...c, type: 'comment' })) || []),
        ...(ticket.audit_logs_details?.map(l => ({ ...l, type: 'log' })) || [])
    ].sort((a, b) => new Date(a.created_at || a.timestamp) - new Date(b.created_at || b.timestamp));

    const getPriorityBadge = (p) => {
        const colors = {
            CRITICAL: 'text-red-600 bg-red-50 border-red-100',
            HIGH: 'text-orange-600 bg-orange-50 border-orange-100',
            MEDIUM: 'text-amber-600 bg-amber-50 border-amber-100',
            LOW: 'text-emerald-600 bg-emerald-50 border-emerald-100'
        };
        return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${colors[p] || 'bg-zinc-50'}`}>{p}</span>;
    };

    const getStatusBadge = (s) => {
        const colors = {
            OPEN: 'bg-zinc-100 text-zinc-600',
            IN_PROGRESS: 'bg-indigo-50 text-indigo-600',
            RESOLVED: 'bg-emerald-50 text-emerald-600',
            CLOSED: 'bg-zinc-900 text-white'
        };
        return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[s] || 'bg-zinc-50'}`}>{s.replace('_', ' ')}</span>;
    };

    const canEdit = user?.role !== 'EMPLOYEE';

    return (
        <div className="flex h-screen bg-[#FDFDFF] text-zinc-900 overflow-hidden font-sans animate-fade-in">
            {/* Thread Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-zinc-100">
                {/* Header */}
                <header className="h-[72px] flex items-center justify-between px-8 border-b border-zinc-50 sticky top-0 bg-white/80 backdrop-blur-md z-40">
                    <div className="flex items-center gap-4 min-w-0">
                        <button onClick={() => navigate('/tickets')} className="w-10 h-10 flex items-center justify-center hover:bg-zinc-50 rounded-xl transition-all text-zinc-400 hover:text-zinc-900">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{ticket.ticket_number}</span>
                                <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{ticket.category}</span>
                            </div>
                            <h2 className="text-sm font-bold truncate text-zinc-900">{ticket.title}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {ticket.status !== 'RESOLVED' && canEdit && (
                            <button
                                onClick={() => handleUpdateField('status', 'RESOLVED')}
                                className="h-9 px-5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-100 flex items-center gap-2"
                            >
                                <Check size={14} /> Resolve Request
                            </button>
                        )}
                        <button className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition-all">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                </header>

                {/* Conversation Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    <div className="max-w-4xl w-full mx-auto px-10 py-12">
                        {/* Summary Section */}
                        <div className="mb-16">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-xl shadow-zinc-200">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Initial Request</p>
                                    <p className="text-xs font-medium text-zinc-500">Submitted by {ticket.submitted_by_username} · {new Date(ticket.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="bg-zinc-50/50 rounded-[2rem] p-10 border border-zinc-100">
                                <p className="text-base text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap">
                                    {ticket.description}
                                </p>
                            </div>

                            {ticket.attachments_details?.length > 0 && (
                                <div className="flex flex-wrap gap-4 mt-8">
                                    {ticket.attachments_details.map(file => (
                                        <a key={file.id} href={file.file} target="_blank" className="flex items-center gap-3 px-5 py-3 bg-white border border-zinc-100 rounded-2xl group hover:border-zinc-900 transition-all shadow-sm">
                                            <FileText size={16} className="text-zinc-400" />
                                            <span className="text-xs font-bold text-zinc-600 truncate max-w-[150px]">{file.file.split('/').pop()}</span>
                                            <Download size={14} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Thread Divider */}
                        <div className="flex items-center gap-4 mb-16">
                            <div className="h-[1px] flex-1 bg-zinc-100"></div>
                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em]">Activity Log</span>
                            <div className="h-[1px] flex-1 bg-zinc-100"></div>
                        </div>

                        {/* Thread Messages */}
                        <div className="space-y-12">
                            {combinedFeed.map((item, i) => (
                                <div key={i} className="animate-fade-in group">
                                    {item.type === 'comment' ? (
                                        <div className={`flex gap-6 ${item.is_internal ? 'bg-indigo-50/20 -mx-6 px-6 py-6 rounded-[2rem] border border-indigo-100/50 shadow-sm' : ''}`}>
                                            <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500 shadow-sm group-hover:scale-110 transition-transform">
                                                {item.user_details.username[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold text-zinc-900">{item.user_details.username}</span>
                                                        {item.is_internal && (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-bold uppercase">
                                                                <Lock size={10} /> Private
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-tight">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-zinc-600 leading-relaxed">
                                                    {item.text}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 pl-16">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-200"></div>
                                            <p className="text-[11px] font-medium text-zinc-400">
                                                <span className="font-bold text-zinc-500 uppercase tracking-widest mr-2">{item.action}</span>
                                                by {item.user_details?.username || 'System'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Response Input */}
                <div className="p-6 bg-white border-t border-zinc-50">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <div className="flex-1 relative flex items-center group">
                            <button
                                onClick={() => setIsInternal(!isInternal)}
                                className={`h-12 w-12 flex items-center justify-center rounded-2xl border transition-all shrink-0 mr-3 ${isInternal ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-zinc-50 border-zinc-100 text-zinc-300 hover:text-zinc-500 hover:border-zinc-200'}`}
                                title={isInternal ? "Switch to Team Thread" : "Switch to Internal Note"}
                            >
                                {isInternal ? <Lock size={20} /> : <Globe size={20} />}
                            </button>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder={isInternal ? "Add an internal team note..." : "Share an update with the user..."}
                                    className={`w-full h-12 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 text-sm font-medium focus:bg-white outline-none transition-all ${isInternal ? 'focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/30' : 'focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100/50'}`}
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-300 hover:text-zinc-600 transition-colors">
                                        <Paperclip size={18} />
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { }} />
                                    </button>
                                    <button
                                        onClick={handlePostComment}
                                        disabled={!newComment.trim()}
                                        className="h-9 w-9 flex items-center justify-center bg-zinc-900 text-white rounded-xl shadow-lg shadow-zinc-200 active:scale-95 transition-all disabled:opacity-20"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Meta Sidebar */}
            <aside className="w-[360px] bg-[#FDFDFF] p-10 overflow-y-auto space-y-12">
                <section>
                    <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.25em] mb-8">Metadata</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400">Current Status</span>
                            {canEdit ? (
                                <select
                                    className="appearance-none bg-transparent border-none text-xs font-bold text-zinc-900 outline-none text-right cursor-pointer hover:text-indigo-600 transition-colors"
                                    value={ticket.status}
                                    onChange={e => handleUpdateField('status', e.target.value)}
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">Progressing</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="CLOSED">Archived</option>
                                </select>
                            ) : getStatusBadge(ticket.status)}
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400">Priority Level</span>
                            {canEdit ? (
                                <select
                                    className="appearance-none bg-transparent border-none text-xs font-bold text-zinc-900 outline-none text-right cursor-pointer hover:text-indigo-600 transition-colors"
                                    value={ticket.priority}
                                    onChange={e => handleUpdateField('priority', e.target.value)}
                                >
                                    <option value="LOW">Routine</option>
                                    <option value="MEDIUM">Standard</option>
                                    <option value="HIGH">High Priority</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            ) : getPriorityBadge(ticket.priority)}
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400">Resolution Lead</span>
                            {canEdit ? (
                                <select
                                    className="appearance-none bg-transparent border-none text-xs font-bold text-zinc-900 outline-none text-right cursor-pointer hover:text-indigo-600 transition-colors max-w-[140px]"
                                    value={ticket.assigned_to || ''}
                                    onChange={e => handleUpdateField('assigned_to', e.target.value)}
                                >
                                    <option value="">Choose Lead...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.username}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="text-xs font-bold text-zinc-900">{ticket.assigned_to_details?.username || 'Unassigned'}</span>
                            )}
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.25em] mb-8">Performance (SLA)</h3>
                    <div className="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Time Budget</p>
                                <p className={`text-3xl font-bold tracking-tight ${ticket.time_remaining_hours < 0 ? 'text-red-600' : 'text-zinc-900'}`}>
                                    {ticket.time_remaining_hours || 0}h
                                </p>
                            </div>
                            <div className={`p-2 rounded-xl ${ticket.time_remaining_hours < 0 ? 'bg-red-50 text-red-600' : 'bg-zinc-50 text-zinc-400'}`}>
                                {ticket.time_remaining_hours < 0 ? <AlertCircle size={20} /> : <Zap size={20} />}
                            </div>
                        </div>
                        <div className="h-1.5 bg-zinc-50 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${ticket.time_remaining_hours < 5 ? 'bg-red-500' : 'bg-zinc-900'}`}
                                style={{ width: `${Math.max(0, Math.min(100, (ticket.time_remaining_hours / 48) * 100))}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest leading-relaxed">
                            Target Resolution: {ticket.sla_due_date ? new Date(ticket.sla_due_date).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.25em] mb-8">Escalation Sync</h3>
                    {!ticket.project_task ? (
                        <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <LayoutGrid size={20} />
                                </div>
                                <p className="text-xs font-semibold text-zinc-500 leading-relaxed">Sync this request to a development stream.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="relative">
                                    <select
                                        className="w-full h-12 bg-zinc-50 border border-zinc-100 rounded-2xl text-xs font-bold px-5 appearance-none outline-none focus:bg-white transition-all cursor-pointer"
                                        value={selectedProject}
                                        onChange={e => setSelectedProject(e.target.value)}
                                    >
                                        <option value="">Stream Selection...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" />
                                </div>
                                <button
                                    onClick={handleConvert}
                                    disabled={!selectedProject || isConverting}
                                    className="w-full h-12 bg-zinc-900 text-white rounded-2xl text-xs font-bold hover:bg-zinc-800 disabled:opacity-20 transition-all shadow-lg shadow-zinc-100 flex items-center justify-center gap-2"
                                >
                                    {isConverting ? 'Processing...' : <><Zap size={14} /> Initialize Task</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link
                            to={`/projects/${ticket.project_task_details?.project}`}
                            className="flex flex-col gap-2 p-6 bg-white border border-zinc-100 rounded-3xl hover:border-indigo-500/30 group transition-all"
                        >
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Linked Initiative</span>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 truncate">{ticket.project_task_details?.title}</span>
                                <ArrowUpRight size={16} className="text-zinc-300 group-hover:text-indigo-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                            </div>
                        </Link>
                    )}
                </section>

                <div className="pt-10 flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                            <User size={14} />
                        </div>
                        <span className="text-xs font-bold text-zinc-500">{ticket.submitted_by_username}</span>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default TicketDetails;
