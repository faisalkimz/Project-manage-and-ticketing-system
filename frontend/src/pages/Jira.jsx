import { useState, useEffect } from 'react';
import {
    Layout, Search, Plus, Filter, MoreHorizontal,
    ChevronDown, List, Kanban, Info, Clock,
    CheckCircle2, AlertCircle, Bookmark, Star, Settings, Edit2, X,
    Calendar, User, Tag, ChevronRight, MoreVertical, Trash2
} from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import useAuthStore from '../store/authStore';

const Jira = () => {
    const { showToast } = useToast();
    const { user } = useAuthStore();

    const [columns, setColumns] = useState(() => {
        const saved = localStorage.getItem('jira_columns');
        return saved ? JSON.parse(saved) : [
            { id: 'TODO', title: 'To Do', color: 'bg-[#DFE1E6] text-[#42526E]' },
            { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-[#DEEBFF] text-[#0052CC]' },
            { id: 'REVIEW', title: 'Ready for Review', color: 'bg-[#EAE6FF] text-[#403294]' },
            { id: 'DONE', title: 'Done', color: 'bg-[#E3FCEF] text-[#006644]' },
        ];
    });

    const [tasks, setTasks] = useState([]);
    const [view, setView] = useState('board');
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [newTaskData, setNewTaskData] = useState({
        title: '',
        description: '',
        status: columns[0]?.id || 'TODO',
        priority: 'MEDIUM',
        project: ''
    });
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [activeDropdown, setActiveDropdown] = useState(null);

    useEffect(() => {
        localStorage.setItem('jira_columns', JSON.stringify(columns));
    }, [columns]);

    const handleAddColumn = () => {
        setIsAddColumnModalOpen(true);
    };

    const confirmAddColumn = (e) => {
        e.preventDefault();
        if (newColumnTitle.trim()) {
            const title = newColumnTitle.trim();
            const id = title.toUpperCase().replace(/\s+/g, '_');

            if (columns.find(c => c.id === id)) {
                showToast('Column already exists!', 'error');
                return;
            }

            setColumns([...columns, { id, title, color: 'bg-[#DFE1E6] text-[#42526E]' }]);
            showToast('Column added!', 'success');
            setNewColumnTitle('');
            setIsAddColumnModalOpen(false);
        }
    };

    const handleDeleteColumn = (id) => {
        if (window.confirm('Delete this column? Tasks in this column will be hidden unless you change their status.')) {
            setColumns(columns.filter(c => c.id !== id));
            showToast('Column removed.', 'info');
        }
    };

    const handleRenameColumn = (id) => {
        const col = columns.find(c => c.id === id);
        const newTitle = window.prompt('Rename column:', col.title);
        if (newTitle && newTitle !== col.title) {
            setColumns(columns.map(c => c.id === id ? { ...c, title: newTitle } : c));
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchProjects();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/projects/tasks/');
            setTasks(res.data);
        } catch (error) {
            console.error('Failed to fetch jira tasks', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects/projects/');
            setProjects(res.data);
            if (res.data.length > 0) {
                setNewTaskData(prev => ({ ...prev, project: res.data[0].id }));
            }
        } catch (error) {
            console.error('Failed to fetch projects', error);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/projects/tasks/', newTaskData);
            setTasks([...tasks, res.data]);
            setIsCreateModalOpen(false);
            setNewTaskData({ title: '', description: '', status: columns[0]?.id || 'TODO', priority: 'MEDIUM', project: projects[0]?.id || '' });
            showToast('Issue created successfully!', 'success');
        } catch (error) {
            showToast('Failed to create issue.', 'error');
        }
    };

    const handleUpdateStatus = async (taskId, newStatus) => {
        try {
            const res = await api.patch(`/projects/tasks/${taskId}/`, { status: newStatus });
            setTasks(tasks.map(t => t.id === taskId ? res.data : t));
            showToast(`Moved to ${newStatus.replace('_', ' ')}`, 'success');
        } catch (error) {
            showToast('Failed to update status.', 'error');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this issue?')) return;
        try {
            await api.delete(`/projects/tasks/${taskId}/`);
            setTasks(tasks.filter(t => t.id !== taskId));
            setSelectedTask(null);
            showToast('Issue deleted.', 'success');
        } catch (error) {
            showToast('Failed to delete issue.', 'error');
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
        const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
        return matchesSearch && matchesPriority && matchesStatus;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-[#FAFBFC]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052CC]"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Jira Header */}
            <header className="px-4 md:px-6 py-4 border-b border-[#DFE1E6] flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0052CC] rounded flex items-center justify-center text-white shrink-0">
                            <Kanban size={20} />
                        </div>
                        <h1 className="text-lg md:text-xl font-bold text-[#172B4D] whitespace-nowrap">Jira Software</h1>
                    </div>
                    <nav className="hidden lg:flex items-center gap-1">
                        {/* Your Work */}
                        <div className="relative">
                            <button
                                onClick={() => setActiveDropdown(activeDropdown === 'work' ? null : 'work')}
                                className="px-3 py-1.5 text-sm font-medium text-[#42526E] hover:bg-[#F4F5F7] rounded-sm flex items-center gap-1 whitespace-nowrap transition-colors"
                            >
                                Your work <ChevronDown size={14} />
                            </button>
                            {activeDropdown === 'work' && (
                                <div className="absolute top-full left-0 w-64 bg-white border border-[#DFE1E6] shadow-xl rounded-sm py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="px-3 py-1 text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Assigned to you</div>
                                    {tasks.filter(t => t.assigned_to === user?.id).slice(0, 5).map(task => (
                                        <button key={task.id} onClick={() => setSelectedTask(task)} className="w-full text-left px-3 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-sm bg-[#0052CC] shrink-0" />
                                            <span className="truncate">{task.title}</span>
                                        </button>
                                    ))}
                                    {tasks.filter(t => t.assigned_to === user?.id).length === 0 && (
                                        <div className="px-3 py-2 text-xs text-[#5E6C84] italic">No active tasks</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Projects */}
                        <div className="relative">
                            <button
                                onClick={() => setActiveDropdown(activeDropdown === 'projects' ? null : 'projects')}
                                className="px-3 py-1.5 text-sm font-medium text-[#42526E] hover:bg-[#F4F5F7] rounded-sm flex items-center gap-1 whitespace-nowrap transition-colors"
                            >
                                Projects <ChevronDown size={14} />
                            </button>
                            {activeDropdown === 'projects' && (
                                <div className="absolute top-full left-0 w-64 bg-white border border-[#DFE1E6] shadow-xl rounded-sm py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="px-3 py-1 text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Recent</div>
                                    {projects.slice(0, 5).map(p => (
                                        <Link key={p.id} to={`/projects/${p.id}`} className="w-full text-left px-3 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] flex items-center gap-2">
                                            <div className="w-6 h-6 bg-[#0052CC] rounded-[3px] flex items-center justify-center text-[10px] text-white font-bold">{p.name[0]}</div>
                                            <span className="truncate">{p.name}</span>
                                        </Link>
                                    ))}
                                    <div className="mx-2 my-1 border-t border-[#DFE1E6]" />
                                    <Link to="/projects" className="w-full text-left block px-3 py-2 text-sm text-[#0052CC] font-medium hover:bg-[#F4F5F7]">View all projects</Link>
                                </div>
                            )}
                        </div>

                        {/* Filters Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setActiveDropdown(activeDropdown === 'filters' ? null : 'filters')}
                                className="px-3 py-1.5 text-sm font-medium text-[#42526E] hover:bg-[#F4F5F7] rounded-sm flex items-center gap-1 whitespace-nowrap transition-colors"
                            >
                                Filters <ChevronDown size={14} />
                            </button>
                            {activeDropdown === 'filters' && (
                                <div className="absolute top-full left-0 w-64 bg-white border border-[#DFE1E6] shadow-xl rounded-sm py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="px-3 py-1 text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Saved Filters</div>
                                    <button className="w-full text-left px-3 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7]">My open issues</button>
                                    <button className="w-full text-left px-3 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7]">Reported by me</button>
                                    <div className="mx-2 my-1 border-t border-[#DFE1E6]" />
                                    <button className="w-full text-left px-3 py-2 text-sm text-[#0052CC] font-medium hover:bg-[#F4F5F7]">View all filters</button>
                                </div>
                            )}
                        </div>

                        {/* Dashboards */}
                        <div className="relative">
                            <button
                                onClick={() => setActiveDropdown(activeDropdown === 'dashboards' ? null : 'dashboards')}
                                className="px-3 py-1.5 text-sm font-medium text-[#42526E] hover:bg-[#F4F5F7] rounded-sm flex items-center gap-1 whitespace-nowrap transition-colors"
                            >
                                Dashboards <ChevronDown size={14} />
                            </button>
                            {activeDropdown === 'dashboards' && (
                                <div className="absolute top-full left-0 w-64 bg-white border border-[#DFE1E6] shadow-xl rounded-sm py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="px-3 py-1 text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Recent</div>
                                    <button className="w-full text-left px-3 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7]">Team Performance</button>
                                    <Link to="/dashboard" className="w-full text-left block px-3 py-2 text-sm text-[#0052CC] font-medium hover:bg-[#F4F5F7]">View all dashboards</Link>
                                </div>
                            )}
                        </div>
                    </nav>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-3 py-1 bg-[#0052CC] text-white text-sm font-bold rounded-sm hover:bg-[#0747A6] transition-colors whitespace-nowrap"
                    >
                        Create
                    </button>
                </div>

                <div className="flex items-center gap-2 md:gap-4 ml-4">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#42526E]" size={16} />
                        <input
                            type="text"
                            placeholder="Search Jira"
                            className="pl-10 pr-4 py-1.5 bg-[#FAFBFC] border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] focus:bg-white outline-none w-40 md:w-64 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="p-2 text-[#42526E] hover:bg-[#F4F5F7] rounded-full">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {/* Project Breadcrumbs */}
            <div className="px-4 md:px-6 py-4 flex items-center justify-between bg-white border-b border-[#DFE1E6]">
                <div className="flex items-center gap-2 text-sm overflow-hidden">
                    <span className="text-[#5E6C84] whitespace-nowrap">Projects</span>
                    <ChevronRight size={14} className="text-[#5E6C84] shrink-0" />
                    <span className="text-[#5E6C84] whitespace-nowrap">Mbabali Board (MB)</span>
                    <ChevronRight size={14} className="text-[#5E6C84] shrink-0" />
                    <span className="font-bold text-[#172B4D] whitespace-nowrap">Active Sprint</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#0052CC] flex items-center justify-center text-xs font-bold text-white">
                                {String.fromCharCode(65 + i)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* View Content */}
            <div className="px-4 md:px-6 py-4 md:py-6 flex flex-col flex-1 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#EBECF0] p-0.5 rounded-sm flex">
                            <button
                                onClick={() => setView('board')}
                                className={`px-3 py-1 rounded-sm text-xs font-bold flex items-center gap-2 transition-all ${view === 'board' ? 'bg-white shadow-sm text-[#0052CC]' : 'text-[#42526E] hover:bg-[#DFE1E6]'}`}
                            >
                                <Kanban size={14} />
                                Board
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`px-3 py-1 rounded-sm text-xs font-bold flex items-center gap-2 transition-all ${view === 'list' ? 'bg-white shadow-sm text-[#0052CC]' : 'text-[#42526E] hover:bg-[#DFE1E6]'}`}
                            >
                                <List size={14} />
                                Backlog
                            </button>
                        </div>
                        <div className="h-4 w-px bg-[#DFE1E6] hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <select
                                className="text-sm font-medium text-[#42526E] bg-[#FAFBFC] border border-[#DFE1E6] px-3 py-1 rounded-sm focus:border-[#0052CC] outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Statuses</option>
                                {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                            <select
                                className="text-sm font-medium text-[#42526E] bg-[#FAFBFC] border border-[#DFE1E6] px-3 py-1 rounded-sm focus:border-[#0052CC] outline-none"
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                            >
                                <option value="ALL">All Priorities</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#5E6C84] uppercase tracking-wider self-end md:self-auto">
                        Insights
                        <Info size={14} className="text-[#0052CC]" />
                    </div>
                </div>

                {view === 'board' ? (
                    /* Kanban Board */
                    <div className="flex flex-1 gap-4 overflow-x-auto pb-6 custom-scrollbar scroll-smooth max-w-full">
                        {columns.map(col => (
                            <div key={col.id} className="w-[280px] md:w-[320px] min-w-[280px] md:min-w-[320px] bg-[#F4F5F7] rounded-sm flex flex-col shadow-sm">
                                <div className="p-3 pb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest">{col.title}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.id === 'DONE' ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#DFE1E6] text-[#42526E]'}`}>
                                            {filteredTasks.filter(t => t.status === col.id).length}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === col.id ? null : col.id)}
                                            className="p-1 hover:bg-[#DFE1E6] rounded transition-colors"
                                        >
                                            <MoreHorizontal size={14} className="text-[#5E6C84]" />
                                        </button>
                                        {activeDropdown === col.id && (
                                            <div className="absolute right-0 top-full mt-1 bg-white border border-[#DFE1E6] shadow-xl rounded-sm py-1 z-50 w-40">
                                                <button onClick={() => { handleRenameColumn(col.id); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7]">Rename</button>
                                                <button onClick={() => { handleDeleteColumn(col.id); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-[#EB5A46] hover:bg-[#FFEBE6]">Delete</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar min-h-[150px]">
                                    {filteredTasks.filter(t => t.status === col.id).map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            className="bg-white p-3 rounded shadow-sm border border-transparent hover:border-[#0052CC] transition-all cursor-pointer group animate-in fade-in duration-200"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <p className="text-sm text-[#172B4D] leading-snug font-medium group-hover:text-[#0052CC] transition-colors">{task.title}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-sm ${task.priority === 'HIGH' ? 'bg-[#E54937]' : task.priority === 'MEDIUM' ? 'bg-[#FF9F1A]' : 'bg-[#0079BF]'}`} title={task.priority} />
                                                    <span className="text-[10px] font-bold text-[#5E6C84] hover:underline">
                                                        MB-{task.id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {task.due_date && <Clock size={12} className="text-[#DE350B]" title="Due date set" />}
                                                    <div className="w-6 h-6 rounded-full bg-[#EBECF0] flex items-center justify-center text-[10px] font-bold text-[#172B4D] border border-white">
                                                        {task.assigned_to_details?.username?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => {
                                            setNewTaskData(prev => ({ ...prev, status: col.id }));
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="w-full py-2 hover:bg-[#DFE1E6] rounded-sm text-sm text-[#42526E] flex items-center gap-2 px-2 transition-colors mt-2 font-medium"
                                    >
                                        <Plus size={16} />
                                        Create issue
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleAddColumn}
                            className="w-[280px] md:w-[320px] min-w-[280px] md:min-w-[320px] h-fit p-3 bg-transparent border-2 border-dashed border-[#DFE1E6] rounded-sm text-[#5E6C84] hover:bg-[#FAFBFC] hover:border-[#0052CC] hover:text-[#0052CC] transition-all font-bold text-sm uppercase flex items-center justify-center gap-2 mt-2"
                        >
                            <Plus size={18} />
                            Add Column
                        </button>
                    </div>
                ) : (
                    /* Backlog View */
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            {columns.map(col => (
                                <div key={col.id} className="border border-[#DFE1E6] rounded-sm bg-[#FAFBFC]">
                                    <div className="px-4 py-2 border-b border-[#DFE1E6] flex items-center justify-between bg-white">
                                        <div className="flex items-center gap-3">
                                            <ChevronDown size={14} className="text-[#5E6C84]" />
                                            <span className="text-sm font-bold text-[#42526E]">{col.title}</span>
                                            <span className="bg-[#DFE1E6] text-[#42526E] text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                                                {filteredTasks.filter(t => t.status === col.id).length} issues
                                            </span>
                                        </div>
                                        <button className="text-xs text-[#0052CC] font-bold hover:underline">Select all</button>
                                    </div>
                                    <div className="divide-y divide-[#DFE1E6]">
                                        {filteredTasks.filter(t => t.status === col.id).map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => setSelectedTask(task)}
                                                className="px-4 py-2 bg-white hover:bg-[#F4F5F7] flex items-center gap-4 cursor-pointer group transition-colors"
                                            >
                                                <div className="flex items-center gap-2 min-w-[100px]">
                                                    <CheckCircle2 size={16} className={col.id === 'DONE' ? 'text-green-500' : 'text-[#DFE1E6]'} />
                                                    <span className="text-xs font-bold text-[#5E6C84] group-hover:underline">MB-{task.id}</span>
                                                </div>
                                                <span className="text-sm text-[#172B4D] flex-1 truncate font-medium">{task.title}</span>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${task.priority === 'HIGH' ? 'bg-[#FFEBE6] text-[#BF2600]' :
                                                        task.priority === 'MEDIUM' ? 'bg-[#FFF0B3] text-[#172B4D]' : 'bg-[#E3FCEF] text-[#006644]'
                                                        }`}>
                                                        {task.priority}
                                                    </div>
                                                    <div className="w-6 h-6 rounded-full bg-[#EBECF0] flex items-center justify-center text-[10px] font-bold text-[#172B4D]">
                                                        {task.assigned_to_details?.username?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {tasks.filter(t => t.status === col.id).length === 0 && (
                                            <div className="px-4 py-8 text-center text-[#5E6C84] text-sm italic">
                                                No issues in {col.title}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => {
                                                setNewTaskData(prev => ({ ...prev, status: col.id }));
                                                setIsCreateModalOpen(true);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-[#42526E] hover:bg-[#F4F5F7] flex items-center gap-2 transition-colors"
                                        >
                                            <Plus size={14} />
                                            <span>Create issue</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Issue Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-sm w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b border-[#DFE1E6] flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[#172B4D]">Create Issue</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-[#5E6C84] hover:text-[#172B4D]"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Project</label>
                                <select
                                    className="trello-input"
                                    value={newTaskData.project}
                                    onChange={e => setNewTaskData({ ...newTaskData, project: e.target.value })}
                                    required
                                >
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Summary</label>
                                <input
                                    type="text"
                                    className="trello-input"
                                    value={newTaskData.title}
                                    onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })}
                                    required
                                    placeholder="What needs to be done?"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Description</label>
                                <textarea
                                    className="trello-input min-h-[100px]"
                                    value={newTaskData.description}
                                    onChange={e => setNewTaskData({ ...newTaskData, description: e.target.value })}
                                    placeholder="Add more details..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Priority</label>
                                    <select
                                        className="trello-input"
                                        value={newTaskData.priority}
                                        onChange={e => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Status</label>
                                    <select
                                        className="trello-input"
                                        value={newTaskData.status}
                                        onChange={e => setNewTaskData({ ...newTaskData, status: e.target.value })}
                                    >
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="REVIEW">Ready for Review</option>
                                        <option value="DONE">Done</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="trello-btn trello-btn-subtle">Cancel</button>
                                <button type="submit" className="trello-btn trello-btn-primary px-8">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Details Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-sm w-full max-w-4xl max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2 text-sm text-[#5E6C84]">
                                <Kanban size={16} />
                                <span>MB-{selectedTask.id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleDeleteTask(selectedTask.id)} className="p-2 text-[#5E6C84] hover:text-[#EB5A46] hover:bg-[#FFEBE6] rounded-sm transition-colors" title="Delete Issue">
                                    <Trash2 size={18} />
                                </button>
                                <button onClick={() => setSelectedTask(null)} className="p-2 text-[#5E6C84] hover:text-[#172B4D] hover:bg-[#F4F5F7] rounded-sm transition-colors text-[#5E6C84] hover:bg-[#F4F5F7]">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="lg:col-span-2 space-y-8">
                                    <h1 className="text-2xl font-bold text-[#172B4D] leading-tight">{selectedTask.title}</h1>

                                    <div>
                                        <h3 className="text-sm font-bold text-[#172B4D] mb-3">Description</h3>
                                        <p className="text-[#172B4D] text-[15px] leading-relaxed whitespace-pre-wrap">
                                            {selectedTask.description || "No description provided."}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-[#172B4D] mb-4">Activity</h3>
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-xs font-bold">U</div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Add a comment..."
                                                    className="w-full px-4 py-2 border border-[#DFE1E6] rounded-sm text-sm focus:border-[#0052CC] outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Status</label>
                                        <select
                                            className="w-full px-3 py-2 bg-[#F4F5F7] hover:bg-[#EBECF0] border-0 rounded-sm font-bold text-sm text-[#42526E] outline-none cursor-pointer"
                                            value={selectedTask.status}
                                            onChange={e => handleUpdateStatus(selectedTask.id, e.target.value)}
                                        >
                                            <option value="TODO">To Do</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="REVIEW">Ready for Review</option>
                                            <option value="DONE">Done</option>
                                        </select>
                                    </div>

                                    <div className="p-4 border border-[#DFE1E6] rounded-sm space-y-4 bg-[#FAFBFC]">
                                        <div>
                                            <h4 className="text-xs font-bold text-[#5E6C84] uppercase mb-2">Details</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-[#5E6C84]">Assignee</span>
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <div className="w-6 h-6 rounded-full bg-[#EBECF0] flex items-center justify-center text-[10px] font-bold">U</div>
                                                        {selectedTask.assigned_to_details?.username || "Unassigned"}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-[#5E6C84]">Priority</span>
                                                    <span className={`font-bold ${selectedTask.priority === 'HIGH' ? 'text-[#E54937]' : selectedTask.priority === 'MEDIUM' ? 'text-[#FF9F1A]' : 'text-[#0079BF]'}`}>
                                                        {selectedTask.priority}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-[#5E6C84]">Created</span>
                                                    <span className="text-[#172B4D]">{new Date(selectedTask.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Column Modal */}
            {isAddColumnModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <form onSubmit={confirmAddColumn}>
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between">
                                <h3 className="font-bold text-[#172B4D]">Add Column</h3>
                                <button type="button" onClick={() => setIsAddColumnModalOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded text-[#5E6C84]">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4">
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Column Title</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#FAFBFC] border-2 border-[#DFE1E6] rounded-sm focus:bg-white focus:border-[#0052CC] outline-none transition-all text-sm font-medium"
                                    placeholder="e.g. QA Review"
                                    value={newColumnTitle}
                                    onChange={e => setNewColumnTitle(e.target.value)}
                                />
                            </div>
                            <div className="p-4 border-t border-[#DFE1E6] flex justify-end gap-2 bg-[#F4F5F7]">
                                <button type="button" onClick={() => setIsAddColumnModalOpen(false)} className="px-4 py-2 hover:bg-[#EBECF0] rounded text-sm font-medium text-[#42526E]">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-[#0052CC] text-white rounded hover:bg-[#0065FF] text-sm font-bold shadow-sm">Add Column</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Jira;
