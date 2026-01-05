import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Paperclip, MoreHorizontal, User, Clock, AlertCircle, Hash, MessageSquare, Plus, FileText, CheckCircle2, X } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const TicketDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [isConverting, setIsConverting] = useState(false);

    const commentEndRef = useRef(null);

    const fetchTicket = async () => {
        try {
            const response = await api.get(`/tickets/tickets/${id}/`);
            setTicket(response.data);

            // Fetch comments
            const commentsRes = await api.get(`/activity/comments/?content_type=ticket&object_id=${id}`);
            setComments(commentsRes.data);
        } catch (error) {
            console.error('Failed to fetch ticket data', error);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects/projects/');
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to fetch projects', error);
        }
    };

    useEffect(() => {
        fetchTicket();
        if (user?.role !== 'EMPLOYEE') fetchProjects();
    }, [id]);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await api.post('/activity/comments/', {
                text: newComment,
                content_type: 'ticket',
                object_id: id
            });
            setComments(prev => [...prev, res.data]);
            setNewComment('');
            commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Failed to post comment', error);
        }
    };

    const handleConvert = async () => {
        if (!selectedProject) return;
        setIsConverting(true);
        try {
            await api.post(`/tickets/tickets/${id}/convert-to-task//`, { project_id: selectedProject });
            fetchTicket();
            setIsConverting(false);
        } catch (error) {
            console.error('Conversion failed', error);
            setIsConverting(false);
        }
    };

    if (!ticket) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in bg-slate-50/20 min-h-screen">
            <button
                onClick={() => navigate('/tickets')}
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-[0.2em] group"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Support Desk
            </button>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-8 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 p-10 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-700">
                            <FileText size={160} />
                        </div>

                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div>
                                <p className="text-indigo-500 font-black text-[10px] uppercase tracking-[0.3em] mb-3 leading-none">{ticket.ticket_number}</p>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">{ticket.title}</h1>
                            </div>
                            <div className="flex gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest shadow-sm ${ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        ticket.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                    }`}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                                <span className="px-4 py-1.5 rounded-full text-[9px] font-black border border-indigo-100 bg-indigo-50 text-indigo-600 uppercase tracking-widest shadow-sm">
                                    {ticket.priority}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-50/80 rounded-[2rem] p-8 mb-12 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100 relative z-10">
                            {ticket.description}
                        </div>

                        <div className="space-y-8 relative z-10">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-8">
                                <h3 className="font-black text-slate-900 flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-lg shadow-indigo-100"></div>
                                    Resolutions discussion ({comments.length})
                                </h3>
                                <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all rounded-xl border border-slate-100"><MoreHorizontal size={18} /></button>
                            </div>

                            <div className="space-y-10 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                                {comments.length > 0 ? comments.map((c, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border-2 border-white text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
                                            {(c.user_details?.username || 'U')[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-black text-slate-900">{c.user_details?.username || 'Team Member'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(c.created_at).toLocaleString()}</p>
                                            </div>
                                            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl rounded-tl-none text-sm text-slate-600 leading-relaxed group-hover:border-indigo-100 transition-colors">
                                                {c.text}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200"><MessageSquare size={32} /></div>
                                        <p className="text-sm text-slate-400 font-medium">No messages in this support thread yet.</p>
                                    </div>
                                )}
                                <div ref={commentEndRef} />
                            </div>

                            <div className="mt-10 p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-100/50 flex flex-col gap-6 focus-within:border-indigo-300 transition-all">
                                <textarea
                                    className="w-full bg-transparent border-none outline-none text-sm font-medium resize-none placeholder:text-slate-300 p-2 min-h-[100px]"
                                    placeholder="Type your message to the support team..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                ></textarea>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex gap-2">
                                        <button className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl border border-slate-100 transition-all"><Paperclip size={20} /></button>
                                        <button className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl border border-slate-100 transition-all"><Hash size={20} /></button>
                                    </div>
                                    <button onClick={handlePostComment} className="px-10 py-3.5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-4">
                                        Transmit Response <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-4 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 p-10">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Incident Meta</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center py-4 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Submitter</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-black text-slate-900">{ticket.submitted_by_details?.username}</span>
                                    <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[8px] font-black">{ticket.submitted_by_details?.username?.[0]?.toUpperCase()}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Protocol</span>
                                <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black text-slate-600 uppercase tracking-widest">{ticket.category.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Initialized</span>
                                <span className="text-xs font-black text-slate-900">{new Date(ticket.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-4">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pipeline Link</span>
                                <div className="flex items-center gap-2">
                                    {ticket.project_task ? (
                                        <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 size={12} strokeWidth={3} /> Integrated
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Standalone</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {ticket.project_task && (
                            <Link to={`/projects/${ticket.project_task_details?.project}`} className="mt-8 w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-50 hover:border-indigo-100 group transition-all">
                                <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest">View Linked Task</span>
                                <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </Link>
                        )}
                    </div>

                    {user?.role !== 'EMPLOYEE' && !ticket.project_task && (
                        <div className="bg-white rounded-[2.5rem] border-2 border-indigo-100 shadow-2xl shadow-indigo-100/30 p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 relative z-10">Workflow Integration</h3>
                            <p className="text-sm font-bold text-slate-600 mb-8 leading-relaxed relative z-10">Convert this incident report into an active task within a development workspace.</p>

                            <div className="space-y-6 relative z-10">
                                <select
                                    className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl py-4 px-6 text-xs font-black uppercase tracking-widest outline-none cursor-pointer transition-all"
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                >
                                    <option value="">Select Target Workspace...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleConvert}
                                    disabled={!selectedProject || isConverting}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                                >
                                    {isConverting ? 'Processing...' : (
                                        <>Deploy to Pipeline <Plus size={16} strokeWidth={3} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
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

// Required imports from page code logic
import { ArrowRight } from 'lucide-react';

export default TicketDetails;
