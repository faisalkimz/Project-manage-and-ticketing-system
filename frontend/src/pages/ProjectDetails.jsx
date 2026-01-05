import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Plus, MoreHorizontal, Clock, CheckCircle2, ListTodo,
    PlayCircle, Search, Filter, Hash, Paperclip, MessageSquare,
    Activity, History, User, Calendar, FileText, ArrowRight,
    Tag as TagIcon, X, Download, Trash2, Send, LayoutGrid, List,
    StopCircle, Timer as TimerIcon
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
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', due_date: '' });
    const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'

    // Time Tracking State
    const [activeTimer, setActiveTimer] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    const commentEndRef = useRef(null);

    const fetchProjectDetails = async () => {
        try {
            const [projectRes, tasksRes] = await Promise.all([
                api.get(`/projects/projects/${id}/`),
                api.get(`/projects/tasks/?project_id=${id}`)
            ]);
            setProject(projectRes.data);
            setTasks(tasksRes.data);
        } catch (error) {
            console.error('Failed to fetch project details', error);
        }
    };

    const fetchTaskSideData = async (task) => {
        try {
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

    const fetchActiveTimer = async () => {
        try {
            const res = await api.get('/time/entries/current/');
            if (res.data) {
                setActiveTimer(res.data);
                // Calculate initial elapsed time
                const start = new Date(res.data.start_time).getTime();
                const now = new Date().getTime();
                setElapsedTime(Math.floor((now - start) / 1000));
            } else {
                setActiveTimer(null);
                setElapsedTime(0);
            }
        } catch (error) {
            console.error('Failed to fetch timer', error);
        }
    };

    useEffect(() => {
        fetchProjectDetails();
        fetchActiveTimer();
    }, [id]);

    useEffect(() => {
        if (selectedTask) {
            fetchTaskSideData(selectedTask);
        }
    }, [selectedTask]);

    // Timer Ticking Logic
    useEffect(() => {
        let interval;
        if (activeTimer) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

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

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await api.post('/activity/comments/', {
                text: newComment,
                content_type: 'task',
                object_id: selectedTask.id
            });
            setComments(prev => [...prev, res.data]);
            setNewComment('');
            commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Failed to post comment', error);
        }
    };

    const toggleTimer = async () => {
        try {
            if (activeTimer && activeTimer.task === selectedTask.id) {
                // Stop
                await api.post('/time/entries/stop_timer/');
                setActiveTimer(null);
                setElapsedTime(0);
            } else {
                // Start (or switch)
                const res = await api.post('/time/entries/start_timer/', { task_id: selectedTask.id });
                setActiveTimer(res.data);
                setElapsedTime(0);
            }
        } catch (error) {
            console.error('Timer action failed', error);
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const columns = [
        { id: 'TODO', title: 'To Do', icon: ListTodo },
        { id: 'IN_PROGRESS', title: 'In Progress', icon: PlayCircle },
        { id: 'REVIEW', title: 'Review', icon: Clock },
        { id: 'DONE', title: 'Done', icon: CheckCircle2 },
    ];

    if (!project) return null;

    return (
        <div className="flex h-screen bg-white overflow-hidden animate-fade-in">
            {/* Main Content */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedTask ? 'mr-[400px]' : ''}`}>
                {/* Header */}
                <header className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between shrink-0 h-16">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/projects')} className="text-zinc-400 hover:text-zinc-600">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h1 className="text-lg font-semibold text-zinc-900 leading-none">{project.name}</h1>
                                <span className="bg-zinc-100 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 uppercase font-mono tracking-wide">
                                    {project.key || 'PRJ'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                <span>{tasks.length} issues</span>
                                <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                                <span>{project.active_members} members</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Global Active Timer Display */}
                        {activeTimer && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 animate-pulse">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                                <span className="text-xs font-mono font-bold">{formatTime(elapsedTime)}</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Active</span>
                            </div>
                        )}

                        <div className="bg-zinc-100 p-0.5 rounded-lg flex items-center border border-zinc-200">
                            <button
                                onClick={() => setViewMode('board')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                            >
                                <List size={16} />
                            </button>
                        </div>
                        <div className="h-6 w-[1px] bg-zinc-200 mx-1"></div>
                        <button onClick={() => setIsTaskModalOpen(true)} className="btn btn-primary">
                            <Plus size={16} /> New Issue
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-x-auto bg-zinc-50 p-6">
                    {/* ... (Board/List Views - same as before) ... */}
                    {viewMode === 'board' ? (
                        <div className="flex gap-6 h-full min-w-max">
                            {columns.map(column => (
                                <div key={column.id} className="w-[300px] flex flex-col">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <column.icon size={16} />
                                            <span className="text-sm font-medium">{column.title}</span>
                                            <span className="text-xs text-zinc-400 font-mono ml-1">{tasks.filter(t => t.status === column.id).length}</span>
                                        </div>
                                        <button onClick={() => { setNewTask({ ...newTask, status: column.id }); setIsTaskModalOpen(true); }} className="text-zinc-400 hover:text-zinc-600">
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                                        {tasks.filter(t => t.status === column.id).map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => setSelectedTask(task)}
                                                className={`group bg-white p-3 rounded-lg border border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer ${selectedTask?.id === task.id ? 'ring-2 ring-zinc-900 border-transparent' : ''}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] text-zinc-400 font-mono">TASK-{task.id.toString().slice(-4)}</span>
                                                    <div className="relative">
                                                        <div className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center text-[10px] text-zinc-600 font-medium">
                                                            {task.assigned_to_details?.username?.[0]?.toUpperCase() || '-'}
                                                        </div>
                                                        {activeTimer?.task === task.id && (
                                                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 border-2 border-white rounded-full"></div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm font-medium text-zinc-900 mb-2 line-clamp-2">{task.title}</p>
                                                <div className="flex items-center gap-2">
                                                    {task.priority === 'CRITICAL' || task.priority === 'HIGH' ? (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                                                            <Activity size={10} /> {task.priority}
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                                                            {task.priority}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border text-left border-zinc-200 rounded-lg overflow-hidden w-full max-w-5xl mx-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-20">ID</th>
                                        <th className="px-4 py-3 text-left">Title</th>
                                        <th className="px-4 py-3 text-left w-32">Status</th>
                                        <th className="px-4 py-3 text-left w-32">Priority</th>
                                        <th className="px-4 py-3 text-left w-40">Assignee</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {tasks.map(task => (
                                        <tr key={task.id} onClick={() => setSelectedTask(task)} className={`group hover:bg-zinc-50 cursor-pointer ${selectedTask?.id === task.id ? 'bg-zinc-50' : ''}`}>
                                            <td className="px-4 py-3 text-zinc-400 font-mono text-xs">#{task.id.toString().slice(-4)}</td>
                                            <td className="px-4 py-3 font-medium text-zinc-900">{task.title}</td>
                                            <td className="px-4 py-3 text-zinc-600 text-xs">{task.status.replace('_', ' ')}</td>
                                            <td className="px-4 py-3"><span className="text-[10px] border px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">{task.priority}</span></td>
                                            <td className="px-4 py-3 text-zinc-500 text-xs">{task.assigned_to_details?.username || 'Unassigned'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Task Detail Panel (Right Sidebar) */}
            {selectedTask && (
                <div className="fixed top-0 right-0 h-full w-[400px] bg-white border-l border-zinc-200 shadow-xl z-50 flex flex-col animate-slide-in">
                    <header className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                        <div className="flex items-center gap-2 text-zinc-500 text-xs">
                            <span className="font-mono">TASK-{selectedTask.id.toString().slice(-4)}</span>
                            <span>/</span>
                            <span>{selectedTask.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-1.5 hover:bg-zinc-200 rounded text-zinc-400 transition-colors"><MoreHorizontal size={16} /></button>
                            <button onClick={() => setSelectedTask(null)} className="p-1.5 hover:bg-zinc-200 rounded text-zinc-400 transition-colors"><X size={16} /></button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        <div>
                            <h2 className="text-xl font-semibold text-zinc-900 mb-4 leading-tight">{selectedTask.title}</h2>
                            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{selectedTask.description || "No description provided."}</p>
                        </div>

                        {/* Time Tracking Control */}
                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTimer?.task === selectedTask.id ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-zinc-200 text-zinc-400'}`}>
                                    <TimerIcon size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-900 uppercase tracking-wide">Time Tracker</p>
                                    <p className="text-sm font-mono text-zinc-600">
                                        {activeTimer?.task === selectedTask.id ? formatTime(elapsedTime) : '00:00:00'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleTimer}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTimer?.task === selectedTask.id
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                        : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm'
                                    }`}
                            >
                                {activeTimer?.task === selectedTask.id ? (
                                    <>
                                        <StopCircle size={14} /> Stop
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle size={14} /> Start
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            {/* ... (Existing Date/Assignee Logic) ... */}
                            <div className="space-y-1">
                                <span className="text-zinc-400 font-medium">Assignee</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                                        {selectedTask.assigned_to_details?.username?.[0]?.toUpperCase() || '-'}
                                    </div>
                                    <span className="text-zinc-700 font-medium">{selectedTask.assigned_to_details?.username || 'Unassigned'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-400 font-medium">Due Date</span>
                                <div className="flex items-center gap-2 text-zinc-700">
                                    <Calendar size={14} className="text-zinc-400" />
                                    <span>{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'None'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-zinc-100 pt-6">
                            <h3 className="text-xs font-semibold text-zinc-900 mb-4">Activity</h3>
                            <div className="space-y-6">
                                {comments.map((comment, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center text-[10px] font-medium text-zinc-600 shrink-0">
                                            {(comment.user_details?.username || 'U')[0].toUpperCase()}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-zinc-900">{comment.user_details?.username}</span>
                                                <span className="text-[10px] text-zinc-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-zinc-600">{comment.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex gap-2">
                                <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center text-[10px] font-medium mt-1">
                                    {user?.username?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg p-2 focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-400 transition-all">
                                    <textarea
                                        rows="2"
                                        placeholder="Add a comment..."
                                        className="w-full bg-transparent border-none outline-none text-sm resize-none"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    ></textarea>
                                    <div className="flex justify-end pt-2 border-t border-zinc-200/50 mt-2">
                                        <button onClick={handlePostComment} disabled={!newComment.trim()} className="text-xs font-medium text-white bg-zinc-900 px-3 py-1 rounded hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                            Comment
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div ref={commentEndRef} />
                        </div>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
                            <h3 className="font-semibold text-zinc-900">Create Issue</h3>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                            <div>
                                <input
                                    type="text"
                                    className="w-full text-lg font-medium placeholder:text-zinc-300 outline-none"
                                    placeholder="Issue title"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <textarea
                                    className="w-full text-sm text-zinc-600 placeholder:text-zinc-300 outline-none resize-none min-h-[80px]"
                                    placeholder="Add description..."
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <select
                                    className="bg-zinc-50 border border-zinc-200 text-xs rounded px-2 py-1 outline-none"
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                                <input
                                    type="date"
                                    className="bg-zinc-50 border border-zinc-200 text-xs rounded px-2 py-1 outline-none"
                                    value={newTask.due_date}
                                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end pt-4 border-t border-zinc-50">
                                <button type="submit" className="btn btn-primary">Create Issue</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
