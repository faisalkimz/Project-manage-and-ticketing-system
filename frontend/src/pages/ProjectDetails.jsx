import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, Star, MoreHorizontal, X, Users, Share2, Clock, MessageSquare,
    Paperclip, Tag, ChevronDown, List, Calendar as CalendarIcon, Layout, GitMerge
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import CalendarView from '../components/CalendarView';
import GanttChart from '../components/GanttChart';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', due_date: '' });
    const [viewMode, setViewMode] = useState('board');
    const [allUsers, setAllUsers] = useState([]);
    const [activeTimer, setActiveTimer] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isAddingCard, setIsAddingCard] = useState({ columnId: null, title: '' });

    // Modal states
    const [showShareModal, setShowShareModal] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showLabelsModal, setShowLabelsModal] = useState(false);
    const [showDatesModal, setShowDatesModal] = useState(false);
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const [tempDueDate, setTempDueDate] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [attachments, setAttachments] = useState([]);

    const [activeListMenu, setActiveListMenu] = useState(null);
    const [activeCardMenu, setActiveCardMenu] = useState(null);
    const [shareEmail, setShareEmail] = useState('');

    const fetchProjectDetails = async () => {
        try {
            const [projectRes, tasksRes, userRes] = await Promise.all([
                api.get(`/projects/projects/${id}/`),
                api.get(`/projects/tasks/?project_id=${id}`),
                api.get('/users/list/')
            ]);
            setProject(projectRes.data);
            setTasks(tasksRes.data);
            setAllUsers(userRes.data);
        } catch (error) { console.error(error); }
    };

    const fetchTaskSideData = async (task) => {
        try {
            const [commentsRes, attachmentsRes] = await Promise.all([
                api.get(`/activity/comments/?content_type=task&object_id=${task.id}`),
                api.get(`/activity/attachments/?content_type=task&object_id=${task.id}`)
            ]);
            setComments(commentsRes.data);
            setAttachments(attachmentsRes.data);
        } catch (error) { console.error(error); }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !selectedTask) return;

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('content_type_name', 'task');
            formData.append('object_id', selectedTask.id);

            await api.post('/activity/attachments/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSelectedFile(null);
            setShowAttachmentModal(false);
            fetchTaskSideData(selectedTask);
        } catch (error) {
            alert('Failed to upload file. Please try again.');
        }
    };

    useEffect(() => {
        fetchProjectDetails();
        const fetchCurrentTimer = async () => {
            try {
                const res = await api.get('/time/entries/current/');
                if (res.data) {
                    setActiveTimer(res.data);
                    const start = new Date(res.data.start_time).getTime();
                    setElapsedTime(Math.floor((new Date().getTime() - start) / 1000));
                }
            } catch (e) { }
        };
        fetchCurrentTimer();
    }, [id]);

    useEffect(() => {
        if (selectedTask) fetchTaskSideData(selectedTask);
    }, [selectedTask]);

    useEffect(() => {
        let interval;
        if (activeTimer) interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [activeTimer]);

    useEffect(() => {
        const handleClickOutside = () => {
            if (showMoreMenu) setShowMoreMenu(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showMoreMenu]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/tasks/', { ...newTask, project: id });
            setIsTaskModalOpen(false);
            setNewTask({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', due_date: '' });
            fetchProjectDetails();
        } catch (error) { }
    };

    const handleQuickAddCard = async (columnId) => {
        if (!isAddingCard.title.trim()) return;
        try {
            await api.post('/projects/tasks/', {
                title: isAddingCard.title,
                project: id,
                status: columnId,
                priority: 'MEDIUM'
            });
            setIsAddingCard({ columnId: null, title: '' });
            fetchProjectDetails();
        } catch (error) { }
    };

    const handleUpdateTask = async (taskId, data) => {
        try {
            await api.patch(`/projects/tasks/${taskId}/`, data);
            fetchProjectDetails();
            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask({ ...selectedTask, ...data });
            }
        } catch (error) { }
    };

    const startTimer = async (taskId) => {
        try {
            const res = await api.post('/time/entries/start_timer/', { task_id: taskId });
            setActiveTimer(res.data);
            setElapsedTime(0);
        } catch (error) { }
    };

    const stopTimer = async () => {
        try {
            await api.post('/time/entries/stop_timer/');
            setActiveTimer(null);
            setElapsedTime(0);
            fetchProjectDetails();
        } catch (error) { }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post('/activity/comments/', {
                text: newComment,
                content_type_name: 'task',
                object_id: selectedTask.id
            });
            setNewComment('');
            fetchTaskSideData(selectedTask);
        } catch (error) {
            console.error('Failed to post comment:', error);
        }
    };

    const handleAssignMember = async (userId) => {
        try {
            await handleUpdateTask(selectedTask.id, { assigned_to: userId });
            setShowMembersModal(false);
        } catch (error) { }
    };

    const handleUpdatePriority = async (priority) => {
        try {
            await handleUpdateTask(selectedTask.id, { priority });
            setShowLabelsModal(false);
        } catch (error) { }
    };

    const handleUpdateDueDate = async () => {
        if (!tempDueDate) return;
        try {
            await handleUpdateTask(selectedTask.id, { due_date: tempDueDate });
            setShowDatesModal(false);
            setTempDueDate('');
        } catch (error) { }
    };

    const handleMoveAllCards = async (sourceStatus, targetStatus) => {
        if (sourceStatus === targetStatus) return;
        const tasksToMove = tasks.filter(t => t.status === sourceStatus);

        // Optimistic update
        const updatedTasks = tasks.map(t => t.status === sourceStatus ? { ...t, status: targetStatus } : t);
        setTasks(updatedTasks);
        setActiveListMenu(null);

        try {
            await Promise.all(tasksToMove.map(t => api.patch(`/projects/tasks/${t.id}/`, { status: targetStatus })));
            fetchProjectDetails();
        } catch (e) { console.error('Move failed', e); }
    };

    const handleSortList = (columnId, criteria) => {
        const colTasks = tasks.filter(t => t.status === columnId);
        const otherTasks = tasks.filter(t => t.status !== columnId);

        const sorted = colTasks.sort((a, b) => {
            if (criteria === 'date') return new Date(a.created_at) - new Date(b.created_at); // Newest first
            if (criteria === 'priority') {
                const p = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                return p[a.priority] - p[b.priority];
            }
            return 0;
        });

        setTasks([...otherTasks, ...sorted]);
        setActiveListMenu(null);
    };

    const handleMoveCard = async (taskId, targetStatus) => {
        try {
            // Optimistic update for better UI feel
            if (activeCardMenu) {
                setTasks(tasks.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
                setActiveCardMenu(null);
            }

            await api.patch(`/projects/tasks/${taskId}/`, { status: targetStatus });
            fetchProjectDetails(); // Sync to be sure

            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask({ ...selectedTask, status: targetStatus });
            }
        } catch (error) {
            fetchProjectDetails(); // Revert on failure
        }
    };

    const handleDeleteCard = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this card?')) return;
        try {
            await api.delete(`/projects/tasks/${taskId}/`);
            fetchProjectDetails();
            setActiveCardMenu(null);
            if (selectedTask?.id === taskId) setSelectedTask(null);
        } catch (error) { }
    };

    // More Menu Actions
    const copyBoardLink = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link).then(() => {
            alert('Board link copied to clipboard!');
            setShowMoreMenu(false);
        });
    };

    const printBoard = () => {
        window.print();
        setShowMoreMenu(false);
    };

    const toggleWatch = async () => {
        // In a real app, this would update watch status in backend
        alert('Watch feature toggled!');
        setShowMoreMenu(false);
    };

    const changeBackground = () => {
        alert('Background customization coming soon!');
        setShowMoreMenu(false);
    };

    const openSettings = () => {
        alert('Project settings coming soon!');
        setShowMoreMenu(false);
    };

    // Share Functionality removed duplicate state


    const handleShareBoard = async (e) => {
        e.preventDefault();
        if (!shareEmail.trim()) return;

        try {
            // Send invitation email - you can implement this with your backend
            await api.post('/users/invites/', {
                email: shareEmail,
                role_name: 'DEVELOPER'
            });
            alert(`Invitation sent to ${shareEmail}!`);
            setShareEmail('');
            setShowShareModal(false);
            fetchProjectDetails();
        } catch (error) {
            alert('Failed to send invitation. Please try again.');
        }
    };

    const copyShareLink = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link).then(() => {
            alert('Share link copied to clipboard!');
        });
    };

    if (!project) return <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0079BF] to-[#026AA7]"><div className="text-white">Loading...</div></div>;

    const columns = [
        { id: 'TODO', title: 'To Do' },
        { id: 'IN_PROGRESS', title: 'Doing' },
        { id: 'REVIEW', title: 'Review' },
        { id: 'DONE', title: 'Done' }
    ];

    const rootTasks = tasks.filter(t => !t.parent_task);

    const getPriorityColor = (p) => {
        switch (p) {
            case 'CRITICAL': return '#EB5A46';
            case 'HIGH': return '#FF9F1A';
            case 'MEDIUM': return '#F2D600';
            default: return '#61BD4F';
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-[#0079BF] to-[#026AA7] overflow-hidden">
            {/* Trello Board Header */}
            <header className="h-12 px-2 py-1.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    {/* Board Title */}
                    <button className="px-3 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-sm font-semibold text-sm transition-colors flex items-center gap-2">
                        {project.name}
                    </button>

                    {/* Star */}
                    <button className="p-2 hover:bg-white/20 rounded-sm transition-colors">
                        <Star size={16} className="text-white" />
                    </button>

                    {/* View Selector */}
                    <div className="flex items-center gap-0.5 bg-white/10 p-0.5 rounded-sm ml-2">
                        <button
                            onClick={() => setViewMode('board')}
                            className={`px-2 py-1 rounded-sm text-xs font-medium transition-colors ${viewMode === 'board' ? 'bg-white/30 text-white' : 'text-white/80 hover:bg-white/20'
                                }`}
                        >
                            <Layout size={14} className="inline mr-1" />
                            Board
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-2 py-1 rounded-sm text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-white/30 text-white' : 'text-white/80 hover:bg-white/20'
                                }`}
                        >
                            <List size={14} className="inline mr-1" />
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-2 py-1 rounded-sm text-xs font-medium transition-colors ${viewMode === 'calendar' ? 'bg-white/30 text-white' : 'text-white/80 hover:bg-white/20'
                                }`}
                        >
                            <CalendarIcon size={14} className="inline mr-1" />
                            Calendar
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`px-2 py-1 rounded-sm text-xs font-medium transition-colors ${viewMode === 'timeline' ? 'bg-white/30 text-white' : 'text-white/80 hover:bg-white/20'
                                }`}
                        >
                            <GitMerge size={14} className="inline mr-1" transform="rotate(90)" />
                            Timeline
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Members */}
                    <div className="flex -space-x-1">
                        {project.members_details?.slice(0, 4).map((m, i) => (
                            <div
                                key={i}
                                title={m.username}
                                className="w-8 h-8 rounded-full bg-white text-[#0079BF] border-2 border-[#0079BF] flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform"
                            >
                                {m.username[0].toUpperCase()}
                            </div>
                        ))}
                    </div>

                    {/* Share */}
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="px-3 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-sm text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                        <Share2 size={14} />
                        Share
                    </button>

                    {/* More */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMoreMenu(!showMoreMenu);
                            }}
                            className="p-2 hover:bg-white/20 rounded-sm transition-colors"
                        >
                            <MoreHorizontal size={16} className="text-white" />
                        </button>

                        {/* More Menu Dropdown */}
                        {showMoreMenu && (
                            <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg py-2 z-50">
                                <button
                                    onClick={copyBoardLink}
                                    className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
                                >
                                    Copy board link
                                </button>
                                <button
                                    onClick={printBoard}
                                    className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
                                >
                                    Print and export
                                </button>
                                <button
                                    onClick={toggleWatch}
                                    className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
                                >
                                    Watch
                                </button>
                                <div className="border-t border-[#DFE1E6] my-1"></div>
                                <button
                                    onClick={changeBackground}
                                    className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
                                >
                                    Change background
                                </button>
                                <button
                                    onClick={openSettings}
                                    className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
                                >
                                    Settings
                                </button>
                                <div className="border-t border-[#DFE1E6] my-1"></div>
                                <button
                                    onClick={() => navigate('/projects')}
                                    className="w-full text-left px-4 py-2 text-sm text-[#EB5A46] hover:bg-[#F4F5F7] transition-colors"
                                >
                                    Close board
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Board Content */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden p-3 flex gap-3">
                {viewMode === 'board' && columns.map((col) => (
                    <div key={col.id} className="flex flex-col w-72 shrink-0">
                        {/* List Header */}
                        <div className="bg-[#EBECF0] rounded-t-lg px-3 py-2 flex items-center justify-between relative">
                            <h3 className="text-sm font-semibold text-[#172B4D]">
                                {col.title} <span className="text-[#5E6C84] font-normal">{rootTasks.filter(t => t.status === col.id).length}</span>
                            </h3>
                            <button
                                onClick={() => setActiveListMenu(activeListMenu === col.id ? null : col.id)}
                                className="p-1 hover:bg-[#DFE1E6] rounded transition-colors"
                            >
                                <MoreHorizontal size={16} className="text-[#5E6C84]" />
                            </button>

                            {/* List Actions Menu */}
                            {activeListMenu === col.id && (
                                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl z-20 border border-[#DFE1E6] animate-scale-in">
                                    <div className="p-2 border-b border-[#DFE1E6] bg-[#F4F5F7]">
                                        <h4 className="text-xs font-semibold text-[#5E6C84] text-center">List Actions</h4>
                                    </div>
                                    <div className="p-2">
                                        <p className="text-xs font-semibold text-[#5E6C84] mb-1 px-2">Sort By...</p>
                                        <button onClick={() => handleSortList(col.id, 'date')} className="w-full text-left px-2 py-1.5 text-sm text-[#172B4D] hover:bg-[#F4F5F7] rounded">Date Created (Newest)</button>
                                        <button onClick={() => handleSortList(col.id, 'priority')} className="w-full text-left px-2 py-1.5 text-sm text-[#172B4D] hover:bg-[#F4F5F7] rounded">Priority (Highest)</button>
                                    </div>
                                    <div className="border-t border-[#DFE1E6] p-2">
                                        <p className="text-xs font-semibold text-[#5E6C84] mb-1 px-2">Move All Cards To...</p>
                                        {columns.filter(c => c.id !== col.id).map(target => (
                                            <button
                                                key={target.id}
                                                onClick={() => handleMoveAllCards(col.id, target.id)}
                                                className="w-full text-left px-2 py-1.5 text-sm text-[#172B4D] hover:bg-[#F4F5F7] rounded"
                                            >
                                                {target.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cards Container */}
                        <div className="bg-[#EBECF0] flex-1 overflow-y-auto px-2 pb-24 space-y-2 rounded-b-lg custom-scrollbar">
                            {rootTasks.filter(t => t.status === col.id).map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-2 group relative"
                                >
                                    {/* Label Strip */}
                                    {task.priority && (
                                        <div className="flex gap-1 mb-2 justify-between">
                                            <div
                                                className="h-2 w-10 rounded-sm"
                                                style={{ backgroundColor: getPriorityColor(task.priority) }}
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveCardMenu(activeCardMenu === task.id ? null : task.id); }}
                                                className={`p-0.5 hover:bg-[#EBECF0] rounded ${activeCardMenu === task.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                                            >
                                                <MoreHorizontal size={14} className="text-[#5E6C84]" />
                                            </button>
                                        </div>
                                    )}

                                    {!task.priority && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveCardMenu(activeCardMenu === task.id ? null : task.id); }}
                                            className={`absolute top-2 right-2 p-1 hover:bg-[#EBECF0] rounded ${activeCardMenu === task.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-10`}
                                        >
                                            <MoreHorizontal size={14} className="text-[#5E6C84]" />
                                        </button>
                                    )}

                                    {/* Card Context Menu */}
                                    {activeCardMenu === task.id && (
                                        <div className="absolute top-8 right-2 w-48 bg-white rounded shadow-xl z-20 border border-[#DFE1E6] animate-scale-in" onClick={e => e.stopPropagation()}>
                                            <div className="p-2 border-b border-[#DFE1E6] bg-[#F4F5F7]">
                                                <h4 className="text-xs font-semibold text-[#5E6C84] text-center">Card Actions</h4>
                                            </div>
                                            <div className="p-2">
                                                <p className="text-xs font-semibold text-[#5E6C84] mb-1 px-2">Move to...</p>
                                                {columns.map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => handleMoveCard(task.id, c.id)}
                                                        className={`w-full text-left px-2 py-1.5 text-sm rounded ${task.status === c.id ? 'bg-blue-50 text-[#0079BF] font-semibold' : 'text-[#172B4D] hover:bg-[#F4F5F7]'}`}
                                                    >
                                                        {c.title}
                                                    </button>
                                                ))}
                                                <div className="border-t border-[#DFE1E6] my-1"></div>
                                                <button onClick={() => handleDeleteCard(task.id)} className="w-full text-left px-2 py-1.5 text-sm text-[#EB5A46] hover:bg-[#FFF0F0] rounded">Delete Card</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Card Title */}
                                    <p className="text-sm text-[#172B4D] mb-2 break-words">{task.title}</p>

                                    {/* Card Badges */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {task.due_date && (
                                            <div className="flex items-center gap-1 text-xs text-[#5E6C84] bg-[#F4F5F7] px-1.5 py-0.5 rounded hover:bg-[#EBECF0]">
                                                <Clock size={12} />
                                                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </div>
                                        )}
                                        {task.comment_count > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-[#5E6C84] hover:bg-[#F4F5F7] px-1 rounded">
                                                <MessageSquare size={12} />
                                                {task.comment_count}
                                            </div>
                                        )}
                                        {task.assigned_to_details && (
                                            <div
                                                className="ml-auto w-6 h-6 rounded-full bg-[#DFE1E6] flex items-center justify-center text-[9px] font-semibold text-[#172B4D]"
                                                title={task.assigned_to_details.username}
                                            >
                                                {task.assigned_to_details.username[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Add Card Button/Form */}
                            {isAddingCard.columnId === col.id ? (
                                <div className="bg-white rounded-lg shadow-sm p-2">
                                    <textarea
                                        autoFocus
                                        placeholder="Enter a title for this card..."
                                        className="w-full text-sm text-[#172B4D] outline-none resize-none mb-2"
                                        rows="2"
                                        value={isAddingCard.title}
                                        onChange={(e) => setIsAddingCard({ ...isAddingCard, title: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleQuickAddCard(col.id);
                                            }
                                            if (e.key === 'Escape') {
                                                setIsAddingCard({ columnId: null, title: '' });
                                            }
                                        }}
                                    />
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleQuickAddCard(col.id)}
                                            className="px-3 py-1.5 bg-[#0079BF] text-white text-sm font-medium rounded hover:bg-[#026AA7] transition-colors"
                                        >
                                            Add card
                                        </button>
                                        <button
                                            onClick={() => setIsAddingCard({ columnId: null, title: '' })}
                                            className="p-1.5 hover:bg-[#EBECF0] rounded transition-colors"
                                        >
                                            <X size={16} className="text-[#5E6C84]" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingCard({ columnId: col.id, title: '' })}
                                    className="w-full text-left px-2 py-2 text-[#5E6C84] hover:bg-[#DFE1E6] rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    Add a card
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* List View */}
                {viewMode === 'list' && (
                    <div className="w-full bg-white rounded-lg m-2 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-[#F4F5F7] border-b border-[#DFE1E6]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5E6C84] uppercase">Card</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5E6C84] uppercase">List</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5E6C84] uppercase">Members</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5E6C84] uppercase">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#DFE1E6]">
                                {rootTasks.map((task) => (
                                    <tr
                                        key={task.id}
                                        onClick={() => setSelectedTask(task)}
                                        className="hover:bg-[#F4F5F7] cursor-pointer"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {task.priority && (
                                                    <div className="w-1 h-6 rounded" style={{ backgroundColor: getPriorityColor(task.priority) }} />
                                                )}
                                                <span className="text-sm text-[#172B4D] font-medium">{task.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#5E6C84]">
                                            {columns.find(c => c.id === task.status)?.title}
                                        </td>
                                        <td className="px-4 py-3">
                                            {task.assigned_to_details && (
                                                <div className="w-7 h-7 rounded-full bg-[#DFE1E6] flex items-center justify-center text-xs font-semibold">
                                                    {task.assigned_to_details.username[0].toUpperCase()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#5E6C84]">
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Calendar View */}
                {viewMode === 'calendar' && (
                    <div className="w-full bg-white rounded-lg m-2 p-4 overflow-hidden shadow-sm">
                        <CalendarView tasks={tasks} />
                    </div>
                )}

                {/* Timeline View */}
                {viewMode === 'timeline' && (
                    <div className="w-full bg-white rounded-lg m-2 p-4 overflow-hidden shadow-sm">
                        <GanttChart tasks={tasks} />
                    </div>
                )}

                {/* Add Another List (Removed as backend has fixed statuses) */}
            </main>

            {/* Card Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-12 overflow-y-auto" onClick={() => setSelectedTask(null)}>
                    <div className="bg-[#F4F5F7] rounded-lg w-full max-w-3xl mb-12 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="p-6">
                            <div className="flex items-start gap-3">
                                <Tag size={20} className="text-[#5E6C84] mt-1" />
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        className="w-full text-xl font-semibold text-[#172B4D] bg-transparent border-none outline-none px-2 -ml-2 py-1 rounded hover:bg-white focus:bg-white"
                                        value={selectedTask.title}
                                        onChange={(e) => handleUpdateTask(selectedTask.id, { title: e.target.value })}
                                    />
                                    <div className="flex items-center gap-2 mt-1 px-2">
                                        <span className="text-sm text-[#5E6C84]">in list</span>
                                        <select
                                            className="text-sm font-medium text-[#172B4D] bg-transparent underline cursor-pointer outline-none hover:bg-[#EBECF0] rounded px-1"
                                            value={selectedTask.status}
                                            onChange={(e) => handleMoveCard(selectedTask.id, e.target.value)}
                                        >
                                            {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-[#DFE1E6] rounded transition-colors">
                                    <X size={20} className="text-[#5E6C84]" />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4 px-6 pb-6">
                            {/* Main Content */}
                            <div className="flex-1 space-y-6">
                                {/* Labels */}
                                {selectedTask.priority && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-[#5E6C84] uppercase mb-2">Labels</h4>
                                        <div className="flex gap-1">
                                            <div
                                                className="px-3 py-1.5 rounded text-white text-xs font-medium"
                                                style={{ backgroundColor: getPriorityColor(selectedTask.priority) }}
                                            >
                                                {selectedTask.priority}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                <div>
                                    <h4 className="text-xs font-semibold text-[#5E6C84] uppercase mb-2">Description</h4>
                                    <textarea
                                        className="w-full min-h-[100px] p-3 bg-white border border-[#DFE1E6] rounded text-sm text-[#172B4D] outline-none hover:border-[#0079BF] focus:border-[#0079BF] resize-none"
                                        placeholder="Add a more detailed description..."
                                        value={selectedTask.description || ''}
                                        onChange={(e) => handleUpdateTask(selectedTask.id, { description: e.target.value })}
                                    />
                                </div>

                                {/* Activity */}
                                <div>
                                    <h4 className="text-xs font-semibold text-[#5E6C84] uppercase mb-3">Activity</h4>
                                    <div className="flex gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-[#DFE1E6] flex items-center justify-center text-xs font-semibold shrink-0">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Write a comment..."
                                            className="flex-1 px-3 py-2 bg-white border border-[#DFE1E6] rounded text-sm outline-none hover:border-[#0079BF] focus:border-[#0079BF]"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        {comments.map((c, i) => (
                                            <div key={i} className="flex gap-2">
                                                <div className="w-8 h-8 rounded-full bg-[#DFE1E6] flex items-center justify-center text-xs font-semibold shrink-0">
                                                    {c.user_details.username[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-semibold text-[#172B4D]">{c.user_details.username}</span>
                                                        <span className="text-xs text-[#5E6C84]">{new Date(c.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="bg-white p-2 rounded text-sm text-[#172B4D]">{c.text}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="w-44 space-y-2 shrink-0">
                                <p className="text-xs font-semibold text-[#5E6C84] uppercase mb-2">Add to card</p>
                                <button
                                    onClick={() => setShowMembersModal(true)}
                                    className="w-full text-left px-3 py-2 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] flex items-center gap-2"
                                >
                                    <Users size={14} /> Members
                                </button>
                                <button
                                    onClick={() => setShowLabelsModal(true)}
                                    className="w-full text-left px-3 py-2 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] flex items-center gap-2"
                                >
                                    <Tag size={14} /> Labels
                                </button>
                                <button
                                    onClick={() => setShowDatesModal(true)}
                                    className="w-full text-left px-3 py-2 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] flex items-center gap-2"
                                >
                                    <Clock size={14} /> Dates
                                </button>
                                <button
                                    onClick={() => handleDeleteCard(selectedTask.id)}
                                    className="w-full text-left px-3 py-2 bg-[#EBECF0] hover:bg-[#EB5A46] hover:text-white rounded text-sm font-medium text-[#172B4D] flex items-center gap-2 transition-colors mt-4"
                                >
                                    <X size={14} /> Delete Card
                                </button>
                                <button
                                    onClick={() => setShowAttachmentModal(true)}
                                    className="w-full text-left px-3 py-2 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] flex items-center gap-2"
                                >
                                    <Paperclip size={14} /> Attachment
                                </button>

                                <p className="text-xs font-semibold text-[#5E6C84] uppercase mb-2 pt-2">Actions</p>
                                {activeTimer?.task === selectedTask.id ? (
                                    <button
                                        onClick={stopTimer}
                                        className="w-full text-left px-3 py-2 bg-[#EB5A46] hover:bg-[#CF513D] text-white rounded text-sm font-medium flex items-center gap-2"
                                    >
                                        <Clock size={14} /> Stop Timer
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => startTimer(selectedTask.id)}
                                        className="w-full text-left px-3 py-2 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] flex items-center gap-2"
                                    >
                                        <Clock size={14} /> Start Timer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal (Redesigned) */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 bg-[#091E42]/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowShareModal(false)}>
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#0079BF] to-[#026AA7] p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold flex items-center gap-2"><Share2 size={20} /> Share Board</h3>
                                <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                            <p className="text-blue-100 text-sm">Collaborate with your team on <strong>{project.name}</strong></p>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleShareBoard} className="flex gap-2 mb-6">
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    className="flex-1 px-4 py-2 border-2 border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0079BF] transition-colors"
                                    value={shareEmail}
                                    onChange={(e) => setShareEmail(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#0079BF] text-white rounded-lg hover:bg-[#026AA7] transition-colors text-sm font-bold shadow-md hover:shadow-lg"
                                >
                                    Invite
                                </button>
                            </form>

                            <div className="flex items-center justify-between p-4 bg-[#F4F5F7] rounded-lg mb-6 border border-[#DFE1E6]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-full shadow-sm">
                                        <Share2 size={16} className="text-[#0079BF]" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[#5E6C84] uppercase">Public Link</p>
                                        <p className="text-sm text-[#172B4D] font-medium truncate max-w-[200px]">{window.location.href}</p>
                                    </div>
                                </div>
                                <button onClick={copyShareLink} className="text-[#0079BF] text-sm font-bold hover:underline">
                                    Copy Link
                                </button>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-[#5E6C84] uppercase mb-4">Board Members</h4>
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {project.members_details?.map((member, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-[#F4F5F7] rounded-lg transition-colors group">
                                            <div className="w-10 h-10 rounded-full bg-[#DFE1E6] flex items-center justify-center text-sm font-bold text-[#172B4D] group-hover:bg-white group-hover:shadow-sm transition-all border-2 border-white">
                                                {member.username[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-[#172B4D]">{member.username}</p>
                                                <p className="text-xs text-[#5E6C84]">{member.email}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-[#EBECF0] text-xs font-bold text-[#5E6C84] rounded">{member.role || 'Member'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Members Modal */}
            {showMembersModal && selectedTask && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" onClick={() => setShowMembersModal(false)}>
                    <div className="bg-white rounded-lg w-full max-w-sm p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[#5E6C84] uppercase">Members</h3>
                            <button onClick={() => setShowMembersModal(false)} className="p-1 hover:bg-[#EBECF0] rounded">
                                <X size={16} className="text-[#5E6C84]" />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Search members"
                            className="w-full px-3 py-2 mb-3 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                        />
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                            {allUsers.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleAssignMember(member.id)}
                                    className="w-full flex items-center gap-3 p-2 rounded hover:bg-[#F4F5F7] transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#DFE1E6] flex items-center justify-center text-xs font-semibold">
                                        {member.username[0].toUpperCase()}
                                    </div>
                                    <span className="text-sm text-[#172B4D]">{member.username}</span>
                                    {selectedTask.assigned_to === member.id && (
                                        <span className="ml-auto text-[#0079BF]">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Labels Modal */}
            {showLabelsModal && selectedTask && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" onClick={() => setShowLabelsModal(false)}>
                    <div className="bg-white rounded-lg w-full max-w-sm p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[#5E6C84] uppercase">Labels</h3>
                            <button onClick={() => setShowLabelsModal(false)} className="p-1 hover:bg-[#EBECF0] rounded">
                                <X size={16} className="text-[#5E6C84]" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((priority) => (
                                <button
                                    key={priority}
                                    onClick={() => handleUpdatePriority(priority)}
                                    className="w-full flex items-center gap-3 p-3 rounded hover:opacity-90 transition-opacity text-white font-medium"
                                    style={{ backgroundColor: getPriorityColor(priority) }}
                                >
                                    {priority}
                                    {selectedTask.priority === priority && <span className="ml-auto">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Dates Modal */}
            {showDatesModal && selectedTask && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" onClick={() => setShowDatesModal(false)}>
                    <div className="bg-white rounded-lg w-full max-w-sm p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[#5E6C84] uppercase">Dates</h3>
                            <button onClick={() => setShowDatesModal(false)} className="p-1 hover:bg-[#EBECF0] rounded">
                                <X size={16} className="text-[#5E6C84]" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-[#5E6C84] mb-1">Due Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                                    value={tempDueDate || selectedTask.due_date || ''}
                                    onChange={(e) => setTempDueDate(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleUpdateDueDate}
                                className="w-full px-4 py-2 bg-[#0079BF] text-white rounded hover:bg-[#026AA7] transition-colors text-sm font-medium"
                            >
                                Save
                            </button>
                            {selectedTask.due_date && (
                                <button
                                    onClick={() => {
                                        handleUpdateTask(selectedTask.id, { due_date: null });
                                        setShowDatesModal(false);
                                        setTempDueDate('');
                                    }}
                                    className="w-full px-4 py-2 bg-[#EBECF0] text-[#172B4D] rounded hover:bg-[#DFE1E6] transition-colors text-sm font-medium"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Attachment Modal */}
            {showAttachmentModal && selectedTask && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" onClick={() => setShowAttachmentModal(false)}>
                    <div className="bg-white rounded-lg w-full max-w-md p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[#5E6C84] uppercase">Attachments</h3>
                            <button onClick={() => setShowAttachmentModal(false)} className="p-1 hover:bg-[#EBECF0] rounded">
                                <X size={16} className="text-[#5E6C84]" />
                            </button>
                        </div>

                        {/* Upload Section */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-[#5E6C84] mb-2">Upload File</label>
                            <div className="border-2 border-dashed border-[#DFE1E6] rounded-lg p-4 text-center hover:border-[#0079BF] transition-colors">
                                <input
                                    type="file"
                                    id="fileInput"
                                    className="hidden"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                />
                                <label htmlFor="fileInput" className="cursor-pointer">
                                    <Paperclip size={24} className="mx-auto text-[#5E6C84] mb-2" />
                                    {selectedFile ? (
                                        <p className="text-sm text-[#172B4D] font-medium">{selectedFile.name}</p>
                                    ) : (
                                        <p className="text-sm text-[#5E6C84]">Click to browse or drag and drop</p>
                                    )}
                                </label>
                            </div>
                            {selectedFile && (
                                <button
                                    onClick={handleFileUpload}
                                    className="w-full mt-2 px-4 py-2 bg-[#0079BF] text-white rounded hover:bg-[#026AA7] transition-colors text-sm font-medium"
                                >
                                    Upload
                                </button>
                            )}
                        </div>

                        {/* Existing Attachments */}
                        {attachments.length > 0 && (
                            <div>
                                <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-2">Current Attachments</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {attachments.map((att, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 bg-[#F4F5F7] rounded hover:bg-[#EBECF0] transition-colors">
                                            <Paperclip size={16} className="text-[#5E6C84]" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-[#172B4D] truncate">{att.file_name || 'Attachment'}</p>
                                                <p className="text-xs text-[#5E6C84]">
                                                    {new Date(att.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <a
                                                href={att.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#0079BF] hover:text-[#026AA7] text-sm"
                                            >
                                                View
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
