import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft, Send, Paperclip, MoreHorizontal, User,
    Check, ChevronDown, LayoutGrid, Zap, Mail,
    Clock, Tag, Globe, Lock, FileText, Download, ArrowUpRight
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
                content_type_name: 'ticket', // Fixed for compatibility
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

    if (!ticket) return (
        <div className="h-screen w-full flex items-center justify-center bg-white text-[#5E6C84]">
            Loading ticket...
        </div>
    );

    const combinedFeed = [
        ...(ticket.comments_details?.map(c => ({ ...c, type: 'comment' })) || []),
        ...(ticket.audit_logs_details?.map(l => ({ ...l, type: 'log' })) || [])
    ].sort((a, b) => new Date(a.created_at || a.timestamp) - new Date(b.created_at || b.timestamp));

    const canEdit = user?.role !== 'EMPLOYEE';

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-[#172B4D] font-sans flex flex-col">
            {/* Header */}
            <header className="h-14 bg-white border-b border-[#DFE1E6] flex items-center justify-between px-6 shrink-0 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/tickets')}
                        className="p-2 hover:bg-[#EBECF0] rounded text-[#5E6C84] transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#5E6C84] uppercase tracking-wider mb-0.5">
                            <span>{ticket.ticket_number}</span>
                            <span className="w-1 h-1 rounded-full bg-[#DFE1E6]" />
                            <span>{ticket.category}</span>
                        </div>
                        <h1 className="text-sm font-bold text-[#172B4D] truncate max-w-md">{ticket.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {ticket.status !== 'RESOLVED' && canEdit && (
                        <button
                            onClick={() => handleUpdateField('status', 'RESOLVED')}
                            className="px-3 h-8 bg-[#0079BF] text-white rounded text-sm font-semibold hover:bg-[#026AA7] transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Check size={14} /> Resolve
                        </button>
                    )}
                    <button className="p-2 hover:bg-[#EBECF0] rounded text-[#5E6C84]">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </header>

            {/* Content Body */}
            <div className="flex flex-1 overflow-hidden">
                {/* Main Thread */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {/* Description Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-[#DFE1E6] overflow-hidden">
                            <div className="p-4 bg-[#F4F5F7] border-b border-[#DFE1E6] flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#DFE1E6] flex items-center justify-center text-[#172B4D] font-bold text-xs ring-2 ring-white">
                                        {ticket.submitted_by_username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#172B4D]">{ticket.submitted_by_username}</p>
                                        <p className="text-xs text-[#5E6C84]">{new Date(ticket.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${ticket.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                                            ticket.status === 'RESOLVED' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-[#172B4D] leading-relaxed whitespace-pre-wrap">
                                    {ticket.description}
                                </p>
                            </div>
                            {ticket.attachments_details?.length > 0 && (
                                <div className="px-6 pb-6 pt-0 flex flex-wrap gap-2">
                                    {ticket.attachments_details.map(file => (
                                        <a
                                            key={file.id}
                                            href={file.file}
                                            target="_blank"
                                            className="flex items-center gap-2 px-3 py-2 bg-[#F4F5F7] rounded hover:bg-[#EBECF0] text-sm text-[#172B4D] border border-transparent hover:border-[#DFE1E6] transition-all"
                                        >
                                            <FileText size={14} className="text-[#5E6C84]" />
                                            <span className="truncate max-w-[120px]">{file.file.split('/').pop()}</span>
                                            <Download size={12} className="text-[#5E6C84]" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Activity Feed */}
                        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-[#EBECF0]">
                            {combinedFeed.map((item, i) => (
                                <div key={i} className="relative animate-fade-in">
                                    {item.type === 'comment' ? (
                                        <div className={`p-4 rounded-lg border shadow-sm ${item.is_internal
                                                ? 'bg-[#FFF0B3]/20 border-[#FFFAE6]'
                                                : 'bg-white border-[#DFE1E6]'
                                            }`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-[#172B4D]">{item.user_details.username}</span>
                                                    <span className="text-xs text-[#5E6C84]">{new Date(item.created_at).toLocaleString()}</span>
                                                </div>
                                                {item.is_internal && (
                                                    <div className="px-1.5 py-0.5 rounded bg-[#FFFAE6] text-[#FF991F] text-[10px] font-bold border border-[#FFF0B3] flex items-center gap-1">
                                                        <Lock size={10} /> Internal
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-[#172B4D] whitespace-pre-wrap">{item.text}</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="w-2 h-2 rounded-full bg-[#DFE1E6] -ml-[1.4rem] ring-4 ring-[#F9FAFB]" />
                                            <p className="text-xs text-[#5E6C84]">
                                                <span className="font-semibold text-[#172B4D]">{item.user_details?.username}</span> {item.action}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="w-80 bg-white border-l border-[#DFE1E6] p-6 space-y-8 overflow-y-auto">
                    {/* Input Area */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-[#5E6C84] uppercase">Reply</h3>
                        <div className="border border-[#DFE1E6] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#0079BF] focus-within:border-transparent transition-shadow">
                            <textarea
                                placeholder={isInternal ? "Add an internal note..." : "Reply to customer..."}
                                className={`w-full min-h-[100px] p-3 text-sm outline-none resize-none ${isInternal ? 'bg-[#FFF0B3]/10' : 'bg-white'}`}
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                            />
                            <div className={`px-2 py-2 border-t border-[#DFE1E6] bg-[#F4F5F7] flex items-center justify-between ${isInternal ? 'bg-[#FFF0B3]/20' : ''}`}>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsInternal(!isInternal)}
                                        className={`p-1.5 rounded transition-colors ${isInternal ? 'bg-[#FFFAE6] text-[#FF991F]' : 'hover:bg-[#EBECF0] text-[#5E6C84]'}`}
                                        title="Toggle Internal Note"
                                    >
                                        {isInternal ? <Lock size={16} /> : <Globe size={16} />}
                                    </button>
                                    <button className="p-1.5 hover:bg-[#EBECF0] rounded text-[#5E6C84]">
                                        <Paperclip size={16} />
                                    </button>
                                </div>
                                <button
                                    onClick={handlePostComment}
                                    disabled={!newComment.trim()}
                                    className="px-3 py-1.5 bg-[#0079BF] text-white rounded text-xs font-semibold hover:bg-[#026AA7] disabled:opacity-50 transition-colors"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-[#DFE1E6]" />

                    {/* Metadata */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[#5E6C84] uppercase">Details</h3>

                        <div className="space-y-1">
                            <label className="text-xs text-[#5E6C84]">Status</label>
                            {canEdit ? (
                                <select
                                    className="w-full h-9 px-2 bg-[#F4F5F7] border border-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] outline-none focus:border-[#0079BF]"
                                    value={ticket.status}
                                    onChange={e => handleUpdateField('status', e.target.value)}
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            ) : (
                                <div className="text-sm font-medium text-[#172B4D]">{ticket.status.replace('_', ' ')}</div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-[#5E6C84]">Priority</label>
                            {canEdit ? (
                                <select
                                    className="w-full h-9 px-2 bg-[#F4F5F7] border border-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] outline-none focus:border-[#0079BF]"
                                    value={ticket.priority}
                                    onChange={e => handleUpdateField('priority', e.target.value)}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            ) : (
                                <div className="text-sm font-medium text-[#172B4D]">{ticket.priority}</div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-[#5E6C84]">Assignee</label>
                            {canEdit ? (
                                <select
                                    className="w-full h-9 px-2 bg-[#F4F5F7] border border-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] outline-none focus:border-[#0079BF]"
                                    value={ticket.assigned_to || ''}
                                    onChange={e => handleUpdateField('assigned_to', e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.username}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="text-sm font-medium text-[#172B4D]">{ticket.assigned_to_details?.username || 'Unassigned'}</div>
                            )}
                        </div>
                    </div>

                    {/* Developer Tools */}
                    {canEdit && (
                        <div className="bg-[#EBECF0]/50 p-4 rounded-lg border border-[#DFE1E6]">
                            <h4 className="text-xs font-bold text-[#172B4D] uppercase mb-3 flex items-center gap-2">
                                <LayoutGrid size={14} /> Developer Actions
                            </h4>
                            {!ticket.project_task ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-[#5E6C84] mb-2">Convert this ticket to a task to start tracking work.</p>
                                    <select
                                        className="w-full h-9 px-2 bg-white border border-[#DFE1E6] rounded text-xs outline-none focus:border-[#0079BF]"
                                        value={selectedProject}
                                        onChange={e => setSelectedProject(e.target.value)}
                                    >
                                        <option value="">Select Project...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleConvert}
                                        disabled={!selectedProject || isConverting}
                                        className="w-full h-8 bg-[#172B4D] text-white rounded text-xs font-bold hover:bg-[#253858] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isConverting ? 'Linking...' : 'Convert to Task'}
                                    </button>
                                </div>
                            ) : (
                                <Link to={`/projects/${ticket.project_task_details?.project}`} className="block group">
                                    <p className="text-xs text-[#5E6C84] mb-1">Linked Task</p>
                                    <div className="flex items-center justify-between p-2 bg-white rounded border border-[#DFE1E6] group-hover:border-[#0079BF] transition-colors">
                                        <span className="text-xs font-medium text-[#172B4D] truncate">{ticket.project_task_details?.title}</span>
                                        <ArrowUpRight size={14} className="text-[#5E6C84]" />
                                    </div>
                                </Link>
                            )}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default TicketDetails;
