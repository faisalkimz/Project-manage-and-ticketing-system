import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Plus, MoreHorizontal, Clock, CheckCircle2, ListTodo,
    PlayCircle, Search, Filter, Hash, Paperclip, MessageSquare,
    Activity, History, Subtitles, User, Calendar, FileText, ArrowRight,
    Tag as TagIcon, X, Download, Trash2, Send
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
    const [availableTags, setAvailableTags] = useState([]);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', due_date: '' });
    const [activeTab, setActiveTab] = useState('Comments');

    const commentEndRef = useRef(null);

    const fetchProjectDetails = async () => {
        try {
            const [projectRes, tasksRes, tagsRes] = await Promise.all([
                api.get(`/projects/projects/${id}/`),
                api.get(`/projects/tasks/?project_id=${id}`),
                api.get(`/projects/tags/`)
            ]);
            setProject(projectRes.data);
            setTasks(tasksRes.data);
            setAvailableTags(tagsRes.data);
        } catch (error) {
            console.error('Failed to fetch project details', error);
        }
    };

    const fetchTaskSideData = async (task) => {
        try {
            // Get content type for Task
            const [commentsRes, attachmentsRes] = await Promise.all([
                api.get(`/activity/comments/?content_type=task&object_id=${task.id}`),
                api.get(`/activity/attachments/?content_type=task&object_id=${task.id}`)
            ]);
            setComments(commentsRes.data);
            setAttachments(attachmentsRes.data);
        } catch (error) {
            console.error('Failed to fetch task side data', error);
        }
    };

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    useEffect(() => {
        if (selectedTask) {
            fetchTaskSideData(selectedTask);
        }
    }, [selectedTask]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/tasks/', { ...newTask, project: id });
            setIsTaskModalOpen(false);
            setNewTask({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', due_date: '' });
            fetchProjectDetails();
        } catch (error) {
            console.error('Failed to create task', error);
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        try {
            await api.patch(`/projects/tasks/${taskId}/`, { status: newStatus });
            fetchProjectDetails();
            if (selectedTask?.id === taskId) {
                setSelectedTask(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error('Failed to update task status', error);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await api.post('/activity/comments/', {
                text: newComment,
                content_type: 'task', // Lowercase model name for ContentType lookup
                object_id: selectedTask.id
            });
            setComments(prev => [...prev, res.data]);
            setNewComment('');
            commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Failed to post comment', error);
        }
    };

    const columns = [
        { id: 'TODO', title: 'To-do', icon: ListTodo, color: 'text-slate-400', barColor: 'bg-slate-300' },
        { id: 'IN_PROGRESS', title: 'On Progress', icon: PlayCircle, color: 'text-indigo-400', barColor: 'bg-indigo-500' },
        { id: 'REVIEW', title: 'In Review', icon: Clock, color: 'text-amber-400', barColor: 'bg-amber-400' },
        { id: 'DONE', title: 'Completed', icon: CheckCircle2, color: 'text-emerald-400', barColor: 'bg-emerald-500' },
    ];

    if (!project) return <div className="p-8 text-slate-500 flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-400 animate-pulse">Initializing Workspace...</p>
        </div>
    </div>;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden animate-fade-in font-display">
            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${selectedTask ? 'mr-[35%]' : ''}`}>
                <header className="relative h-56 flex-none overflow-hidden bg-slate-950 group">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-1000"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

                    <div className="absolute bottom-0 left-0 p-10 flex items-end gap-8 w-full">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl shrink-0 group-hover:rotate-6 transition-transform">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">
                                {project.name[0].toUpperCase()}
                            </div>
                        </div>
                        <div className="flex-1 pb-2">
                            <div className="flex items-center gap-3 text-white/50 mb-3">
                                <button onClick={() => navigate('/projects')} className="hover:text-white transition-colors flex items-center gap-1 font-bold text-[10px] uppercase tracking-[0.2em]">
                                    <ChevronLeft size={14} /> Back to Projects
                                </button>
                                <span className="opacity-20">/</span>
                                <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Operations</span>
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tight">{project.name}</h1>
                        </div>
                        <div className="flex gap-3 mb-2">
                            <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-white font-bold text-xs backdrop-blur-md transition-all">
                                <Plus size={16} className="inline mr-2" /> Invite Team
                            </button>
                            <button className="p-2.5 bg-white rounded-2xl shadow-xl shadow-black/10 text-slate-900 hover:scale-110 active:scale-90 transition-all">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="bg-white border-b border-slate-200 px-10 py-4 flex items-center justify-between shadow-sm z-20">
                    <div className="flex items-center gap-8">
                        <nav className="flex gap-8">
                            {['Kanban', 'List', 'Timeline', 'Files'].map(tab => (
                                <button key={tab} className={`text-[10px] font-black uppercase tracking-widest pb-4 -mb-4 transition-all border-b-2 ${tab === 'Kanban' ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                    {tab}
                                </button>
                            ))}
                        </nav>
                        <div className="h-4 w-[1px] bg-slate-100"></div>
                        <div className="flex items-center gap-1.5">
                            {project.members_details?.map((m, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white -ml-2 bg-slate-900 text-[10px] flex items-center justify-center font-black text-white shadow-md ring-1 ring-slate-100" title={m.username}>
                                    {m.username[0].toUpperCase()}
                                </div>
                            ))}
                            <button className="w-8 h-8 rounded-full border border-dashed border-slate-300 -ml-2 bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input type="text" placeholder="Search workflow..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all outline-none w-56" />
                        </div>
                        <button onClick={() => setIsTagsModalOpen(true)} className="p-2 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all">
                            <TagIcon size={18} />
                        </button>
                        <button onClick={() => setIsTaskModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                            <Plus size={16} /> New Task
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-10 overflow-x-auto bg-slate-50/50">
                    <div className="flex gap-8 h-full min-w-max">
                        {columns.map(column => (
                            <div key={column.id} className="w-[320px] flex flex-col bg-slate-100/40 rounded-3xl p-4 border border-slate-200/50 shadow-sm">
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 ${column.barColor} rounded-full shadow-lg`}></div>
                                        <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest">{column.title}</h3>
                                        <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-400 text-[10px] font-black">{tasks.filter(t => t.status === column.id).length}</span>
                                    </div>
                                    <button className="p-1.5 hover:bg-white rounded-xl transition-all"><MoreHorizontal size={16} className="text-slate-300" /></button>
                                </div>

                                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {tasks.filter(t => t.status === column.id).map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            className={`group card p-5 rounded-[1.5rem] border-slate-100 border bg-white hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer relative ${selectedTask?.id === task.id ? 'ring-2 ring-indigo-600 border-transparent' : ''}`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex gap-1.5">
                                                    {task.priority === 'CRITICAL' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${task.priority === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                                                            task.priority === 'HIGH' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'
                                                        }`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[8px] font-black text-white shadow-sm overflow-hidden group-hover:scale-110 transition-transform">
                                                    {task.assigned_to_details?.username?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                            </div>

                                            <h4 className="font-extrabold text-slate-900 mb-2 leading-snug group-hover:text-indigo-600 transition-colors tracking-tight text-sm">{task.title}</h4>

                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {task.tags_details?.map(tag => (
                                                    <span key={tag.id} className="px-2 py-0.5 rounded text-[8px] font-bold border border-slate-100 bg-slate-50 text-slate-500" style={{ borderColor: `${tag.color}20`, color: tag.color }}>
                                                        {tag.name}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                    <Calendar size={12} strokeWidth={3} />
                                                    <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <MessageSquare size={12} /> <span className="text-[9px] font-bold">0</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button onClick={() => { setNewTask({ ...newTask, status: column.id }); setIsTaskModalOpen(true); }} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] hover:border-indigo-300 hover:bg-white hover:text-indigo-600 transition-all flex items-center justify-center gap-3 group">
                                        <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-12 transition-all"><Plus size={12} strokeWidth={4} /></div>
                                        Create New
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Task Detail Sidebar (Image 2 & 5 Style) */}
            {selectedTask && (
                <div className="fixed top-0 right-0 h-full w-[35%] bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] z-[100] transform transition-transform duration-500 ease-out flex flex-col border-l border-slate-100 animate-slide-in">
                    <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">In Context / {selectedTask.status.replace('_', ' ')}</p>
                                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">System Workflow</h3>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><MoreHorizontal size={20} /></button>
                            <button onClick={() => setSelectedTask(null)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{selectedTask.title}</h2>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-slate-600 text-sm leading-relaxed relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><MessageSquare size={64} /></div>
                                <p className="relative z-10">{selectedTask.description || "Project contributors haven't added a description yet."}</p>
                            </div>
                        </section>

                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Task Lead</label>
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors cursor-pointer">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-200">
                                        {selectedTask.assigned_to_details?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 leading-none mb-0.5">{selectedTask.assigned_to_details?.username || "Unassigned"}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{selectedTask.assigned_to_details?.role || "Team"}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Deployment</label>
                                <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 leading-none mb-0.5">{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "TBD"}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Target Date</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shared Assets ({attachments.length})</h4>
                                <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Plus size={18} /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {attachments.map((file, i) => (
                                    <div key={i} className="group p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all cursor-pointer relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Download size={12} className="text-indigo-600" />
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Paperclip size={18} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-900 truncate pr-4">{file.file.split('/').pop()}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Uploaded {new Date(file.uploaded_at).toLocaleDateString()}</p>
                                    </div>
                                ))}
                                <div className="border-2 border-dashed border-slate-200 rounded-[1.5rem] p-6 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-slate-50/50 transition-all cursor-pointer text-slate-300 hover:text-indigo-600">
                                    <Plus size={20} strokeWidth={3} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Add File</span>
                                </div>
                            </div>
                        </section>

                        <section className="pb-12">
                            <div className="flex gap-10 border-b border-slate-50 mb-8 overflow-x-auto custom-scrollbar no-scrollbar">
                                {['Comments', 'Activity', 'Subtasks'].map(tab => (
                                    <button key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-300 hover:text-slate-500'}`}>
                                        {tab} {tab === 'Comments' ? `(${comments.length})` : ''}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'Comments' && (
                                <div className="space-y-8 mb-10">
                                    {comments.map((comment, i) => (
                                        <div key={i} className="flex gap-4 group">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg shadow-slate-200">
                                                {(comment.user_details?.username || 'U')[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-black text-slate-900">{comment.user_details?.username || 'Member'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(comment.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none text-xs text-slate-600 leading-relaxed group-hover:border-indigo-100 transition-colors">
                                                    {comment.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={commentEndRef} />
                                </div>
                            )}

                            {activeTab === 'Comments' && (
                                <div className="p-4 bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-100/50 flex flex-col gap-4">
                                    <textarea
                                        rows="3"
                                        placeholder="Type your feedback here..."
                                        className="w-full bg-transparent border-none outline-none text-xs font-medium resize-none placeholder:text-slate-300 p-2"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    ></textarea>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                        <div className="flex gap-2">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Paperclip size={16} /></button>
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><TagIcon size={16} /></button>
                                        </div>
                                        <button onClick={handlePostComment} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] flex items-center gap-3 uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                                            Send <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            )}

            {/* Task Creation Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
                        <div className="p-10 border-b border-slate-50 bg-slate-50/50">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">Initialize Task</h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.1em]">Assigning workflow to {newTask.status}</p>
                        </div>
                        <form onSubmit={handleCreateTask} className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-2xl py-4 px-6 text-sm font-bold shadow-sm transition-all outline-none"
                                    placeholder="Task objective..."
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Overview</label>
                                <textarea
                                    className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-2xl py-4 px-6 text-sm font-medium shadow-sm transition-all outline-none min-h-[100px] resize-none"
                                    placeholder="Deep dive into details..."
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Priority</label>
                                    <select
                                        className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl py-4 px-6 text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                    >
                                        <option value="LOW">Low Level</option>
                                        <option value="MEDIUM">Medium Level</option>
                                        <option value="HIGH">High Level</option>
                                        <option value="CRITICAL">Critical Path</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl py-4 px-6 text-xs font-black tracking-widest outline-none"
                                        value={newTask.due_date}
                                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-6">
                                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Execute Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx="true">{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default ProjectDetails;
