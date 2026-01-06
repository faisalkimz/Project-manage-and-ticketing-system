import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, Star, MoreHorizontal, X, Users, Share2, Clock, MessageSquare,
    Paperclip, Tag, ChevronDown, List, Calendar as CalendarIcon, Layout, GitMerge, CheckSquare, Trash2,
    Flag, Target, TrendingUp, Shield, HelpCircle, AlertCircle,
    Layers, Activity, Briefcase, Share, PieChart, Info, Kanban, Settings, User, Edit2, Check
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import CalendarView from '../components/CalendarView';
import GanttChart from '../components/GanttChart';
import { useToast } from '../components/Toast';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'TODO',
        due_date: '',
        issue_type: 'TASK',
        story_points: 0
    });
    const [viewMode, setViewMode] = useState('board');
    const [allUsers, setAllUsers] = useState([]);
    const [activeTimer, setActiveTimer] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isAddingCard, setIsAddingCard] = useState({ columnId: null, title: '' });
    const [newGoal, setNewGoal] = useState({ title: '', description: '', target_date: '' });
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [newDeliverable, setNewDeliverable] = useState({ name: '', description: '', due_date: '' });
    const [showDeliverableModal, setShowDeliverableModal] = useState(false);

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
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [showSubtaskInput, setShowSubtaskInput] = useState(false);
    const [showDependencyInput, setShowDependencyInput] = useState(false);
    const [dependencySearch, setDependencySearch] = useState('');
    const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ name: '', due_date: '', description: '' });

    const [activeListMenu, setActiveListMenu] = useState(null);
    const [activeCardMenu, setActiveCardMenu] = useState(null);
    const [shareEmail, setShareEmail] = useState('');
    const [showBackgroundModal, setShowBackgroundModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsForm, setSettingsForm] = useState({ name: '', description: '' });
    const [newStatusName, setNewStatusName] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('#DFE1E6');

    // Bulk operations
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);

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
            const [commentsRes, attachmentsRes, auditRes] = await Promise.all([
                api.get(`/activity/comments/?content_type=task&object_id=${task.id}`),
                api.get(`/activity/attachments/?content_type=task&object_id=${task.id}`),
                api.get(`/activity/audit-logs/?content_type=task&object_id=${task.id}`)
            ]);
            setComments(commentsRes.data);
            setAttachments(attachmentsRes.data);
            setAuditLogs(auditRes.data);
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
        if (selectedTask && tasks.length > 0) {
            const updated = tasks.find(t => t.id === selectedTask.id);
            if (updated) setSelectedTask(updated);
        }
    }, [tasks]);

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
            setNewTask({
                title: '',
                description: '',
                priority: 'MEDIUM',
                status: 'TODO',
                due_date: '',
                issue_type: 'TASK',
                story_points: 0
            });
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

    const handleBulkOperation = async (operation, value = null) => {
        try {
            await api.post('/projects/tasks/bulk_operation/', {
                ids: selectedTaskIds,
                operation,
                value
            });
            showToast(`Bulk ${operation} successful`, 'success');
            setSelectedTaskIds([]);
            setIsBulkMode(false);
            fetchProjectDetails();
        } catch (error) {
            showToast("Bulk operation failed", 'error');
        }
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

    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;
        try {
            await api.post('/projects/tasks/', {
                title: newSubtaskTitle,
                project: id,
                parent_task: selectedTask.id,
                status: 'TODO',
                priority: 'MEDIUM'
            });
            setNewSubtaskTitle('');
            fetchProjectDetails();
            // Also refresh selected task if it's currently open
            // But fetchProjectDetails updates 'tasks'. We need to sync selectedTask?
            // Actually fetchProjectDetails updates 'tasks' state, but selectedTask is a separate state object.
            // When tasks change, we should find the updated task in the list and update selectedTask.
            // Use useEffect or manual sync.
        } catch (error) { alert('Failed to add subtask'); }
    };

    const handleToggleSubtaskStatus = async (subtaskId, currentStatus) => {
        const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
        try {
            await api.patch(`/projects/tasks/${subtaskId}/`, { status: newStatus });
            fetchProjectDetails();
        } catch (error) { }
    };

    const handleAddDependency = async (depId) => {
        const currentDeps = selectedTask.dependencies || [];
        if (currentDeps.includes(depId)) return;
        try {
            await api.patch(`/projects/tasks/${selectedTask.id}/`, {
                dependencies: [...currentDeps, depId]
            });
            fetchProjectDetails();
            setShowDependencyInput(false);
            setDependencySearch('');
        } catch (error) { alert('Failed to add dependency'); }
    };

    const handleRemoveDependency = async (depId) => {
        const currentDeps = selectedTask.dependencies || [];
        try {
            await api.patch(`/projects/tasks/${selectedTask.id}/`, {
                dependencies: currentDeps.filter(id => id !== depId)
            });
            fetchProjectDetails();
        } catch (error) { alert('Failed to remove dependency'); }
    };

    const handleCreateMilestone = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/milestones/', { ...newMilestone, project: id });
            setNewMilestone({ name: '', due_date: '', description: '' });
            setIsRoadmapModalOpen(false);
            fetchProjectDetails();
        } catch (error) { alert('Failed to create milestone'); }
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
        try {
            const res = await api.post(`/projects/projects/${id}/toggle_watch/`);
            if (res.data.status === 'watched') {
                alert('You are now watching this board.');
            } else {
                alert('You stopped watching this board.');
            }
            fetchProjectDetails(); // To update the state properly if we use is_watching prop
            setShowMoreMenu(false);
        } catch (e) { alert('Failed to toggle watch'); }
    };

    const changeBackground = () => {
        setShowBackgroundModal(true);
        setShowMoreMenu(false);
    };

    const openSettings = () => {
        setSettingsForm({ name: project.name, description: project.description });
        setShowSettingsModal(true);
        setShowMoreMenu(false);
    };

    // Share Functionality removed duplicate state


    const handleShareBoard = async (e) => {
        e.preventDefault();
        if (!shareEmail.trim()) return;

        try {
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

    const handleUpdateProjectSettings = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/projects/projects/${id}/`, settingsForm);
            setProject({ ...project, ...settingsForm });
            setShowSettingsModal(false);
        } catch (error) { alert('Failed to update settings'); }
    };

    const handleUpdateBackground = async (color) => {
        try {
            await api.patch(`/projects/projects/${id}/`, { background_color: color });
            setProject({ ...project, background_color: color });
            setShowBackgroundModal(false);
        } catch (error) { alert('Failed to update background'); }
    };

    const handleCreateGoal = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/goals/', { ...newGoal, project: id });
            setNewGoal({ title: '', description: '', target_date: '' });
            setShowGoalModal(false);
            fetchProjectDetails();
        } catch (error) { alert('Failed to create goal'); }
    };

    const handleCreateDeliverable = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/deliverables/', { ...newDeliverable, project: id });
            setNewDeliverable({ name: '', description: '', due_date: '' });
            setShowDeliverableModal(false);
            fetchProjectDetails();
        } catch (error) { alert('Failed to create deliverable'); }
    };

    const handleToggleGoal = async (goalId, isAchieved) => {
        try {
            await api.patch(`/projects/goals/${goalId}/`, { is_achieved: !isAchieved });
            fetchProjectDetails();
        } catch (error) { }
    };

    const handleToggleDeliverable = async (delId, isCompleted) => {
        try {
            await api.patch(`/projects/deliverables/${delId}/`, { is_completed: !isCompleted });
            fetchProjectDetails();
        } catch (error) { }
    };

    const handleToggleStar = async () => {
        try {
            await api.post(`/projects/projects/${id}/toggle_star/`);
            fetchProjectDetails();
        } catch (error) { console.error('Failed to toggle star'); }
    };

    const handleCloseBoard = async () => {
        if (!window.confirm('Are you sure you want to close this board? You can re-open it later.')) return;
        try {
            await api.patch(`/projects/projects/${id}/`, { status: 'COMPLETED' }); // Mapping Close to Completed/Archived
            navigate('/projects');
        } catch (error) { alert('Failed to close board'); }
    };

    const handleCreateStatus = async () => {
        if (!newStatusName.trim()) return;
        try {
            await api.post('/projects/statuses/', {
                project: id,
                name: newStatusName,
                color: newStatusColor,
                order: project.custom_statuses?.length || 0
            });
            setNewStatusName('');
            fetchProjectDetails();
        } catch (error) { showToast("Failed to create status", "error"); }
    };

    const handleDeleteStatus = async (statusId) => {
        if (!window.confirm('Are you sure? Tasks in this status might become invisible.')) return;
        try {
            await api.delete(`/projects/statuses/${statusId}/`);
            fetchProjectDetails();
        } catch (error) { showToast("Failed to delete status", "error"); }
    };

    if (!project) return <div className="h-screen w-full flex items-center justify-center bg-[#FAFBFC]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052CC]"></div></div>;

    const columns = project.custom_statuses?.length > 0
        ? project.custom_statuses.map(s => ({ id: s.name, title: s.name, color: s.color, isCustom: true }))
        : [
            { id: 'TODO', title: 'To Do', color: '#DFE1E6' },
            { id: 'IN_PROGRESS', title: 'In Progress', color: '#DEEBFF' },
            { id: 'REVIEW', title: 'Ready for Review', color: '#EAE6FF' },
            { id: 'DONE', title: 'Done', color: '#E3FCEF' }
        ];

    const rootTasks = tasks.filter(t => !t.parent_task);

    const getPriorityColor = (p) => {
        switch (p) {
            case 'CRITICAL': return '#E54937';
            case 'HIGH': return '#E54937';
            case 'MEDIUM': return '#FF9F1A';
            default: return '#0079BF';
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getIssueTypeIcon = (type) => {
        switch (type) {
            case 'EPIC': return <div className="w-3.5 h-3.5 bg-[#89609E] rounded-[2px] flex items-center justify-center text-white"><Layers size={10} /></div>;
            case 'STORY': return <div className="w-3.5 h-3.5 bg-[#61BD4F] rounded-[2px] flex items-center justify-center text-white"><CheckSquare size={10} /></div>;
            case 'BUG': return <div className="w-3.5 h-3.5 bg-[#EB5A46] rounded-[2px] flex items-center justify-center text-white"><AlertCircle size={10} /></div>;
            case 'FEATURE': return <div className="w-3.5 h-3.5 bg-[#00A3BF] rounded-[2px] flex items-center justify-center text-white"><Star size={10} /></div>;
            default: return <div className="w-3.5 h-3.5 bg-[#4C9AFF] rounded-[2px] flex items-center justify-center text-white"><Check size={10} /></div>;
        }
    };

    return (
        <div className="h-screen flex flex-col bg-white font-sans text-[#172B4D] overflow-hidden">
            {/* Jira Style Header */}
            <header className="px-6 pt-4 flex flex-col shrink-0 border-b border-[#DFE1E6]">
                <div className="flex items-center gap-2 text-sm text-[#5E6C84] mb-4">
                    <span className="hover:text-[#0052CC] cursor-pointer" onClick={() => navigate('/projects')}>Projects</span>
                    <ChevronDown size={14} className="rotate-[-90deg]" />
                    <span className="hover:text-[#0052CC] cursor-pointer">{project.name}</span>
                    <ChevronDown size={14} className="rotate-[-90deg]" />
                    <span className="text-[#172B4D] font-bold capitalize">{viewMode}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0052CC] rounded-[3px] flex items-center justify-center text-white shrink-0 shadow-sm">
                            <Kanban size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[#172B4D]">{project.name}</h1>
                            <p className="text-[11px] text-[#5E6C84] uppercase font-bold tracking-wider">Software project</p>
                        </div>
                        <button onClick={handleToggleStar} className="p-1 hover:bg-[#EBECF0] rounded transition-colors ml-2">
                            <Star size={20} className={project.is_starred ? 'fill-amber-400 text-amber-400' : 'text-[#5E6C84]'} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2 mr-2">
                            {project.members_details?.slice(0, 5).map((m, i) => (
                                <div
                                    key={i}
                                    title={m.username}
                                    className="w-8 h-8 rounded-full border-2 border-white bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold ring-2 ring-white"
                                >
                                    {m.username[0].toUpperCase()}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowMembersModal(true)}
                            className="w-8 h-8 rounded-full border-2 border-dashed border-[#DFE1E6] flex items-center justify-center text-[#5E6C84] hover:border-[#0052CC] hover:text-[#0052CC] transition-colors"
                        >
                            <Plus size={16} />
                        </button>
                        <div className="h-6 w-px bg-[#DFE1E6] mx-2" />
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="px-3 py-1.5 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded-sm text-sm font-bold text-[#42526E] transition-colors flex items-center gap-2"
                        >
                            <Share2 size={16} /> Share
                        </button>
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMoreMenu(!showMoreMenu);
                                }}
                                className="p-1.5 hover:bg-[#EBECF0] rounded-sm transition-colors text-[#5E6C84]"
                            >
                                <MoreHorizontal size={20} />
                            </button>
                            {showMoreMenu && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#DFE1E6] shadow-xl rounded-sm py-2 z-50">
                                    <button onClick={copyBoardLink} className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7]">Board link</button>
                                    <button onClick={printBoard} className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7]">Print</button>
                                    <div className="border-t border-[#DFE1E6] my-1" />
                                    <button onClick={openSettings} className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7]">Board settings</button>
                                    <button onClick={changeBackground} className="w-full text-left px-4 py-2 text-sm text-[#172B4D] hover:bg-[#F4F5F7]">Customize background</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Horizontal Navigation Tabs */}
                <nav className="flex items-center gap-1 mt-6 overflow-x-auto no-scrollbar">
                    <div className="flex items-center shrink-0">
                        <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider px-2 self-center">Planning:</span>
                        <button onClick={() => setViewMode('roadmap')} className={`px-3 py-2 border-b-2 text-sm font-bold transition-colors ${viewMode === 'roadmap' ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-[#42526E] hover:text-[#0052CC]'}`}>
                            Roadmap
                        </button>
                        <button onClick={() => setViewMode('list')} className={`px-3 py-2 border-b-2 text-sm font-bold transition-colors ${viewMode === 'list' ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-[#42526E] hover:text-[#0052CC]'}`}>
                            Backlog
                        </button>
                        <button onClick={() => setViewMode('board')} className={`px-3 py-2 border-b-2 text-sm font-bold transition-colors ${viewMode === 'board' ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-[#42526E] hover:text-[#0052CC]'}`}>
                            Board
                        </button>
                    </div>
                    <div className="h-4 w-[1px] bg-[#DFE1E6] mx-2 shrink-0" />
                    <div className="flex items-center shrink-0">
                        <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider px-2 self-center">Organization:</span>
                        <button onClick={() => setViewMode('overview')} className={`px-3 py-2 border-b-2 text-sm font-bold transition-colors ${viewMode === 'overview' ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-[#42526E] hover:text-[#0052CC]'}`}>
                            Overview
                        </button>
                        <button onClick={() => setViewMode('calendar')} className={`px-3 py-2 border-b-2 text-sm font-bold transition-colors ${viewMode === 'calendar' ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-[#42526E] hover:text-[#0052CC]'}`}>
                            Calendar
                        </button>
                        <button onClick={() => setViewMode('timeline')} className={`px-3 py-2 border-b-2 text-sm font-bold transition-colors ${viewMode === 'timeline' ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-[#42526E] hover:text-[#0052CC]'}`}>
                            Timeline
                        </button>
                    </div>
                    <div className="h-4 w-[1px] bg-[#DFE1E6] mx-2 shrink-0" />
                    <button onClick={openSettings} className="px-3 py-2 border-b-2 text-sm font-bold border-transparent text-[#42526E] hover:text-[#0052CC] shrink-0">
                        Project settings
                    </button>
                </nav>
            </header>

            <main className="flex-1 overflow-auto bg-[#F4F5F7] flex flex-col">
                {viewMode === 'board' && (
                    <div className="flex-1 flex gap-4 p-6 overflow-x-auto custom-scrollbar min-h-0">
                        {columns.map((col) => (
                            <div key={col.id} className="flex flex-col w-[280px] md:w-[320px] shrink-0 bg-[#F4F5F7]">
                                {/* List Header */}
                                <div className="px-3 py-3 flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider">
                                            {col.title}
                                        </h3>
                                        <span className="bg-[#DFE1E6] text-[#42526E] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {rootTasks.filter(t => t.status === col.id).length}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveListMenu(activeListMenu === col.id ? null : col.id)}
                                            className="p-1 hover:bg-[#DFE1E6] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreHorizontal size={14} className="text-[#5E6C84]" />
                                        </button>
                                        {activeListMenu === col.id && (
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#DFE1E6] shadow-lg rounded-sm py-1 z-20">
                                                <button onClick={() => handleSortList(col.id, 'priority')} className="w-full text-left px-4 py-2 text-xs text-[#172B4D] hover:bg-[#F4F5F7]">Sort by Priority</button>
                                                <button onClick={() => handleSortList(col.id, 'date')} className="w-full text-left px-4 py-2 text-xs text-[#172B4D] hover:bg-[#F4F5F7]">Sort by Date</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cards Container */}
                                <div className="flex-1 overflow-y-auto px-1 pb-4 space-y-2 custom-scrollbar min-h-[100px]">
                                    {tasks.filter(t => t.status === col.id && !t.parent_task).map((task) => (
                                        <div
                                            key={task.id}
                                            onClick={(e) => {
                                                if (isBulkMode) {
                                                    e.stopPropagation();
                                                    const newSelected = selectedTaskIds.includes(task.id)
                                                        ? selectedTaskIds.filter(id => id !== task.id)
                                                        : [...selectedTaskIds, task.id];
                                                    setSelectedTaskIds(newSelected);
                                                    if (newSelected.length === 0) setIsBulkMode(false);
                                                } else {
                                                    setSelectedTask(task);
                                                }
                                            }}
                                            className={`bg-white rounded-[3px] border ${selectedTaskIds.includes(task.id) ? 'border-[#4C9AFF] bg-[#E6F0FF]' : 'border-[#DFE1E6]'} hover:border-[#4C9AFF] hover:bg-[#FAFBFC] transition-all cursor-pointer p-3 group relative shadow-sm`}
                                        >
                                            {/* Bulk Selection Checkbox */}
                                            <div
                                                className={`absolute top-2 right-2 z-10 ${selectedTaskIds.includes(task.id) || isBulkMode ? 'block' : 'hidden group-hover:block'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsBulkMode(true);
                                                    const newSelected = selectedTaskIds.includes(task.id)
                                                        ? selectedTaskIds.filter(id => id !== task.id)
                                                        : [...selectedTaskIds, task.id];
                                                    setSelectedTaskIds(newSelected);
                                                    if (newSelected.length === 0) setIsBulkMode(false);
                                                }}
                                            >
                                                <div className={`w-4 h-4 rounded border ${selectedTaskIds.includes(task.id) ? 'bg-[#0052CC] border-[#0052CC]' : 'bg-white border-[#DFE1E6]'} flex items-center justify-center text-white transition-colors`}>
                                                    {selectedTaskIds.includes(task.id) && <Check size={10} />}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm text-[#172B4D] leading-snug">{task.title}</p>

                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-2">
                                                        {getIssueTypeIcon(task.issue_type)}
                                                        <span className="text-[10px] font-bold text-[#5E6C84]">
                                                            {project.key || 'TASK'}-{task.id}
                                                        </span>
                                                        {task.story_points > 0 && (
                                                            <span className="ml-1 bg-[#DFE1E6] text-[#42526E] text-[10px] font-bold px-1.5 py-0.5 rounded-full" title="Story Points">
                                                                {task.story_points}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {task.comment_count > 0 && (
                                                            <div className="flex items-center gap-1 text-[10px] text-[#5E6C84]">
                                                                <MessageSquare size={12} />
                                                                {task.comment_count}
                                                            </div>
                                                        )}
                                                        {task.assigned_to_details ? (
                                                            <div
                                                                className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white"
                                                                title={task.assigned_to_details.username}
                                                            >
                                                                {task.assigned_to_details.username[0].toUpperCase()}
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-[#EBECF0] text-[#5E6C84] flex items-center justify-center">
                                                                <Users size={12} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Quick Add */}
                                <div className="p-2">
                                    {isAddingCard.columnId === col.id ? (
                                        <div className="bg-white rounded-[3px] border border-[#4C9AFF] p-2 shadow-sm">
                                            <textarea
                                                autoFocus
                                                placeholder="What needs to be done?"
                                                className="w-full text-sm text-[#172B4D] outline-none resize-none mb-2"
                                                rows="2"
                                                value={isAddingCard.title}
                                                onChange={(e) => setIsAddingCard({ ...isAddingCard, title: e.target.value })}
                                            />
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleQuickAddCard(col.id)}
                                                    className="px-3 py-1 bg-[#0052CC] text-white text-xs font-bold rounded-sm hover:bg-[#0747A6]"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setIsAddingCard({ columnId: null, title: '' })}
                                                    className="p-1 hover:bg-[#F4F5F7] rounded"
                                                >
                                                    <X size={16} className="text-[#5E6C84]" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsAddingCard({ columnId: col.id, title: '' })}
                                            className="w-full text-left px-3 py-2 text-[#42526E] hover:bg-[#EBECF0] rounded-sm transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Plus size={16} /> Create issue
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {viewMode === 'list' && (
                    <div className="flex-1 flex flex-col p-6 overflow-hidden">
                        <div className="border border-[#DFE1E6] rounded-sm overflow-hidden flex flex-col bg-white">
                            <div className="bg-[#FAFBFC] border-b border-[#DFE1E6] flex items-center h-10 px-4">
                                <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-wider">Project Backlog</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#FAFBFC] sticky top-0 z-10 border-b border-[#DFE1E6]">
                                        <tr>
                                            <th className="px-4 py-2 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTaskIds.length > 0 && selectedTaskIds.length === rootTasks.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedTaskIds(rootTasks.map(t => t.id));
                                                            setIsBulkMode(true);
                                                        } else {
                                                            setSelectedTaskIds([]);
                                                            setIsBulkMode(false);
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-[#0052CC]"
                                                />
                                            </th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-[#5E6C84] uppercase w-12 text-center">T</th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-[#5E6C84] uppercase w-24">Key</th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-[#5E6C84] uppercase">Summary</th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-[#5E6C84] uppercase w-32">Status</th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-[#5E6C84] uppercase w-32">Priority</th>
                                            <th className="px-4 py-2 text-[11px] font-bold text-[#5E6C84] uppercase w-24">Assignee</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#DFE1E6]">
                                        {rootTasks.map((task) => (
                                            <tr
                                                key={task.id}
                                                onClick={(e) => {
                                                    if (isBulkMode) {
                                                        const newSelected = selectedTaskIds.includes(task.id)
                                                            ? selectedTaskIds.filter(id => id !== task.id)
                                                            : [...selectedTaskIds, task.id];
                                                        setSelectedTaskIds(newSelected);
                                                        if (newSelected.length === 0) setIsBulkMode(false);
                                                    } else {
                                                        setSelectedTask(task);
                                                    }
                                                }}
                                                className={`hover:bg-[#F4F5F7] cursor-pointer group transition-colors ${selectedTaskIds.includes(task.id) ? 'bg-[#E6F0FF]' : ''}`}
                                            >
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTaskIds.includes(task.id)}
                                                        onChange={() => {
                                                            setIsBulkMode(true);
                                                            const newSelected = selectedTaskIds.includes(task.id)
                                                                ? selectedTaskIds.filter(id => id !== task.id)
                                                                : [...selectedTaskIds, task.id];
                                                            setSelectedTaskIds(newSelected);
                                                            if (newSelected.length === 0) setIsBulkMode(false);
                                                        }}
                                                        className="w-4 h-4 rounded border-gray-300 text-[#0052CC]"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 flex justify-center">{getIssueTypeIcon(task.issue_type)}</td>
                                                <td className="px-4 py-3 text-xs font-bold text-[#5E6C84] group-hover:text-[#0052CC]">{project.key || 'TASK'}-{task.id}</td>
                                                <td className="px-4 py-3 text-sm text-[#172B4D] font-medium flex items-center gap-2">
                                                    {task.title}
                                                    {task.story_points > 0 && (
                                                        <span className="bg-[#DFE1E6] text-[#42526E] text-[10px] font-bold px-1.5 py-0.5 rounded-full" title="Story Points">
                                                            {task.story_points}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${task.status === 'DONE' ? 'bg-[#E3FCEF] text-[#006644]' :
                                                        task.status === 'IN_PROGRESS' ? 'bg-[#DEEBFF] text-[#0052CC]' : 'bg-[#EBECF0] text-[#42526E]'
                                                        }`}>
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-2 h-2 rounded-full ${task.priority === 'CRITICAL' ? 'bg-[#E54937]' : task.priority === 'HIGH' ? 'bg-[#E54937]' : 'bg-[#FF9F1A]'}`} />
                                                        <span className="text-xs text-[#172B4D]">{task.priority}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {task.assigned_to_details ? (
                                                        <div className="w-6 h-6 rounded-full bg-[#F4F5F7] border border-[#DFE1E6] flex items-center justify-center text-[9px] font-bold text-[#172B4D]">
                                                            {task.assigned_to_details.username[0].toUpperCase()}
                                                        </div>
                                                    ) : <span className="text-xs text-[#5E6C84]">None</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'calendar' && (
                    <div className="flex-1 overflow-auto p-6 bg-white">
                        <CalendarView tasks={tasks} />
                    </div>
                )}

                {viewMode === 'timeline' && (
                    <div className="flex-1 overflow-auto p-6 bg-white">
                        <GanttChart tasks={tasks} />
                    </div>
                )}

                {viewMode === 'roadmap' && (
                    <div className="flex-1 overflow-y-auto p-8 bg-white">
                        <div className="max-w-4xl">
                            <h1 className="text-2xl font-bold text-[#172B4D] mb-2">Roadmap</h1>
                            <p className="text-sm text-[#5E6C84] mb-8">Plan and track your project milestones and deliverables.</p>

                            <div className="space-y-8">
                                {/* Milestones Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wider flex items-center gap-2">
                                            <Flag size={16} /> Milestones
                                        </h3>
                                        <button onClick={() => setIsRoadmapModalOpen(true)} className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1">
                                            <Plus size={14} /> Add Milestone
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {project.milestones?.map((m) => (
                                            <div key={m.id} className="relative pl-6 border-l-2 border-[#DFE1E6] pb-4 last:pb-0">
                                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${m.is_completed ? 'bg-green-500' : 'bg-[#0052CC]'}`} />
                                                <div className="bg-[#FAFBFC] border border-[#DFE1E6] rounded p-3">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-bold text-[#172B4D] text-sm">{m.name}</h4>
                                                        <span className="text-xs font-bold text-[#5E6C84]">{new Date(m.due_date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs text-[#5E6C84]">{m.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!project.milestones || project.milestones.length === 0) && (
                                            <p className="text-sm text-[#5E6C84] italic">No milestones defined.</p>
                                        )}
                                    </div>
                                </section>

                                {/* Deliverables Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wider flex items-center gap-2">
                                            <CheckSquare size={16} /> Deliverables
                                        </h3>
                                        <button onClick={() => setShowDeliverableModal(true)} className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1">
                                            <Plus size={14} /> Add Deliverable
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {project.deliverables?.map((d) => (
                                            <div key={d.id} className="flex gap-3 p-3 border border-[#DFE1E6] rounded bg-white relative overflow-hidden group">
                                                <div className={`w-1 h-full absolute left-0 top-0 ${d.is_completed ? 'bg-green-500' : 'bg-[#FF9F1A]'}`} />
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-[#172B4D] text-sm mb-1">{d.name}</h4>
                                                    <p className="text-xs text-[#5E6C84] line-clamp-2">{d.description}</p>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="text-[10px] font-bold uppercase text-[#5E6C84] bg-[#EBECF0] px-1.5 py-0.5 rounded">
                                                            {d.due_date ? new Date(d.due_date).toLocaleDateString() : 'No Date'}
                                                        </span>
                                                        <button onClick={() => handleToggleDeliverable(d.id, d.is_completed)} className="text-[10px] text-[#0052CC] hover:underline">
                                                            {d.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!project.deliverables || project.deliverables.length === 0) && (
                                            <p className="col-span-2 text-sm text-[#5E6C84] italic">No deliverables defined.</p>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'overview' && (
                    <div className="flex-1 overflow-y-auto p-8 bg-white">
                        <div className="max-w-6xl">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <section>
                                        <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest mb-4">Project Vitality</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-white border border-[#DFE1E6] p-4 rounded-sm shadow-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[11px] font-bold text-[#5E6C84] uppercase">Health</span>
                                                    <Activity size={14} className="text-green-500" />
                                                </div>
                                                <p className="text-lg font-bold text-[#172B4D]">Healthy</p>
                                            </div>
                                            <div className="bg-white border border-[#DFE1E6] p-4 rounded-sm shadow-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[11px] font-bold text-[#5E6C84] uppercase">Progress</span>
                                                    <CheckSquare size={14} className="text-[#0052CC]" />
                                                </div>
                                                <p className="text-lg font-bold text-[#172B4D]">{(project.task_stats?.percentage || 0).toFixed(0)}%</p>
                                            </div>
                                            <div className="bg-white border border-[#DFE1E6] p-4 rounded-sm shadow-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[11px] font-bold text-[#5E6C84] uppercase">Members</span>
                                                    <Users size={14} className="text-[#0052CC]" />
                                                </div>
                                                <p className="text-lg font-bold text-[#172B4D]">{project.members_details?.length || 0}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Goals Section */}
                                    <section className="bg-white border border-[#DFE1E6] p-6 rounded-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-widest flex items-center gap-2">
                                                <Target size={14} /> Goals & Objectives
                                            </h3>
                                            <button onClick={() => setShowGoalModal(true)} className="text-[#0052CC] hover:underline text-xs font-bold flex items-center gap-1">
                                                <Plus size={14} /> Add Goal
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {project.goals?.map(goal => (
                                                <div key={goal.id} className="flex items-start gap-3 p-3 bg-[#FAFBFC] rounded border border-[#DFE1E6]">
                                                    <div
                                                        onClick={() => handleToggleGoal(goal.id, goal.is_achieved)}
                                                        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${goal.is_achieved ? 'bg-green-500 border-green-500 text-white' : 'border-[#DFE1E6] bg-white hover:border-[#0052CC]'}`}
                                                    >
                                                        {goal.is_achieved && <Check size={10} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className={`text-sm font-bold ${goal.is_achieved ? 'text-[#5E6C84] line-through' : 'text-[#172B4D]'}`}>{goal.title}</h4>
                                                        <p className="text-xs text-[#5E6C84] mt-1">{goal.description}</p>
                                                        {goal.target_date && (
                                                            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#5E6C84] uppercase">
                                                                <CalendarIcon size={10} /> Target: {new Date(goal.target_date).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!project.goals || project.goals.length === 0) && (
                                                <div className="text-center py-4 border-2 border-dashed border-[#DFE1E6] rounded">
                                                    <Target size={20} className="mx-auto text-[#DFE1E6] mb-2" />
                                                    <p className="text-xs text-[#5E6C84]">Define project goals to align your team.</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section className="bg-white border border-[#DFE1E6] p-6 rounded-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-widest">Sub-projects</h3>
                                            <button onClick={() => navigate('/projects')} className="text-[#0052CC] hover:underline text-xs font-bold flex items-center gap-1">
                                                <Plus size={14} /> Create
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {project.child_projects_details?.map(sub => (
                                                <div key={sub.id} onClick={() => navigate(`/projects/${sub.id}`)} className="p-3 border border-[#DFE1E6] rounded-sm hover:border-[#0052CC] cursor-pointer group transition-all">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-4 h-4 bg-[#0052CC] rounded-[2px]" />
                                                        <span className="text-sm font-bold text-[#172B4D] group-hover:text-[#0052CC]">{sub.name}</span>
                                                    </div>
                                                    <p className="text-[10px] text-[#5E6C84] uppercase font-bold tracking-wider">{sub.key || 'SUB'}</p>
                                                </div>
                                            ))}
                                            {(!project.child_projects_details || project.child_projects_details.length === 0) && (
                                                <p className="col-span-2 text-xs text-[#5E6C84] italic py-2 text-center border border-dashed border-[#DFE1E6] rounded-sm">No sub-projects created yet.</p>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-8">
                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest">Details</h3>
                                            <button onClick={openSettings} className="p-1 hover:bg-[#F4F5F7] rounded text-[#5E6C84]"><Edit2 size={14} /></button>
                                        </div>
                                        <div className="space-y-4 text-sm bg-[#FAFBFC] border border-[#DFE1E6] p-4 rounded-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#59667E] font-medium">Lead</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[8px] font-bold">
                                                        {project.created_by_details?.username?.[0].toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-[#172B4D]">{project.created_by_details?.username}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#59667E] font-medium">Category</span>
                                                <span className="px-2 py-0.5 bg-[#DFE1E6] text-[#42526E] rounded-sm text-[10px] font-bold uppercase">{project.category_details?.name || 'Software'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#59667E] font-medium">Visibility</span>
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-[#403294] uppercase bg-[#EAE6FF] px-2 py-0.5 rounded-sm">
                                                    <Shield size={10} /> {project.visibility}
                                                </span>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest">Dependencies</h3>
                                            <button onClick={() => showToast('Dependency Management coming soon', 'info')} className="text-[#0052CC] hover:underline text-[11px] font-bold">Manage</button>
                                        </div>
                                        <div className="bg-white border border-[#DFE1E6] p-4 rounded-sm shadow-sm space-y-3">
                                            {project.dependencies_details?.length > 0 ? project.dependencies_details.map(dep => (
                                                <div key={dep.id} className="flex items-center gap-3 text-sm group cursor-pointer" onClick={() => navigate(`/projects/${dep.id}`)}>
                                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                                    <span className="font-medium text-[#172B4D] group-hover:text-[#0052CC] group-hover:underline truncate">{dep.name}</span>
                                                </div>
                                            )) : (
                                                <div className="text-center py-4">
                                                    <GitMerge size={24} className="text-[#DFE1E6] mx-auto mb-2 rotate-90" />
                                                    <p className="text-[11px] text-[#5E6C84] italic">No active dependencies.</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section className="bg-gradient-to-br from-[#0052CC] to-[#0747A6] p-4 rounded-sm text-white relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <h4 className="font-bold text-sm mb-1">Try Atlas</h4>
                                            <p className="text-[11px] text-blue-100 mb-3 leading-snug">Connect your project goals with team performance.</p>
                                            <button className="text-[11px] font-bold bg-white text-[#0052CC] px-3 py-1.5 rounded-sm hover:bg-blue-50 transition-colors">Learn more</button>
                                        </div>
                                        <PieChart size={80} className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Bulk Action Bar */}
            {selectedTaskIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#172B4D] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2 border-r border-[#42526E] pr-6">
                        <span className="text-sm font-bold">{selectedTaskIds.length} tasks selected</span>
                        <button
                            onClick={() => { setSelectedTaskIds([]); setIsBulkMode(false); }}
                            className="p-1 hover:bg-[#42526E] rounded text-[#A5ADBA]"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[#A5ADBA] font-bold uppercase tracking-wider">Move to:</span>
                            <div className="flex gap-1">
                                {columns.map(col => (
                                    <button
                                        key={col.id}
                                        onClick={() => handleBulkOperation('update_status', col.id)}
                                        className="px-2 py-1 bg-[#42526E] hover:bg-[#5E6C84] rounded text-[10px] font-bold uppercase transition-colors"
                                    >
                                        {col.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-px h-6 bg-[#42526E]" />

                        <button
                            onClick={() => handleBulkOperation('archive')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#42526E] hover:bg-amber-600 transition-colors rounded text-xs font-bold"
                        >
                            <Layers size={14} /> Archive Selected
                        </button>

                        <button
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${selectedTaskIds.length} tasks?`)) {
                                    handleBulkOperation('delete');
                                }
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#42526E] hover:bg-red-600 transition-colors rounded text-xs font-bold"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Card Detail Modal */}
            {
                selectedTask && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-12 overflow-y-auto" onClick={() => setSelectedTask(null)}>
                        <div className="bg-[#F4F5F7] rounded-lg w-full max-w-3xl mb-12 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="p-6">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <select
                                            className="bg-transparent border-none outline-none cursor-pointer hover:bg-white rounded p-1 transition-colors"
                                            value={selectedTask.issue_type}
                                            onChange={(e) => handleUpdateTask(selectedTask.id, { issue_type: e.target.value })}
                                        >
                                            <option value="TASK">Task</option>
                                            <option value="STORY">User Story</option>
                                            <option value="BUG">Bug</option>
                                            <option value="EPIC">Epic</option>
                                            <option value="FEATURE">Feature Request</option>
                                        </select>
                                    </div>
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
                                            <div className="h-4 w-px bg-[#DFE1E6] mx-1" />
                                            <div className="flex items-center gap-1 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded px-2 py-0.5 cursor-pointer transition-colors group">
                                                <TrendingUp size={12} className="text-[#5E6C84]" />
                                                <input
                                                    type="number"
                                                    className="w-8 bg-transparent text-xs font-bold text-[#172B4D] outline-none"
                                                    value={selectedTask.story_points || 0}
                                                    onChange={(e) => handleUpdateTask(selectedTask.id, { story_points: parseInt(e.target.value) || 0 })}
                                                />
                                                <span className="text-[10px] font-bold text-[#5E6C84] group-hover:block hidden">Points</span>
                                            </div>
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

                                    {/* Subtasks / Checklist */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs font-semibold text-[#5E6C84] uppercase">Subtasks</h4>
                                            {selectedTask.subtasks?.length > 0 && (
                                                <span className="text-xs text-[#5E6C84]">
                                                    {Math.round((selectedTask.subtasks.filter(t => t.status === 'DONE').length / selectedTask.subtasks.length) * 100)}% Done
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        {selectedTask.subtasks?.length > 0 && (
                                            <div className="h-2 bg-[#EBECF0] rounded-full mb-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-[#0079BF] transition-all duration-300"
                                                    style={{ width: `${(selectedTask.subtasks.filter(t => t.status === 'DONE').length / selectedTask.subtasks.length) * 100}%` }}
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2 mb-3">
                                            {selectedTask.subtasks?.map(sub => (
                                                <div key={sub.id} className="flex items-center gap-3 p-2 hover:bg-[#F4F5F7] rounded group transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={sub.status === 'DONE'}
                                                        onChange={() => handleToggleSubtaskStatus(sub.id, sub.status)}
                                                        className="w-4 h-4 rounded border-gray-300 text-[#0079BF] focus:ring-[#0079BF]"
                                                    />
                                                    <span className={`flex-1 text-sm ${sub.status === 'DONE' ? 'line-through text-[#5E6C84]' : 'text-[#172B4D]'}`}>
                                                        {sub.title}
                                                    </span>
                                                    <button onClick={() => handleDeleteCard(sub.id)} className="opacity-0 group-hover:opacity-100 text-[#5E6C84] hover:text-red-600 transition-opacity">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {showSubtaskInput ? (
                                            <div className="mb-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                                                    placeholder="Enter subtask title..."
                                                    value={newSubtaskTitle}
                                                    onChange={e => setNewSubtaskTitle(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleAddSubtask();
                                                        if (e.key === 'Escape') setShowSubtaskInput(false);
                                                    }}
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={handleAddSubtask} className="px-3 py-1.5 bg-[#0079BF] text-white rounded text-xs font-bold hover:bg-[#026AA7]">Add</button>
                                                    <button onClick={() => setShowSubtaskInput(false)} className="px-3 py-1.5 text-[#172B4D] hover:bg-[#EBECF0] rounded text-xs font-bold">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowSubtaskInput(true)}
                                                className="px-3 py-1.5 bg-[#EBECF0] hover:bg-[#DFE1E6] text-[#172B4D] rounded text-sm font-medium transition-colors"
                                            >
                                                Add an item
                                            </button>
                                        )}
                                    </div>

                                    {/* Dependencies */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-[#5E6C84] uppercase mb-2">Dependencies</h4>
                                        <div className="space-y-2 mb-3">
                                            {selectedTask.dependencies_details?.map(dep => (
                                                <div key={dep.id} className="flex items-center gap-3 p-2 bg-white border border-[#DFE1E6] rounded text-sm group hover:border-[#EB5A46] transition-colors">
                                                    <GitMerge size={14} className="text-[#EB5A46]" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-[#172B4D] truncate">{dep.title}</p>
                                                        <p className="text-[10px] text-[#5E6C84] uppercase">{dep.status.replace('_', ' ')}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveDependency(dep.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-[#5E6C84] hover:text-[#EB5A46] rounded transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            {selectedTask.dependents_details?.length > 0 && (
                                                <div className="pt-2">
                                                    <p className="text-[10px] font-bold text-[#5E6C84] uppercase mb-2 italic">Blocking these tasks:</p>
                                                    {selectedTask.dependents_details.map(dep => (
                                                        <div key={dep.id} className="flex items-center gap-2 p-1.5 opacity-70">
                                                            <GitMerge size={12} className="text-[#61BD4F] rotate-180" />
                                                            <span className="text-xs text-[#172B4D] truncate">{dep.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {showDependencyInput ? (
                                            <div className="bg-white border border-[#DFE1E6] rounded p-2 animate-in fade-in slide-in-from-top-1">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="w-full px-3 py-1.5 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF] mb-2"
                                                    placeholder="Search tasks in this board..."
                                                    value={dependencySearch}
                                                    onChange={e => setDependencySearch(e.target.value)}
                                                />
                                                <div className="max-h-32 overflow-y-auto mb-2 custom-scrollbar">
                                                    {tasks
                                                        .filter(t =>
                                                            t.id !== selectedTask.id &&
                                                            !selectedTask.dependencies?.includes(t.id) &&
                                                            t.title.toLowerCase().includes(dependencySearch.toLowerCase())
                                                        )
                                                        .map(t => (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => handleAddDependency(t.id)}
                                                                className="w-full text-left px-2 py-1.5 text-xs text-[#172B4D] hover:bg-[#F4F5F7] rounded flex items-center justify-between"
                                                            >
                                                                <span className="truncate">{t.title}</span>
                                                                <span className="text-[10px] text-[#5E6C84] uppercase shrink-0 ml-2">{t.status}</span>
                                                            </button>
                                                        ))}
                                                </div>
                                                <button onClick={() => setShowDependencyInput(false)} className="text-xs text-[#5E6C84] hover:underline">Cancel</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowDependencyInput(true)}
                                                className="px-3 py-1.5 bg-[#EBECF0] hover:bg-[#DFE1E6] text-[#172B4D] rounded text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={14} /> Add dependency
                                            </button>
                                        )}
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
                                        <div className="space-y-4">
                                            {[...comments.map(c => ({ ...c, type: 'comment' })), ...auditLogs.map(a => ({ ...a, type: 'audit', created_at: a.timestamp }))]
                                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                                .map((item, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-[#DFE1E6] flex items-center justify-center text-xs font-semibold shrink-0">
                                                            {item.user_details?.username[0].toUpperCase() || 'S'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-semibold text-[#172B4D]">{item.user_details?.username || 'System'}</span>
                                                                <span className="text-xs text-[#5E6C84]">
                                                                    {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                </span>
                                                            </div>
                                                            {item.type === 'comment' ? (
                                                                <div className="bg-white p-2 rounded text-sm text-[#172B4D] border border-[#DFE1E6]">{item.text}</div>
                                                            ) : (
                                                                <div className="text-xs text-[#5E6C84]">
                                                                    <span className="font-bold">{item.action.replace('_', ' ')}:</span>
                                                                    <ul className="mt-1 space-y-1">
                                                                        {Object.entries(item.details || {}).map(([field, delta]) => (
                                                                            <li key={field}>
                                                                                Changed <span className="font-medium text-[#172B4D]">{field}</span> from <span className="italic">"{delta.old}"</span> to <span className="italic">"{delta.new}"</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="w-44 space-y-2 shrink-0">
                                    <p className="text-xs font-semibold text-[#5E6C84] uppercase mb-2">Actions</p>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await api.post(`/projects/tasks/${selectedTask.id}/toggle_watch/`);
                                                fetchProjectDetails();
                                            } catch (e) { }
                                        }}
                                        className={`w-full text-left px-3 py-2 ${selectedTask.is_watching ? 'bg-[#EAE6FF] text-[#403294]' : 'bg-[#EBECF0] text-[#172B4D]'} hover:opacity-80 rounded text-sm font-medium flex items-center gap-2 transition-all`}
                                    >
                                        <Star size={14} className={selectedTask.is_watching ? 'fill-[#403294]' : ''} />
                                        {selectedTask.is_watching ? 'Watching' : 'Watch'}
                                    </button>
                                    <div className="h-4" />
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
                                    <button
                                        onClick={() => setShowSubtaskInput(true)}
                                        className="w-full text-left px-3 py-2 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] flex items-center gap-2"
                                    >
                                        <CheckSquare size={14} /> Checklist
                                    </button>

                                    <p className="text-xs font-semibold text-[#5E6C84] uppercase mb-2 pt-4">Milestone</p>
                                    <select
                                        className="w-full text-left px-3 py-2 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] outline-none appearance-none cursor-pointer"
                                        value={selectedTask.milestone || ''}
                                        onChange={(e) => handleUpdateTask(selectedTask.id, { milestone: e.target.value || null })}
                                    >
                                        <option value="">No Milestone</option>
                                        {project.milestones?.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>

                                    <p className="text-xs font-semibold text-[#5E6C84] uppercase mb-2 pt-4">Recurrence</p>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-[#EBECF0] rounded text-sm mb-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedTask.is_recurring}
                                                onChange={(e) => handleUpdateTask(selectedTask.id, { is_recurring: e.target.checked })}
                                                className="w-3 h-3 rounded border-gray-300 text-[#0079BF]"
                                            />
                                            <span className="text-[#172B4D] text-xs font-medium">Auto-repeat</span>
                                        </div>
                                        {selectedTask.is_recurring && (
                                            <select
                                                className="w-full text-left px-3 py-2 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] outline-none appearance-none cursor-pointer"
                                                value={selectedTask.recurrence_rule || ''}
                                                onChange={(e) => handleUpdateTask(selectedTask.id, { recurrence_rule: e.target.value })}
                                            >
                                                <option value="">Select frequency...</option>
                                                <option value="DAILY">Daily</option>
                                                <option value="WEEKLY">Weekly</option>
                                                <option value="MONTHLY">Monthly</option>
                                            </select>
                                        )}
                                    </div>

                                    <p className="text-xs font-semibold text-[#5E6C84] uppercase mb-2 pt-2">Actions</p>
                                    {activeTimer?.task === selectedTask.id && (
                                        <div className="bg-blue-50 p-3 rounded border border-blue-100 flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#0079BF] animate-pulse" />
                                                <span className="text-xs font-bold text-[#0079BF] uppercase">Timer Running</span>
                                            </div>
                                            <span className="text-lg font-mono font-bold text-[#0079BF]">{formatTime(elapsedTime)}</span>
                                        </div>
                                    )}
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
                )
            }

            {/* Share Modal (Redesigned) */}
            {
                showShareModal && (
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
                )
            }

            {/* Milestone Modal */}
            {
                isRoadmapModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="font-bold text-[#172B4D]">New Milestone</h3>
                                <button onClick={() => setIsRoadmapModalOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreateMilestone} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Title</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                                        value={newMilestone.name}
                                        onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })}
                                        placeholder="e.g. Beta Launch"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Due Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                                        value={newMilestone.due_date}
                                        onChange={e => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF] min-h-[100px]"
                                        value={newMilestone.description}
                                        onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                                        placeholder="What does this milestone achieve?"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full py-2 bg-[#0079BF] text-white font-bold rounded hover:bg-[#026AA7] transition-colors">
                                        Create Milestone
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Members Modal */}
            {
                showMembersModal && selectedTask && (
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
                )
            }

            {/* Labels Modal */}
            {
                showLabelsModal && selectedTask && (
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
                )
            }

            {/* Dates Modal */}
            {
                showDatesModal && selectedTask && (
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
                )
            }

            {/* Attachment Modal */}
            {
                showAttachmentModal && selectedTask && (
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
                )
            }

            {/* Background Modal */}
            {
                showBackgroundModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowBackgroundModal(false)}>
                        <div className="bg-white rounded w-full max-w-sm" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b border-[#DFE1E6]">
                                <h3 className="font-semibold text-[#172B4D]">Change Background</h3>
                                <button onClick={() => setShowBackgroundModal(false)} className="text-[#5E6C84] hover:text-[#172B4D]">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 grid grid-cols-3 gap-2">
                                {['#0079BF', '#D29034', '#519839', '#B04632', '#89609E', '#CD5A91', '#00AECC', '#838C91', '#172B4D'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleUpdateBackground(color)}
                                        className="h-16 rounded hover:opacity-90 transition-opacity relative"
                                        style={{ backgroundColor: color }}
                                    >
                                        {project.background_color === color && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Check size={24} className="text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Settings Modal */}
            {
                showSettingsModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSettingsModal(false)}>
                        <div className="bg-white rounded w-full max-w-lg" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b border-[#DFE1E6]">
                                <h3 className="font-semibold text-[#172B4D]">Board Settings</h3>
                                <button onClick={() => setShowSettingsModal(false)} className="text-[#5E6C84] hover:text-[#172B4D]">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateProjectSettings} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Board Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-[#DFE1E6] rounded text-[#172B4D] focus:border-[#0079BF] outline-none"
                                        value={settingsForm.name}
                                        onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <textarea
                                        className="w-full p-2 border border-[#DFE1E6] rounded text-[#172B4D] focus:border-[#0079BF] outline-none h-24 resize-none"
                                        value={settingsForm.description}
                                        onChange={e => setSettingsForm({ ...settingsForm, description: e.target.value })}
                                    />
                                </div>

                                <div className="border-t border-[#DFE1E6] pt-4">
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-3">Custom Workflow (Statuses)</label>
                                    <div className="space-y-2 mb-4">
                                        {project.custom_statuses?.map(s => (
                                            <div key={s.id} className="flex items-center justify-between p-2 bg-[#F4F5F7] rounded">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                                    <span className="text-sm font-medium text-[#172B4D]">{s.name}</span>
                                                </div>
                                                <button type="button" onClick={() => handleDeleteStatus(s.id)} className="text-[#5E6C84] hover:text-red-500"><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Status name..."
                                            className="flex-1 p-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                                            value={newStatusName}
                                            onChange={e => setNewStatusName(e.target.value)}
                                        />
                                        <input
                                            type="color"
                                            className="w-10 h-10 p-1 border border-[#DFE1E6] rounded cursor-pointer"
                                            value={newStatusColor}
                                            onChange={e => setNewStatusColor(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCreateStatus}
                                            className="px-3 py-1 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded text-sm font-bold text-[#42526E]"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-[#5E6C84] mt-2 italic">Note: Creating custom statuses will override the default To Do/In Progress/Done columns.</p>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowSettingsModal(false)}
                                        className="px-4 py-2 text-[#172B4D] hover:bg-[#F4F5F7] rounded font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#0079BF] text-white rounded font-medium hover:bg-[#026AA7] transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Goal Modal */}
            {
                showGoalModal && (
                    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="font-bold text-[#172B4D]">New Project Goal</h3>
                                <button onClick={() => setShowGoalModal(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreateGoal} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Title</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                                        value={newGoal.title}
                                        onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                        placeholder="e.g. Increase user retention by 20%"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Target Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                                        value={newGoal.target_date}
                                        onChange={e => setNewGoal({ ...newGoal, target_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF] min-h-[100px]"
                                        value={newGoal.description}
                                        onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                                        placeholder="Describe the desired outcome..."
                                    />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full py-2 bg-[#0079BF] text-white font-bold rounded hover:bg-[#026AA7] transition-colors">
                                        Define Goal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Deliverable Modal */}
            {
                showDeliverableModal && (
                    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="font-bold text-[#172B4D]">New Deliverable</h3>
                                <button onClick={() => setShowDeliverableModal(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreateDeliverable} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                                        value={newDeliverable.name}
                                        onChange={e => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
                                        placeholder="e.g. API Documentation"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                                        value={newDeliverable.due_date}
                                        onChange={e => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF] min-h-[100px]"
                                        value={newDeliverable.description}
                                        onChange={e => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                                        placeholder="Describe this output..."
                                    />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full py-2 bg-[#0079BF] text-white font-bold rounded hover:bg-[#026AA7] transition-colors">
                                        Create Deliverable
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProjectDetails;
