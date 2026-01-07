import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Plus, Star, MoreHorizontal, X, Users, Share2, Clock, MessageSquare,
    Paperclip, Tag, ChevronDown, ChevronRight, ChevronUp, List, Calendar as CalendarIcon, Layout, GitMerge, CheckSquare, Trash2,
    Flag, Target, TrendingUp, Shield, HelpCircle, AlertCircle, Package, BarChart, History,
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
        story_points: 0,
        parent_task: null
    });
    const [sprints, setSprints] = useState([]);
    const [showSprintModal, setShowSprintModal] = useState(false);
    const [newSprint, setNewSprint] = useState({ name: '', goal: '', start_date: '', end_date: '' });
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = searchParams.get('tab') || 'board';
    const setViewMode = (tab) => setSearchParams({ tab });
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
    const [tempStartDate, setTempStartDate] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [showSubtaskInput, setShowSubtaskInput] = useState(false);
    const [showDependencyInput, setShowDependencyInput] = useState(false);
    const [dependencySearch, setDependencySearch] = useState('');
    const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ name: '', due_date: '', description: '' });
    const [releases, setReleases] = useState([]);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [newRelease, setNewRelease] = useState({ name: '', version: '', release_date: '', description: '' });
    const [retrospectives, setRetrospectives] = useState([]);
    const [capacities, setCapacities] = useState([]);
    const [showRetroModal, setShowRetroModal] = useState(false);
    const [activeSprintForRetro, setActiveSprintForRetro] = useState(null);
    const [newRetro, setNewRetro] = useState({ what_went_well: '', what_could_be_improved: '', action_items: '' });
    const [selectedRetroSprint, setSelectedRetroSprint] = useState(null);
    const [selectedReportSprint, setSelectedReportSprint] = useState(null);
    const [reportType, setReportType] = useState('BURNDOWN');
    const [showCapacityModal, setShowCapacityModal] = useState(false);
    const [memberCapacities, setMemberCapacities] = useState({});
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
    const [reportData, setReportData] = useState({ burndown: { ideal: [], actual: [] }, velocity: [], burnup: [], workload: [] });
    const [isLoadingReports, setIsLoadingReports] = useState(false);

    // Section 3: Visualization & Boards
    const [groupBy, setGroupBy] = useState('none'); // none, assignee, priority
    const [draggedTaskId, setDraggedTaskId] = useState(null);

    // Collaboration & Communication
    const [announcements, setAnnouncements] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [collaborateMode, setCollaborateMode] = useState('chat'); // chat, announcements, notifications
    const [newChatText, setNewChatText] = useState('');
    const [newAnnounce, setNewAnnounce] = useState({ title: '', content: '' });
    const [showAnnounceModal, setShowAnnounceModal] = useState(false);
    const [timeEntries, setTimeEntries] = useState([]);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [newTimeEntry, setNewTimeEntry] = useState({ task: '', description: '', duration_minutes: 0, is_billable: true, start_time: '' });
    const [timeStats, setTimeStats] = useState({ today_minutes: 0, week_minutes: 0 });

    const fetchProjectDetails = async () => {
        try {
            const [projectRes, tasksRes, userRes, sprintRes, releaseRes, retrosRes, capacityRes, activityRes, announceRes, notifyRes] = await Promise.all([
                api.get(`/projects/projects/${id}/`),
                api.get(`/projects/tasks/?project_id=${id}`),
                api.get('/users/list/'),
                api.get(`/projects/sprints/?project_id=${id}`),
                api.get(`/projects/releases/?project_id=${id}`),
                api.get('/projects/retrospectives/'),
                api.get('/projects/capacities/'),
                api.get(`/projects/projects/${id}/recent_activity/`),
                api.get(`/collaboration/announcements/?project_id=${id}`),
                api.get('/collaboration/notifications/')
            ]);
            setProject(projectRes.data);
            setTasks(tasksRes.data);
            setAllUsers(userRes.data);
            setSprints(sprintRes.data);
            setReleases(releaseRes.data);
            setRetrospectives(retrosRes.data);
            setCapacities(capacityRes.data);
            setAuditLogs(activityRes.data);
            setAnnouncements(announceRes.data);
            setNotifications(notifyRes.data);

            // Fetch time tracking data
            const timeRes = await api.get(`/timetracking/entries/?project_id=${id}`);
            setTimeEntries(timeRes.data);
            const timeStatsRes = await api.get('/timetracking/entries/stats/');
            setTimeStats(timeStatsRes.data);

            if (!selectedReportSprint) {
                const activeSprint = sprintRes.data.find(s => s.status === 'ACTIVE');
                if (activeSprint) setSelectedReportSprint(activeSprint.id);
            }
        } catch (error) { console.error("Fetch error:", error); }
    };

    const fetchReportData = async () => {
        if (viewMode !== 'reports' && viewMode !== 'workload') return;
        setIsLoadingReports(true);
        try {
            if (reportType === 'BURNDOWN' && selectedReportSprint) {
                const res = await api.get(`/reports/analytics/burndown/?sprint_id=${selectedReportSprint}`);
                setReportData(prev => ({ ...prev, burndown: res.data }));
            } else if (reportType === 'VELOCITY') {
                const res = await api.get(`/reports/analytics/velocity/?project_id=${id}`);
                setReportData(prev => ({ ...prev, velocity: res.data }));
            } else if (reportType === 'BURNUP' && selectedReportSprint) {
                const res = await api.get(`/reports/analytics/burnup/?sprint_id=${selectedReportSprint}`);
                setReportData(prev => ({ ...prev, burnup: res.data }));
            }

            if (viewMode === 'workload') {
                const res = await api.get(`/reports/analytics/workload/?project_id=${id}`);
                setReportData(prev => ({ ...prev, workload: res.data }));
            }
        } catch (error) {
            console.error("Report fetch error:", error);
        } finally {
            setIsLoadingReports(false);
        }
    };

    useEffect(() => {
        fetchReportData();
        if (viewMode === 'collaboration') {
            fetchChatMessages();
        }
    }, [viewMode, reportType, selectedReportSprint]);

    const fetchChatMessages = async () => {
        try {
            const res = await api.get(`/collaboration/chat/?content_type=project&object_id=${id}`);
            setChatMessages(res.data);
        } catch (error) { console.error("Chat fetch error:", error); }
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
                const res = await api.get('/timetracking/entries/current/');
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
            const payload = {
                ...newTask,
                project: id,
                description: newTask.description?.trim() || null,
                due_date: newTask.due_date || null,
                parent_task: newTask.parent_task || null,
                status: newTask.status || 'TODO'
            };

            await api.post('/projects/tasks/', payload);
            setIsTaskModalOpen(false);
            setNewTask({
                title: '',
                description: '',
                priority: 'MEDIUM',
                status: 'TODO',
                due_date: '',
                issue_type: 'TASK',
                story_points: 0,
                parent_task: null
            });
            fetchProjectDetails();
            showToast("Issue created successfully", "success");
        } catch (error) {
            console.error('Failed to create issue:', error.response?.data);
            showToast(error.response?.data?.title?.[0] || error.response?.data?.detail || "Failed to create issue", "error");
        }
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
            const res = await api.post('/timetracking/entries/start_timer/', { task_id: taskId });
            setActiveTimer(res.data);
            setElapsedTime(0);
        } catch (error) { }
    };

    const stopTimer = async () => {
        try {
            await api.post('/timetracking/entries/stop_timer/');
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
            if (selectedTask) {
                await handleUpdateTask(selectedTask.id, { assigned_to: userId });
            } else {
                await api.post(`/projects/projects/${id}/add_member/`, { user_id: userId });
                fetchProjectDetails();
            }
            setShowMembersModal(false);
        } catch (error) {
            console.error("Failed to update members", error);
        }
    };

    const handleUpdatePriority = async (priority) => {
        try {
            await handleUpdateTask(selectedTask.id, { priority });
            setShowLabelsModal(false);
        } catch (error) { }
    };

    const handleUpdateDates = async () => {
        const data = {};
        if (tempStartDate) data.start_date = tempStartDate;
        if (tempDueDate) data.due_date = tempDueDate;

        if (Object.keys(data).length === 0) return;

        try {
            await handleUpdateTask(selectedTask.id, data);
            setShowDatesModal(false);
            setTempStartDate('');
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

    const handleCreateRelease = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/releases/', { ...newRelease, project: id });
            setNewRelease({ name: '', version: '', release_date: '', description: '' });
            setShowReleaseModal(false);
            fetchProjectDetails();
        } catch (error) { alert('Failed to create release'); }
    };

    const handleToggleRelease = async (releaseId, currentStatus) => {
        try {
            await api.patch(`/projects/releases/${releaseId}/`, { is_released: !currentStatus });
            fetchProjectDetails();
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

    const handleSendChat = async () => {
        if (!newChatText.trim()) return;
        try {
            await api.post('/collaboration/chat/', {
                text: newChatText,
                content_type: 'project',
                object_id: id
            });
            setNewChatText('');
            fetchChatMessages();
            // Scroll to bottom
            setTimeout(() => {
                const stream = document.getElementById('chat-stream');
                if (stream) stream.scrollTop = stream.scrollHeight;
            }, 100);
        } catch (error) { showToast("Failed to send message", "error"); }
    };

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        try {
            await api.post('/collaboration/announcements/', {
                ...newAnnounce,
                project: id
            });
            setShowAnnounceModal(false);
            setNewAnnounce({ title: '', content: '' });
            fetchProjectDetails();
            showToast("Announcement published!");
        } catch (error) { showToast("Failed to publish announcement", "error"); }
    };

    const handleMarkNotificationRead = async (notifyId) => {
        try {
            await api.post(`/collaboration/notifications/${notifyId}/mark_as_read/`);
            setNotifications(prev => prev.map(n => n.id === notifyId ? { ...n, is_read: true } : n));
        } catch (error) { }
    };

    const handleToggleReaction = async (contentType, objectId, emoji) => {
        try {
            await api.post('/activity/reactions/toggle_reaction/', {
                content_type: contentType,
                object_id: objectId,
                emoji: emoji
            });
            if (contentType === 'chatmessage') fetchChatMessages();
            else fetchProjectDetails();
        } catch (error) { console.error("Reaction error:", error); }
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
        } catch (error) {
            showToast("Failed to create status", "error");
        }
    };

    const handleCreateRetro = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/retrospectives/', { ...newRetro, sprint: activeSprintForRetro.id });
            setNewRetro({ what_went_well: '', what_could_be_improved: '', action_items: '' });
            setShowRetroModal(false);
            fetchProjectDetails();
        } catch (error) {
            showToast("Failed to save retrospective", "error");
        }
    };

    const handleLogTime = async () => {
        try {
            await api.post('/timetracking/entries/log_manual/', {
                ...newTimeEntry,
                project: id
            });
            setShowTimeModal(false);
            setNewTimeEntry({ task: '', description: '', duration_minutes: 0, is_billable: true, start_time: '' });
            fetchProjectDetails();
            showToast('Time logged successfully', 'success');
        } catch (error) {
            showToast('Failed to log time', 'error');
        }
    };

    const handleCreateSprint = async () => {
        if (!newSprint.name || !newSprint.start_date || !newSprint.end_date) return;
        try {
            await api.post('/projects/sprints/', { ...newSprint, project: id });
            setNewSprint({ name: '', goal: '', start_date: '', end_date: '' });
            setShowSprintModal(false);
            fetchProjectDetails();
        } catch (error) { showToast("Failed to create sprint", "error"); }
    };

    const handleUpdateCapacity = async (memberId, hours) => {
        try {
            await api.post('/projects/capacities/', {
                project: id,
                user: memberId,
                capacity_hours: hours,
                sprint: sprints.find(s => s.status === 'ACTIVE')?.id
            });
            fetchProjectDetails();
        } catch (error) { showToast("Failed to update capacity", "error"); }
    };

    const handleDeleteStatus = async (statusId) => {
        if (!window.confirm('Are you sure? Tasks in this status might become invisible.')) return;
        try {
            await api.delete(`/projects/statuses/${statusId}/`);
            fetchProjectDetails();
        } catch (error) { showToast("Failed to delete status", "error"); }
    };

    // Drag and Drop Handlers
    const onDragStart = (e, taskId) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = async (e, targetStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId') || draggedTaskId;
        if (!taskId) return;

        try {
            await handleMoveCard(parseInt(taskId), targetStatus);
            setDraggedTaskId(null);
        } catch (error) { console.error('Drop failed', error); }
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

    const rootTasks = Array.isArray(tasks) ? tasks.filter(t => !t.parent_task || t.parent_task === null || t.parent_task === undefined) : [];

    // Grouping for Swimlanes
    const swimlanes = () => {
        if (groupBy === 'assignee') {
            const groups = { 'Unassigned': [] };
            allUsers.forEach(u => groups[u.username] = []);
            tasks.forEach(t => {
                const key = t.assigned_to_details?.username || 'Unassigned';
                if (!groups[key]) groups[key] = [];
                groups[key].push(t);
            });
            return Object.entries(groups).filter(([_, items]) => items.length > 0 || _ !== 'Unassigned');
        }
        if (groupBy === 'priority') {
            const groups = { 'CRITICAL': [], 'HIGH': [], 'MEDIUM': [], 'LOW': [] };
            tasks.forEach(t => {
                const key = t.priority || 'MEDIUM';
                groups[key].push(t);
            });
            return Object.entries(groups);
        }
        if (groupBy === 'sprint') {
            const groups = { 'Backlog': [] };
            sprints.forEach(s => groups[s.name] = []);
            tasks.forEach(t => {
                const key = t.sprint_details?.name || 'Backlog';
                if (!groups[key]) groups[key] = [];
                groups[key].push(t);
            });
            return Object.entries(groups).filter(([_, items]) => items.length > 0 || _ !== 'Backlog');
        }
        return [['All Tasks', tasks]];
    };

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

    if (!project) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#FAFBFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#0052CC] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#5E6C84] font-bold animate-pulse">Loading board details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-white font-sans text-[#172B4D] overflow-hidden">
            {/* Jira Style Header */}
            <header className="px-6 pt-4 flex flex-col shrink-0 border-b border-[#DFE1E6] bg-[#FAFBFC]" style={{ borderTop: `4px solid ${project?.background_color || '#0052CC'}` }}>
                <div className="flex items-center gap-2 text-sm text-[#5E6C84] mb-4">
                    <span className="hover:text-[#0052CC] cursor-pointer" onClick={() => navigate('/projects')}>Projects</span>
                    <ChevronDown size={14} className="rotate-[-90deg]" />
                    <span className="hover:text-[#0052CC] cursor-pointer">{project.name}</span>
                    <ChevronDown size={14} className="rotate-[-90deg]" />
                    <span className="text-[#172B4D] font-bold capitalize">{viewMode}</span>
                </div>

                <div className="flex items-center justify-between pb-4">
                    {/* Left: Project Identity */}
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0052CC] rounded-[3px] flex items-center justify-center text-white shrink-0 shadow-sm">
                            <Kanban size={24} />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-[#172B4D]">{project.name}</h1>
                                <button onClick={handleToggleStar} className="p-1 hover:bg-[#EBECF0] rounded transition-colors">
                                    <Star size={18} className={project.is_starred ? 'fill-amber-400 text-amber-400' : 'text-[#5E6C84]'} />
                                </button>
                                <button
                                    onClick={() => setIsTaskModalOpen(true)}
                                    className="ml-2 px-3 py-1 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-sm text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <Plus size={14} /> Create
                                </button>
                            </div>
                            <p className="text-[11px] text-[#5E6C84] uppercase font-bold tracking-wider">Software project</p>
                        </div>
                    </div>

                    {/* Right: Stats & Actions */}
                    <div className="flex items-center gap-8">
                        {/* Status Stats */}
                        <div className="hidden lg:flex items-center gap-5 border-r border-[#DFE1E6] pr-8">
                            {columns.map(col => {
                                const count = tasks.filter(t =>
                                    t.status === col.id ||
                                    t.status?.toUpperCase() === col.id?.toUpperCase()
                                ).length;
                                return (
                                    <div key={col.id} className="flex flex-col items-center">
                                        <span className="text-[9px] font-bold text-[#5E6C84] uppercase tracking-wider mb-0.5">{col.title}</span>
                                        <span className={`text-xs font-bold ${count > 0 ? 'text-[#172B4D]' : 'text-[#A5ADBA]'}`}>{count}</span>
                                    </div>
                                );
                            })}
                            <div className="flex flex-col items-center pl-5 border-l border-[#DFE1E6]">
                                <span className="text-[9px] font-bold text-[#5E6C84] uppercase tracking-wider mb-0.5">Total</span>
                                <span className="text-xs font-bold text-[#0052CC]">{tasks.length}</span>
                            </div>
                        </div>

                        {/* Team & Actions */}
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {project.members_details?.slice(0, 5).map((m, i) => (
                                    <div
                                        key={i}
                                        title={m.username}
                                        className="w-7 h-7 rounded-full border-2 border-white bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-bold ring-1 ring-[#DFE1E6]"
                                    >
                                        {m.username[0].toUpperCase()}
                                    </div>
                                ))}
                                {project.members_details?.length > 5 && (
                                    <div className="w-7 h-7 rounded-full border-2 border-white bg-[#EBECF0] text-[#42526E] flex items-center justify-center text-[10px] font-bold ring-1 ring-[#DFE1E6]">
                                        +{project.members_details.length - 5}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowMembersModal(true)}
                                className="w-7 h-7 rounded-full border border-dashed border-[#DFE1E6] flex items-center justify-center text-[#5E6C84] hover:border-[#0052CC] hover:text-[#0052CC] transition-colors"
                            >
                                <Plus size={14} />
                            </button>
                            <div className="h-5 w-px bg-[#DFE1E6] mx-1" />
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="px-3 py-1.5 bg-[#EBECF0] hover:bg-[#DFE1E6] rounded-sm text-xs font-bold text-[#42526E] transition-colors flex items-center gap-2"
                            >
                                <Share2 size={14} /> Share
                            </button>
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMoreMenu(!showMoreMenu);
                                    }}
                                    className="p-1 hover:bg-[#EBECF0] rounded-sm transition-colors text-[#5E6C84]"
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
                </div>{/* Horizontal Navigation Tabs */}
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
                        <button onClick={() => setViewMode('grid')} className={`px-3 py-2 border-b-2 text-sm font-bold transition-colors ${viewMode === 'grid' ? 'border-[#0052CC] text-[#0052CC]' : 'border-transparent text-[#42526E] hover:text-[#0052CC]'}`}>
                            Grid
                        </button>
                    </div>

                    <button onClick={openSettings} className="px-3 py-2 border-b-2 text-sm font-bold border-transparent text-[#42526E] hover:text-[#0052CC] shrink-0">
                        Project settings
                    </button>
                </nav>
            </header>

            <main className="flex-1 overflow-auto bg-[#F4F5F7] flex flex-col">
                {viewMode === 'board' && (
                    <div className="px-6 py-2 bg-white/50 border-b border-[#DFE1E6] flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Group By:</span>
                            <div className="flex bg-[#EBECF0] p-0.5 rounded-sm">
                                {['none', 'assignee', 'priority', 'sprint'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setGroupBy(mode)}
                                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-sm transition-all ${groupBy === mode ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#42526E] hover:text-[#172B4D]'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-[#5E6C84] italic">Drag cards to update status</span>
                        </div>
                    </div>
                )}

                {viewMode === 'board' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {swimlanes().map(([groupName, groupTasks]) => (
                            <div key={groupName} className="space-y-4">
                                {groupBy !== 'none' && (
                                    <div className="flex items-center gap-3 py-2 border-b border-[#DFE1E6]">
                                        <ChevronDown size={14} className="text-[#5E6C84]" />
                                        <h2 className="text-sm font-bold text-[#172B4D] uppercase">{groupName}</h2>
                                        <span className="text-[10px] text-[#5E6C84] bg-[#EBECF0] px-1.5 py-0.5 rounded-full font-bold">{groupTasks.length}</span>
                                    </div>
                                )}
                                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                    {columns.map((col) => (
                                        <div
                                            key={col.id}
                                            onDragOver={onDragOver}
                                            onDrop={(e) => onDrop(e, col.id)}
                                            className="flex flex-col w-[280px] md:w-[320px] shrink-0 min-h-[200px] group/col"
                                        >
                                            {/* List Header (Only if no swimlanes or top row) */}
                                            <div className="px-3 py-3 flex items-center justify-between group">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider">
                                                        {col.title}
                                                    </h3>
                                                    <span className="bg-[#DFE1E6] text-[#42526E] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                        {groupTasks.filter(t =>
                                                            t.status === col.id ||
                                                            t.status?.toUpperCase() === col.id?.toUpperCase()
                                                        ).length}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Cards Container */}
                                            <div className="flex-1 px-1 pb-4 space-y-2 min-h-[100px]">
                                                {/* Inline Quick Add */}
                                                <div className="mb-2">
                                                    {isAddingCard.columnId === col.id ? (
                                                        <div className="bg-white p-2 rounded shadow-sm border border-[#0052CC] animate-in fade-in slide-in-from-top-1">
                                                            <textarea
                                                                autoFocus
                                                                className="w-full p-2 text-sm border-none outline-none resize-none min-h-[60px]"
                                                                placeholder="Enter a title for this card..."
                                                                value={isAddingCard.title}
                                                                onChange={(e) => setIsAddingCard({ ...isAddingCard, title: e.target.value })}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleQuickAddCard(col.id);
                                                                    }
                                                                    if (e.key === 'Escape') setIsAddingCard({ columnId: null, title: '' });
                                                                }}
                                                            />
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <button
                                                                    onClick={() => handleQuickAddCard(col.id)}
                                                                    className="px-3 py-1.5 bg-[#0052CC] text-white rounded text-xs font-bold hover:bg-[#0747A6]"
                                                                >
                                                                    Add card
                                                                </button>
                                                                <button
                                                                    onClick={() => setIsAddingCard({ columnId: null, title: '' })}
                                                                    className="p-1.5 hover:bg-[#EBECF0] rounded text-[#5E6C84]"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setIsAddingCard({ columnId: col.id, title: '' })}
                                                            className="w-full flex items-center gap-2 p-2 hover:bg-[#EBECF0] rounded-sm text-[#42526E] text-xs font-bold transition-all group opacity-0 group-hover/col:opacity-100"
                                                        >
                                                            <Plus size={16} className="text-[#5E6C84] group-hover:text-[#0052CC]" />
                                                            <span>Add card</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {groupTasks.filter(t =>
                                                    t.status === col.id ||
                                                    t.status?.toUpperCase() === col.id?.toUpperCase()
                                                ).map((task) => (
                                                    <div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => onDragStart(e, task.id)}
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
                                                        className={`bg-white rounded-[3px] border ${selectedTaskIds.includes(task.id) ? 'border-[#4C9AFF] bg-[#E6F0FF]' : 'border-[#DFE1E6]'} hover:border-[#4C9AFF] hover:bg-[#FAFBFC] transition-all cursor-grab active:cursor-grabbing p-3 group relative shadow-sm`}
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
                                                                        <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white" title={task.assigned_to_details.username}>
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

                                                <button
                                                    onClick={() => {
                                                        setNewTask({ ...newTask, status: col.id });
                                                        setIsTaskModalOpen(true);
                                                    }}
                                                    className="w-full flex items-center gap-2 p-2 hover:bg-[#EBECF0] rounded-sm text-[#42526E] text-xs font-bold transition-all group"
                                                >
                                                    <Plus size={16} className="text-[#5E6C84] group-hover:text-[#0052CC]" />
                                                    <span>Create issue</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {viewMode === 'list' && (
                    <div className="flex-1 flex flex-col p-6 overflow-hidden">
                        <div className="border border-[#DFE1E6] rounded-sm overflow-hidden flex flex-col bg-white">
                            <div className="bg-[#FAFBFC] border-b border-[#DFE1E6] flex items-center justify-between h-10 px-4">
                                <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-wider">Project Backlog</h3>
                                <button
                                    onClick={() => setShowSprintModal(true)}
                                    className="px-2 py-1 hover:bg-[#EBECF0] rounded text-[11px] font-bold text-[#0052CC] flex items-center gap-1.5 transition-colors"
                                >
                                    <Plus size={14} /> Create sprint
                                </button>
                            </div>

                            {/* Sprints List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {sprints.filter(s => s.status !== 'COMPLETED').map(sprint => (
                                    <div key={sprint.id} className="border-b border-[#DFE1E6] bg-white group/sprint">
                                        <div className="bg-[#F4F5F7] px-4 py-2 flex items-center justify-between sticky top-0 z-20">
                                            <div className="flex items-center gap-3">
                                                <ChevronRight size={14} className="text-[#5E6C84] group-hover/sprint:text-[#0052CC]" />
                                                <span className="text-xs font-bold text-[#172B4D]">{sprint.name}</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${sprint.status === 'ACTIVE' ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#EBECF0] text-[#42526E]'}`}>
                                                    {sprint.status}
                                                </span>
                                                <span className="text-[10px] text-[#5E6C84]">{tasks.filter(t => t.sprint === sprint.id).length} issues</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] text-[#5E6C84] font-medium">{new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}</span>
                                                {sprint.status === 'PLANNED' && (
                                                    <button onClick={async () => {
                                                        await api.post(`/projects/sprints/${sprint.id}/start_sprint/`);
                                                        fetchProjectDetails();
                                                    }} className="px-3 py-1 bg-[#0052CC] text-white text-[10px] font-bold rounded hover:bg-[#0747A6] transition-colors">
                                                        Start sprint
                                                    </button>
                                                )}
                                                {sprint.status === 'ACTIVE' && (
                                                    <button onClick={async () => {
                                                        if (window.confirm("Complete sprint and move unfinished tasks to backlog?")) {
                                                            await api.post(`/projects/sprints/${sprint.id}/complete_sprint/`);
                                                            fetchProjectDetails();
                                                        }
                                                    }} className="px-3 py-1 bg-[#F4F5F7] border border-[#DFE1E6] text-[#172B4D] text-[10px] font-bold rounded hover:bg-[#EBECF0]">
                                                        Complete sprint
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="divide-y divide-[#F4F5F7]">
                                            {tasks.filter(t => t.sprint === sprint.id).map(task => (
                                                <div key={task.id} onClick={() => setSelectedTask(task)} className="px-10 py-2 flex items-center justify-between hover:bg-[#FAFBFC] cursor-pointer group/item">
                                                    <div className="flex items-center gap-3">
                                                        {getIssueTypeIcon(task.issue_type)}
                                                        <span className="text-xs text-[#172B4D] group-hover/item:text-[#0052CC] transition-colors">{task.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {task.story_points > 0 && <span className="text-[10px] font-bold bg-[#DFE1E6] px-1.5 py-0.5 rounded-full">{task.story_points}</span>}
                                                        <div className={`w-5 h-5 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[9px] font-bold`}>
                                                            {task.assigned_to_details?.username?.[0].toUpperCase() || '?'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {tasks.filter(t => t.sprint === sprint.id).length === 0 && (
                                                <div className="px-10 py-4 text-xs text-[#5E6C84] italic">Drag items here or edit issues to plan this sprint.</div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Backlog (No Sprint) */}
                                <div className="bg-white">
                                    <div className="bg-[#EBECF0] px-4 py-2 flex items-center justify-between sticky top-0 z-20">
                                        <div className="flex items-center gap-3">
                                            <ChevronDown size={14} className="text-[#5E6C84]" />
                                            <span className="text-xs font-bold text-[#172B4D]">Backlog</span>
                                            <span className="text-[10px] text-[#5E6C84]">{tasks.filter(t => !t.sprint).length} issues</span>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-[#F4F5F7]">
                                        {tasks.filter(t => !t.sprint).map(task => (
                                            <div key={task.id} onClick={() => setSelectedTask(task)} className="px-10 py-2 flex items-center justify-between hover:bg-[#FAFBFC] cursor-pointer group/item">
                                                <div className="flex items-center gap-3">
                                                    {getIssueTypeIcon(task.issue_type)}
                                                    <span className="text-xs text-[#172B4D] group-hover/item:text-[#0052CC] transition-colors">{task.title}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-[#5E6C84] font-bold">
                                                    <span className="uppercase">{task.priority}</span>
                                                    {task.story_points > 0 && <span className="bg-[#DFE1E6] px-1.5 py-0.5 rounded-full">{task.story_points}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {
                    viewMode === 'calendar' && (
                        <div className="flex-1 overflow-auto p-6 bg-white">
                            <CalendarView tasks={tasks} />
                        </div>
                    )
                }

                {
                    viewMode === 'timeline' && (
                        <div className="flex-1 overflow-auto p-6 bg-white">
                            <GanttChart
                                tasks={tasks}
                                onTaskClick={setSelectedTask}
                                onUpdateTask={handleUpdateTask}
                            />
                        </div>
                    )
                }

                {
                    viewMode === 'workload' && (
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="max-w-4xl mx-auto space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-[#172B4D]">Resource Workload</h2>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-[#61BD4F] rounded-full" />
                                            <span className="text-[10px] font-bold text-[#5E6C84] uppercase">Capacity</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-[#EBECF0] rounded-full" />
                                            <span className="text-[10px] font-bold text-[#5E6C84] uppercase">Available</span>
                                        </div>
                                    </div>
                                </div>
                                {isLoadingReports ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052CC]"></div>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {reportData.workload.map(u => (
                                            <div key={u.assigned_to__id} className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-[#0052CC] text-white rounded-full flex items-center justify-center text-lg font-bold shadow-sm">
                                                            {u.assigned_to__username[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-[#172B4D] text-lg">{u.assigned_to__username}</h3>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-[#5E6C84]">
                                                                <span className="flex items-center gap-1"><Package size={12} /> {u.total_tasks} Tasks</span>
                                                                <span className="flex items-center gap-1"><Circle size={8} className="fill-amber-400 text-amber-400" /> {u.open_tasks} Open</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-3xl font-bold text-[#172B4D]">{u.total_points || 0}</p>
                                                        <p className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest">Story Points</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between text-xs font-bold text-[#5E6C84] uppercase">
                                                        <span>Completion Ratio</span>
                                                        <span>{(((u.total_tasks - u.open_tasks) / u.total_tasks) * 100 || 0).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-3 bg-[#EBECF0] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#61BD4F] transition-all duration-1000 shadow-[inset_0_1px_1px_rgba(0,0,0,0.1)]"
                                                            style={{ width: `${u.total_tasks > 0 ? ((u.total_tasks - u.open_tasks) / u.total_tasks) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between pt-2">
                                                        <div className="flex gap-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-[#5E6C84] uppercase font-bold">Planned</span>
                                                                <span className="text-sm font-bold text-[#172B4D]">{u.total_points || 0} pts</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-[#5E6C84] uppercase font-bold">Remaining</span>
                                                                <span className="text-sm font-bold text-[#DE350B]">{u.open_points || 0} pts</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => { setViewMode('board'); setGroupBy('assignee'); }}
                                                            className="text-xs font-bold text-[#0052CC] hover:underline"
                                                        >
                                                            View tasks
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {reportData.workload.length === 0 && (
                                            <div className="text-center py-20 bg-white border-2 border-dashed border-[#DFE1E6] rounded-lg">
                                                <Users size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                                                <p className="text-[#5E6C84]">No workload data available for this project.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {
                    viewMode === 'grid' && (
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {(rootTasks.length > 0 ? rootTasks : tasks).length > 0 ? (rootTasks.length > 0 ? rootTasks : tasks).map(task => (
                                    <div key={task.id} onClick={() => setSelectedTask(task)} className="bg-white border border-[#DFE1E6] rounded-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">{project.key}-{task.id}</span>
                                            {getIssueTypeIcon(task.issue_type)}
                                        </div>
                                        <h3 className="font-bold text-[#172B4D] mb-4 min-h-[40px]">{task.title}</h3>
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase ${task.status === 'DONE' ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#DEEBFF] text-[#0052CC]'}`}>
                                                {task.status}
                                            </span>
                                            {task.assigned_to_details && (
                                                <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-bold">
                                                    {task.assigned_to_details.username[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-[#DFE1E6] rounded-lg">
                                        <div className="w-16 h-16 bg-[#FAFBFC] rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Layout size={32} className="text-[#DFE1E6]" />
                                        </div>
                                        <h3 className="text-lg font-bold text-[#172B4D] mb-2">No tasks found</h3>
                                        <p className="text-sm text-[#5E6C84] mb-6 max-w-xs mx-auto">This project doesn't have any tasks in the grid yet. Start by creating a new issue.</p>
                                        <button
                                            onClick={() => setIsTaskModalOpen(true)}
                                            className="px-4 py-2 bg-[#0052CC] text-white rounded text-sm font-bold hover:bg-[#0747A6] transition-colors"
                                        >
                                            Create issue
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {
                    viewMode === 'roadmap' && (
                        <div className="flex-1 overflow-y-auto p-8 bg-[#F4F5F7]">
                            <div className="max-w-5xl mx-auto">
                                {/* Roadmap Header Summary */}
                                <div className="bg-white rounded-lg border border-[#DFE1E6] p-8 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0052CC]/5 rounded-full -mr-32 -mt-32" />
                                    <div className="relative z-10">
                                        <h1 className="text-2xl font-bold text-[#172B4D] mb-2">Project Roadmap</h1>
                                        <p className="text-sm text-[#5E6C84] max-w-md">Strategic milestones and key project outputs. Track progress across all major deliverables and objectives.</p>
                                    </div>

                                    <div className="flex items-center gap-12 relative z-10">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-[#0052CC]">
                                                {project.milestones?.filter(m => m.is_completed).length || 0} / {project.milestones?.length || 0}
                                            </div>
                                            <div className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest mt-1">Milestones</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-[#00875A]">
                                                {project.deliverables?.filter(d => d.is_completed).length || 0}
                                            </div>
                                            <div className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest mt-1">Delivered</div>
                                        </div>
                                        <div className="w-32">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-[#5E6C84]">PROGRESS</span>
                                                <span className="text-[10px] font-bold text-[#172B4D]">{(project.task_stats?.percentage || 0).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-2 bg-[#EBECF0] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#0052CC] transition-all duration-1000"
                                                    style={{ width: `${project.task_stats?.percentage || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left: Milestones Timeline */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest flex items-center gap-2">
                                                <Flag size={14} className="text-[#0052CC]" /> Milestones
                                            </h3>
                                            <button onClick={() => setIsRoadmapModalOpen(true)} className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1">
                                                <Plus size={14} /> New Milestone
                                            </button>
                                        </div>

                                        <div className="bg-white rounded-lg border border-[#DFE1E6] overflow-hidden">
                                            {project.milestones && project.milestones.length > 0 ? (
                                                <div className="divide-y divide-[#DFE1E6]">
                                                    {project.milestones.map((m) => {
                                                        const milestoneTasks = tasks.filter(t => t.milestone === m.id);
                                                        const completedTasks = milestoneTasks.filter(t => t.status === 'DONE').length;
                                                        const progress = milestoneTasks.length > 0 ? (completedTasks / milestoneTasks.length) * 100 : 0;

                                                        return (
                                                            <div key={m.id} className="p-6 hover:bg-[#FAFBFC] transition-colors group">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.is_completed ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#DEEBFF] text-[#0052CC]'}`}>
                                                                            <Flag size={16} />
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-bold text-[#172B4D]">{m.name}</h4>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                <CalendarIcon size={12} className="text-[#5E6C84]" />
                                                                                <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">
                                                                                    {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${m.is_completed ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#EBECF0] text-[#5E6C84]'}`}>
                                                                            {m.is_completed ? 'Completed' : 'Planned'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-[#5E6C84] mb-4">{m.description}</p>

                                                                <div className="space-y-1.5">
                                                                    <div className="flex justify-between text-[10px] font-bold text-[#5E6C84]">
                                                                        <span>OBJECTIVE PROGRESS</span>
                                                                        <span>{Math.round(progress)}%</span>
                                                                    </div>
                                                                    <div className="h-1.5 bg-[#EBECF0] rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full transition-all duration-700 ${progress === 100 ? 'bg-[#00875A]' : 'bg-[#0052CC]'}`}
                                                                            style={{ width: `${progress}%` }}
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-between text-[10px] text-[#5E6C84] pt-1">
                                                                        <span>{completedTasks} of {milestoneTasks.length} tasks completed</span>
                                                                        <button onClick={() => {
                                                                            // Future: Filter tasks list by this milestone
                                                                            setViewMode('list');
                                                                        }} className="text-[#0052CC] hover:underline font-bold">View Tasks</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center">
                                                    <Flag size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                                                    <p className="text-[#5E6C84]">Setting milestones helps keep the project on track.</p>
                                                    <button onClick={() => setIsRoadmapModalOpen(true)} className="mt-4 px-4 py-2 bg-[#0052CC] text-white rounded font-bold text-sm">Add First Milestone</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Deliverables & Stats */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest flex items-center gap-2">
                                                <Package size={14} className="text-[#0052CC]" /> Deliverables
                                            </h3>
                                            <button onClick={() => setShowDeliverableModal(true)} className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1">
                                                <Plus size={14} /> New deliverable
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {project.deliverables?.map((d) => (
                                                <div key={d.id} className="bg-white border border-[#DFE1E6] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${d.is_completed ? 'bg-[#00875A]' : 'bg-[#FF9F1A]'}`} />
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-sm font-bold text-[#172B4D]">{d.name}</h4>
                                                        <button
                                                            onClick={() => handleToggleDeliverable(d.id, d.is_completed)}
                                                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${d.is_completed ? 'bg-[#00875A] border-[#00875A] text-white' : 'border-[#DFE1E6] bg-white group-hover:border-[#0052CC]'}`}
                                                        >
                                                            {d.is_completed && <Check size={12} />}
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-[#5E6C84] mb-3 line-clamp-2">{d.description}</p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#5E6C84] uppercase">
                                                            <Clock size={10} />
                                                            {d.due_date ? new Date(d.due_date).toLocaleDateString() : 'TBD'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!project.deliverables || project.deliverables.length === 0) && (
                                                <div className="bg-[#EBECF0]/30 border-2 border-dashed border-[#DFE1E6] rounded-lg p-8 text-center">
                                                    <p className="text-xs text-[#5E6C84]">Define concrete deliverables to measure project success.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    viewMode === 'releases' && (
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-[#172B4D]">Releases</h2>
                                    <button
                                        onClick={() => setShowReleaseModal(true)}
                                        className="px-4 py-2 bg-[#0052CC] text-white rounded font-bold text-sm flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Create Release
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {releases.map(release => (
                                        <div key={release.id} className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${release.is_released ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#DEEBFF] text-[#0052CC]'}`}>
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold text-[#172B4D] text-lg">{release.name}</h3>
                                                        <span className="bg-[#EBECF0] text-[#42526E] text-[11px] font-bold px-2 py-0.5 rounded uppercase">{release.version}</span>
                                                    </div>
                                                    <p className="text-sm text-[#5E6C84] mt-1">{release.description}</p>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-xs text-[#5E6C84] flex items-center gap-1.5 font-medium">
                                                            <CalendarIcon size={12} /> {new Date(release.release_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${release.is_released ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#FF9F1A]/10 text-[#FF9F1A]'}`}>
                                                    {release.is_released ? 'Released' : 'Unreleased'}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleRelease(release.id, release.is_released)}
                                                    className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${release.is_released ? 'bg-[#EBECF0] text-[#172B4D] hover:bg-[#DFE1E6]' : 'bg-[#0052CC] text-white hover:bg-[#0747A6]'}`}
                                                >
                                                    {release.is_released ? 'Roll back' : 'Release now'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {releases.length === 0 && (
                                        <div className="text-center py-20 bg-white border-2 border-dashed border-[#DFE1E6] rounded-lg">
                                            <Package size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                                            <p className="text-[#5E6C84]">No releases planned yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    viewMode === 'reports' && (
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="max-w-5xl mx-auto space-y-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#172B4D]">Agile Reports</h2>
                                        <p className="text-sm text-[#5E6C84] mt-1">Insights into team performance and project velocity.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <select
                                            value={selectedReportSprint || ''}
                                            onChange={(e) => setSelectedReportSprint(e.target.value)}
                                            className="px-3 py-2 border border-[#DFE1E6] rounded text-sm font-bold bg-white text-[#172B4D] outline-none hover:border-[#0052CC]"
                                        >
                                            <option value="">All Sprints</option>
                                            {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <select
                                            value={reportType}
                                            onChange={(e) => setReportType(e.target.value)}
                                            className="px-3 py-2 border border-[#DFE1E6] rounded text-sm font-bold bg-[#0052CC] text-white outline-none"
                                        >
                                            <option value="BURNDOWN">Burndown Chart</option>
                                            <option value="VELOCITY">Velocity Report</option>
                                            <option value="BURNUP">Burnup Chart</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white border border-[#DFE1E6] p-6 rounded-lg hover:border-[#0052CC] cursor-pointer transition-colors group">
                                        <p className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest mb-1 group-hover:text-[#0052CC]">Total Velocity</p>
                                        <p className="text-3xl font-bold text-[#172B4D]">
                                            {sprints.filter(s => s.status === 'COMPLETED').reduce((acc, s) => acc + (s.completed_points || 0), 0)}
                                        </p>
                                        <p className="text-xs text-[#00875A] font-medium mt-2">↑ 12% from last cycle</p>
                                    </div>
                                    <div className="bg-white border border-[#DFE1E6] p-6 rounded-lg hover:border-[#0052CC] cursor-pointer transition-colors group">
                                        <p className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest mb-1 group-hover:text-[#0052CC]">Avg Story Points</p>
                                        <p className="text-3xl font-bold text-[#172B4D]">
                                            {sprints.length > 0 ? (sprints.reduce((acc, s) => acc + (s.tasks?.reduce((tAcc, t) => tAcc + (t.story_points || 0), 0) || 0), 0) / sprints.length).toFixed(1) : 0}
                                        </p>
                                        <p className="text-xs text-[#5E6C84] mt-2">Per Sprint</p>
                                    </div>
                                    <div
                                        className="bg-white border border-[#DFE1E6] p-6 rounded-lg hover:border-[#0052CC] cursor-pointer transition-all active:scale-[0.98] group"
                                        onClick={() => setShowCapacityModal(true)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest group-hover:text-[#0052CC]">Total Capacity</p>
                                            <Edit2 size={12} className="text-[#EBECF0] group-hover:text-[#0052CC]" />
                                        </div>
                                        <p className="text-3xl font-bold text-[#172B4D]">
                                            {capacities.reduce((acc, c) => acc + (c.capacity_hours || 0), 0) || (project.members_details?.length * 40)}h
                                        </p>
                                        <p className="text-xs text-[#5E6C84] mt-2">Team Weekly (Manage)</p>
                                    </div>
                                    <div className="bg-white border border-[#DFE1E6] p-6 rounded-lg hover:border-[#0052CC] cursor-pointer transition-colors group">
                                        <p className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest mb-1 group-hover:text-[#0052CC]">Team Availability</p>
                                        <p className="text-3xl font-bold text-[#0052CC]">92%</p>
                                        <p className="text-xs text-[#00875A] font-medium mt-2">Stable (Last 30 days)</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white border border-[#DFE1E6] p-6 rounded-lg hover:border-[#0052CC] cursor-pointer transition-colors group">
                                        <p className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest mb-1 group-hover:text-[#0052CC]">Billable Time</p>
                                        <p className="text-3xl font-bold text-[#172B4D]">
                                            {Math.round(timeEntries.filter(e => e.is_billable).reduce((acc, e) => acc + (e.duration_minutes || 0), 0) / 60)}h
                                        </p>
                                        <p className="text-xs text-[#00875A] font-medium mt-2">78% of total tracked</p>
                                    </div>
                                    <div className="bg-white border border-[#DFE1E6] p-6 rounded-lg hover:border-[#0052CC] cursor-pointer transition-colors group">
                                        <p className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest mb-1 group-hover:text-[#0052CC]">SLA Compliance</p>
                                        <p className="text-3xl font-bold text-[#172B4D]">94.2%</p>
                                        <p className="text-xs text-[#00875A] font-medium mt-2">↑ 2.1% from target</p>
                                    </div>
                                    <div className="bg-white border border-[#DFE1E6] p-6 rounded-lg hover:border-[#0052CC] cursor-pointer transition-colors group">
                                        <p className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest mb-1 group-hover:text-[#0052CC]">Task Cycle Time</p>
                                        <p className="text-3xl font-bold text-[#172B4D]">4.2d</p>
                                        <p className="text-xs text-[#5E6C84] mt-2">Avg duration in In Progress</p>
                                    </div>
                                    <div className="bg-white border border-[#DFE1E6] p-6 rounded-lg hover:border-[#0052CC] cursor-pointer transition-colors group">
                                        <p className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest mb-1 group-hover:text-[#0052CC]">Resource Cost</p>
                                        <p className="text-3xl font-bold text-[#DE350B]">$12,450</p>
                                        <p className="text-xs text-[#5E6C84] mt-2">Projected vs $15k Budget</p>
                                    </div>
                                </div>

                                {/* Interactive Charts */}
                                <div className="bg-white border border-[#DFE1E6] rounded-lg p-8 min-h-[500px] flex flex-col items-center shadow-sm">
                                    {reportType === 'BURNDOWN' && (
                                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-[#172B4D] text-lg">Sprint Burndown</h3>
                                                    <p className="text-xs text-[#5E6C84]">{sprints.find(s => s.id == selectedReportSprint)?.name || 'Select a sprint to see data'}</p>
                                                </div>
                                                <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-0.5 bg-[#4C9AFF] rounded-full"></div>
                                                        <span className="text-[#5E6C84]">Ideal Burn</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-0.5 bg-[#DE350B] rounded-full"></div>
                                                        <span className="text-[#5E6C84]">Actual Burn</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-80 w-full relative bg-[#F4F5F7]/30 rounded-lg border border-[#DFE1E6]/50 p-4">
                                                {isLoadingReports ? (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full relative">
                                                        {/* Y-Axis Labels */}
                                                        <div className="absolute -left-10 inset-y-0 flex flex-col justify-between text-[10px] font-bold text-[#5E6C84] py-1">
                                                            <span>{reportData.burndown.ideal?.[0]?.points || 0}</span>
                                                            <span>{Math.round((reportData.burndown.ideal?.[0]?.points || 0) / 2)}</span>
                                                            <span>0</span>
                                                        </div>

                                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                            {/* Grid Lines */}
                                                            {[0, 25, 50, 75, 100].map(y => (
                                                                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#EBECF0" strokeWidth="0.5" strokeDasharray="2,2" />
                                                            ))}

                                                            {/* Ideal Line */}
                                                            {reportData.burndown.ideal?.length > 1 && (
                                                                <line
                                                                    x1="0" y1="0"
                                                                    x2="100" y2="100"
                                                                    stroke="#4C9AFF" strokeWidth="1" strokeDasharray="4,4"
                                                                    className="opacity-60"
                                                                />
                                                            )}

                                                            {/* Actual Line (Dynamic Path) */}
                                                            {reportData.burndown.actual?.length > 0 && (
                                                                <>
                                                                    <path
                                                                        d={`M ${reportData.burndown.actual.map((d, i) => {
                                                                            const daysCount = reportData.burndown.ideal?.length || 1;
                                                                            const x = (i / Math.max(daysCount - 1, 1)) * 100;
                                                                            const totalPoints = reportData.burndown.ideal?.[0]?.points || 1;
                                                                            const y = 100 - (d.points / totalPoints) * 100;
                                                                            return `${x},${y}`;
                                                                        }).join(' L ')}`}
                                                                        fill="none"
                                                                        stroke="#DE350B"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        vectorEffect="non-scaling-stroke"
                                                                        className="drop-shadow-sm"
                                                                    />
                                                                    {/* Data points */}
                                                                    {reportData.burndown.actual.map((d, i) => {
                                                                        const daysCount = reportData.burndown.ideal?.length || 1;
                                                                        const x = (i / Math.max(daysCount - 1, 1)) * 100;
                                                                        const totalPoints = reportData.burndown.ideal?.[0]?.points || 1;
                                                                        const y = 100 - (d.points / totalPoints) * 100;
                                                                        return (
                                                                            <circle
                                                                                key={i}
                                                                                cx={x} cy={y} r="1.5"
                                                                                fill="#DE350B"
                                                                                className="hover:r-2 transition-all cursor-pointer"
                                                                            />
                                                                        );
                                                                    })}
                                                                </>
                                                            )}
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-[#EAE6FF] p-4 rounded-lg border border-[#45328633]">
                                                <div className="flex gap-2">
                                                    <Info size={16} className="text-[#403294] shrink-0 mt-0.5" />
                                                    <p className="text-sm text-[#403294]">
                                                        <strong>Sprint Burndown:</strong> Shows how much work has been completed and how much work remains.
                                                        The red line represents actual work remaining, while the dashed blue line represents the ideal rate of completion.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {reportType === 'VELOCITY' && (
                                        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-[#172B4D] text-lg">Team Velocity</h3>
                                                    <p className="text-xs text-[#5E6C84]">Story points completed per sprint.</p>
                                                </div>
                                                <div className="px-4 py-2 bg-[#F4F5F7] rounded-lg border border-[#DFE1E6]">
                                                    <p className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest">Average Velocity</p>
                                                    <p className="text-xl font-bold text-[#0052CC]">
                                                        {reportData.velocity.length > 0 ? (reportData.velocity.reduce((acc, v) => acc + v.points, 0) / reportData.velocity.length).toFixed(1) : 0} pts
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="h-80 w-full flex items-end gap-6 px-10 pb-12 border-b border-[#DFE1E6] relative">
                                                {/* Y Axis Guide */}
                                                <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[10px] font-bold text-[#DFE1E6] py-12 pointer-events-none">
                                                    <div className="border-t border-[#DFE1E6] w-full" />
                                                    <div className="border-t border-[#DFE1E6] w-full" />
                                                    <div className="border-t border-[#DFE1E6] w-full" />
                                                </div>

                                                {reportData.velocity.map((d, i) => {
                                                    const maxPoints = Math.max(...reportData.velocity.map(v => v.points), 1);
                                                    const height = (d.points / maxPoints) * 100;
                                                    const isLowVelocity = d.points < (reportData.velocity.reduce((acc, v) => acc + v.points, 0) / reportData.velocity.length) * 0.7;

                                                    return (
                                                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
                                                            <div className="relative w-full flex flex-col items-center justify-end h-full">
                                                                <div
                                                                    className={`w-12 rounded-t-lg transition-all duration-700 delay-[${i * 100}ms] hover:brightness-110 shadow-sm ${isLowVelocity ? 'bg-amber-400' : 'bg-gradient-to-t from-[#0747A6] to-[#0052CC]'}`}
                                                                    style={{ height: `${height}%` }}
                                                                />
                                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-[#172B4D] text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-xl z-10 whitespace-nowrap scale-95 group-hover:scale-100">
                                                                    {d.points} Points
                                                                </div>
                                                            </div>
                                                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                                                <span className="text-[10px] font-bold text-[#172B4D] whitespace-nowrap">{d.sprint}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {reportData.velocity.length === 0 && (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#5E6C84] gap-4">
                                                        <BarChart size={48} className="text-[#DFE1E6]" />
                                                        <p className="italic text-sm">Complete some sprints to see velocity data.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {reportType === 'BURNUP' && (
                                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-[#172B4D] text-lg">Sprint Burnup</h3>
                                                    <p className="text-xs text-[#5E6C84]">Scope changes vs completion trend.</p>
                                                </div>
                                                <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-0.5 bg-[#4C9AFF] border border-dashed rounded-full"></div>
                                                        <span className="text-[#5E6C84]">Total Scope</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-0.5 bg-[#00875A] rounded-full"></div>
                                                        <span className="text-[#5E6C84]">Completed</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-80 w-full relative bg-[#F4F5F7]/30 rounded-lg border border-[#DFE1E6]/50 p-4">
                                                {reportData.burnup?.length > 0 ? (
                                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                        {[0, 25, 50, 75, 100].map(y => (
                                                            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#EBECF0" strokeWidth="0.5" strokeDasharray="2,2" />
                                                        ))}

                                                        {/* Scope Line (Dynamic/Flat Goal) */}
                                                        <path
                                                            d={`M ${reportData.burnup.map((d, i) => {
                                                                const x = (i / Math.max(reportData.burnup.length - 1, 1)) * 100;
                                                                const maxScope = Math.max(...reportData.burnup.map(b => b.total_scope), 1);
                                                                const y = 100 - (d.total_scope / maxScope) * 100;
                                                                return `${x},${y}`;
                                                            }).join(' L ')}`}
                                                            fill="none"
                                                            stroke="#4C9AFF"
                                                            strokeWidth="1"
                                                            strokeDasharray="4,4"
                                                            className="opacity-50"
                                                        />

                                                        {/* Completed Line */}
                                                        <path
                                                            d={`M ${reportData.burnup.map((d, i) => {
                                                                const x = (i / Math.max(reportData.burnup.length - 1, 1)) * 100;
                                                                const maxScope = Math.max(...reportData.burnup.map(b => b.total_scope), 1);
                                                                const y = 100 - (d.completed / maxScope) * 100;
                                                                return `${x},${y}`;
                                                            }).join(' L ')}`}
                                                            fill="rgba(0, 135, 90, 0.05)"
                                                            stroke="#00875A"
                                                            strokeWidth="2.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            vectorEffect="non-scaling-stroke"
                                                            className="drop-shadow-sm"
                                                        />
                                                    </svg>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#5E6C84] gap-2">
                                                        <TrendingUp size={48} className="text-[#DFE1E6]" />
                                                        <p className="italic text-sm">Not enough data for burnup trend.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Sprint Retrospectives */}
                                <div className="space-y-4 pt-8 border-t border-[#DFE1E6]">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-[#172B4D]">Sprint Retrospectives</h3>
                                        {sprints.some(s => s.status === 'COMPLETED') && (
                                            <button
                                                onClick={() => {
                                                    const lastSprint = sprints.filter(s => s.status === 'COMPLETED').sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];
                                                    setActiveSprintForRetro(lastSprint);
                                                    setShowRetroModal(true);
                                                }}
                                                className="text-sm font-bold text-[#0052CC] hover:underline flex items-center gap-1"
                                            >
                                                <Plus size={14} /> New Retrospective
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {retrospectives.map(retro => (
                                            <div key={retro.id} className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-sm hover:border-[#0052CC] transition-colors">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-bold text-[#172B4D]">{sprints.find(s => s.id === retro.sprint)?.name || 'Completed Sprint'}</h4>
                                                    <span className="text-[10px] font-bold text-[#00875A] bg-[#E3FCEF] px-2 py-0.5 rounded uppercase">ARCHIVED</span>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-[#5E6C84] uppercase mb-1">Successes</p>
                                                        <p className="text-sm text-[#42526E] italic leading-relaxed">"{retro.what_went_well}"</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-[#DE350B] uppercase mb-1">Action Items</p>
                                                        <p className="text-sm text-[#172B4D] font-medium">• {retro.action_items}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {retrospectives.length === 0 && (
                                            <div className="md:col-span-2 text-center py-12 bg-[#F4F5F7] rounded-lg border-2 border-dashed border-[#DFE1E6]">
                                                <p className="text-[#5E6C84] text-sm">No retrospectives recorded yet. Complete a sprint to start learning.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div >
                    )
                }

                {
                    viewMode === 'collaboration' && (
                        <div className="flex-1 flex overflow-hidden bg-white">
                            {/* Collaboration Sidebar */}
                            <div className="w-64 border-r border-[#DFE1E6] flex flex-col shrink-0 bg-[#FAFBFC]">
                                <div className="p-4 border-b border-[#DFE1E6]">
                                    <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest">Communication</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    <button
                                        onClick={() => setCollaborateMode('chat')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${collaborateMode === 'chat' ? 'bg-[#EAE6FF] text-[#403294]' : 'text-[#42526E] hover:bg-[#EBECF0]'}`}
                                    >
                                        <MessageSquare size={16} /> Team Chat
                                    </button>
                                    <button
                                        onClick={() => setCollaborateMode('announcements')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${collaborateMode === 'announcements' ? 'bg-[#EAE6FF] text-[#403294]' : 'text-[#42526E] hover:bg-[#EBECF0]'}`}
                                    >
                                        <Flag size={16} /> Announcements
                                    </button>
                                    <button
                                        onClick={() => setCollaborateMode('notifications')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${collaborateMode === 'notifications' ? 'bg-[#EAE6FF] text-[#403294]' : 'text-[#42526E] hover:bg-[#EBECF0]'}`}
                                    >
                                        <Activity size={16} /> Notifications
                                        {notifications.filter(n => !n.is_read).length > 0 && (
                                            <span className="ml-auto bg-[#DE350B] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                                {notifications.filter(n => !n.is_read).length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Collaboration Main Area */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {collaborateMode === 'chat' && (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between">
                                            <h2 className="text-lg font-bold text-[#172B4D]">Project Chat</h2>
                                            <div className="flex -space-x-2">
                                                {project.members_details?.slice(0, 5).map((m, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-bold shadow-sm" title={m.username}>
                                                        {m.username[0].toUpperCase()}
                                                    </div>
                                                ))}
                                                {project.members_details?.length > 5 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#EBECF0] text-[#42526E] flex items-center justify-center text-[10px] font-bold">
                                                        +{project.members_details.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" id="chat-stream">
                                            {chatMessages.map((msg, i) => {
                                                const isMe = msg.sender === user?.id;
                                                return (
                                                    <div key={i} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
                                                        <div className="w-8 h-8 rounded-full bg-[#DFE1E6] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border border-white">
                                                            {msg.sender_details?.username?.[0]?.toUpperCase()}
                                                        </div>
                                                        <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : ''}`}>
                                                            <div className={`flex items-baseline gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                                <span className="text-[11px] font-bold text-[#172B4D]">{msg.sender_details?.username}</span>
                                                                <span className="text-[10px] text-[#5E6C84]">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <div className={`p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-[#0052CC] text-white rounded-tr-none' : 'bg-[#F4F5F7] text-[#172B4D] rounded-tl-none'}`}>
                                                                {msg.text}
                                                            </div>
                                                            {/* Reactions */}
                                                            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                {['LIKE', 'CELEBRATE', 'HEART'].map(emojiType => {
                                                                    const count = msg.reactions?.filter(r => r.emoji === emojiType).length || 0;
                                                                    const hasReacted = msg.reactions?.some(r => r.emoji === emojiType && r.user === user?.id);
                                                                    if (count === 0 && !isMe) return null;
                                                                    return (
                                                                        <button
                                                                            key={emojiType}
                                                                            onClick={() => handleToggleReaction('chatmessage', msg.id, emojiType)}
                                                                            className={`px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 transition-all ${hasReacted ? 'bg-[#EAE6FF] border-[#403294] border text-[#403294]' : 'bg-white border-[#DFE1E6] border text-[#5E6C84] hover:bg-[#EBECF0] opacity-0 group-hover:opacity-100'}`}
                                                                        >
                                                                            {emojiType === 'LIKE' ? '👍' : emojiType === 'CELEBRATE' ? '🎉' : '❤️'}
                                                                            {count > 0 && <span className="font-bold">{count}</span>}
                                                                        </button>
                                                                    );
                                                                })}
                                                                <button
                                                                    onClick={() => {/* More reactions? */ }}
                                                                    className="w-5 h-5 rounded-full border border-[#DFE1E6] bg-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#EBECF0]"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {chatMessages.length === 0 && (
                                                <div className="flex-1 flex flex-col items-center justify-center text-[#5E6C84] opacity-50 space-y-4">
                                                    <MessageSquare size={48} />
                                                    <p>No messages yet. Start the conversation!</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 border-t border-[#DFE1E6] bg-[#FAFBFC]">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Type a message..."
                                                    className="flex-1 px-4 py-2 border-2 border-[#DFE1E6] rounded-full text-sm outline-none focus:border-[#0052CC] transition-all"
                                                    value={newChatText}
                                                    onChange={e => setNewChatText(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                                                />
                                                <button
                                                    onClick={handleSendChat}
                                                    disabled={!newChatText.trim()}
                                                    className="w-10 h-10 rounded-full bg-[#0052CC] text-white flex items-center justify-center hover:bg-[#0747A6] transition-colors disabled:opacity-50 shadow-md"
                                                >
                                                    <ChevronUp className="rotate-90" size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {collaborateMode === 'announcements' && (
                                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-2xl font-bold text-[#172B4D]">Announcements</h2>
                                            <button
                                                onClick={() => setShowAnnounceModal(true)}
                                                className="px-4 py-2 bg-[#0052CC] text-white rounded text-sm font-bold flex items-center gap-2 hover:bg-[#0747A6] transition-colors shadow-md"
                                            >
                                                <Plus size={16} /> New Announcement
                                            </button>
                                        </div>
                                        <div className="grid gap-6">
                                            {announcements.map(ann => (
                                                <div key={ann.id} className={`bg-white border rounded-lg p-6 shadow-sm relative overflow-hidden group ${ann.is_pinned ? 'border-[#0052CC] bg-blue-50/30' : 'border-[#DFE1E6]'}`}>
                                                    {ann.is_pinned && <div className="absolute top-0 left-0 w-1 h-full bg-[#0052CC]" />}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-[#0052CC] text-white flex items-center justify-center font-bold">
                                                                {ann.author_details?.username?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-[#172B4D] flex items-center gap-2">
                                                                    {ann.title}
                                                                    {ann.is_pinned && <Flag size={12} className="text-[#0052CC] fill-[#0052CC]" />}
                                                                </h4>
                                                                <p className="text-xs text-[#5E6C84]">By {ann.author_details?.username} • {new Date(ann.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="p-1.5 hover:bg-[#EBECF0] rounded text-[#5E6C84]"><Edit2 size={14} /></button>
                                                            <button className="p-1.5 hover:bg-[#FFEBE6] rounded text-[#DE350B]"><Trash2 size={14} /></button>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-[#42526E] leading-relaxed whitespace-pre-wrap">
                                                        {ann.content}
                                                    </div>
                                                </div>
                                            ))}
                                            {announcements.length === 0 && (
                                                <div className="text-center py-20 bg-[#F4F5F7] rounded-lg border-2 border-dashed border-[#DFE1E6]">
                                                    <Flag size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                                                    <p className="text-[#5E6C84]">No announcements yet. Keep your team informed!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {collaborateMode === 'notifications' && (
                                    <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-2xl font-bold text-[#172B4D]">Notifications</h2>
                                            <button
                                                onClick={async () => {
                                                    await api.post('/collaboration/notifications/mark_all_as_read/');
                                                    fetchProjectDetails();
                                                }}
                                                className="text-sm font-bold text-[#0052CC] hover:underline"
                                            >
                                                Mark all as read
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    onClick={async () => {
                                                        if (!n.is_read) {
                                                            await api.post(`/collaboration/notifications/${n.id}/mark_as_read/`);
                                                            fetchProjectDetails();
                                                        }
                                                        // Navigate to target?
                                                        if (n.content_type === 'task') navigate(`/projects/${id}?task=${n.object_id}`);
                                                    }}
                                                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md flex items-start gap-4 ${n.is_read ? 'bg-white border-[#DFE1E6] opacity-75' : 'bg-blue-50 border-[#0052CC] shadow-sm'}`}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-white border border-[#DFE1E6] flex items-center justify-center shrink-0">
                                                        <Activity size={20} className={n.is_read ? "text-[#5E6C84]" : "text-[#0052CC]"} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-1">
                                                            <p className="text-sm text-[#172B4D]">
                                                                <span className="font-bold">{n.actor_details?.username}</span> {n.verb}
                                                            </p>
                                                            <span className="text-[10px] font-bold text-[#5E6C84] uppercase whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-xs text-[#5E6C84] leading-relaxed">{n.description}</p>
                                                    </div>
                                                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#DE350B] mt-2" />}
                                                </div>
                                            ))}
                                            {notifications.length === 0 && (
                                                <div className="text-center py-20">
                                                    <Activity size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                                                    <p className="text-[#5E6C84]">All caught up! No new notifications.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {
                    viewMode === 'timesheets' && (
                        <div className="flex-1 p-8 overflow-y-auto bg-[#F4F5F7]">
                            <div className="max-w-6xl mx-auto space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#172B4D]">Timesheets</h2>
                                        <p className="text-sm text-[#5E6C84]">Track and manage time spent on project tasks.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-4 px-4 py-2 bg-white border border-[#DFE1E6] rounded shadow-sm">
                                            <div>
                                                <p className="text-[10px] font-bold text-[#5E6C84] uppercase">Today</p>
                                                <p className="text-lg font-bold text-[#172B4D]">{timeStats.today_formatted || '0h 0m'}</p>
                                            </div>
                                            <div className="w-px h-8 bg-[#DFE1E6]" />
                                            <div>
                                                <p className="text-[10px] font-bold text-[#5E6C84] uppercase">This Week</p>
                                                <p className="text-lg font-bold text-[#172B4D]">{timeStats.week_formatted || '0h 0m'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowTimeModal(true)}
                                            className="px-4 py-2 bg-[#0052CC] text-white rounded font-bold text-sm flex items-center gap-2"
                                        >
                                            <Plus size={16} /> Log Time
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white border border-[#DFE1E6] rounded-lg overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                                                <th className="px-6 py-4 text-[11px] font-bold text-[#5E6C84] uppercase">Date</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-[#5E6C84] uppercase">User</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-[#5E6C84] uppercase">Task</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-[#5E6C84] uppercase">Description</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-[#5E6C84] uppercase text-right">Duration</th>
                                                <th className="px-6 py-4 text-[11px] font-bold text-[#5E6C84] uppercase text-center">Billable</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#DFE1E6]">
                                            {timeEntries.map(entry => (
                                                <tr key={entry.id} className="hover:bg-[#FAFBFC]">
                                                    <td className="px-6 py-4 text-sm text-[#172B4D] font-medium">
                                                        {new Date(entry.start_time || entry.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-bold">
                                                                {entry.user_details?.username[0].toUpperCase()}
                                                            </div>
                                                            <span className="text-sm text-[#172B4D]">{entry.user_details?.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-[#0052CC] hover:underline cursor-pointer" onClick={() => navigate(`/projects/${id}?task=${entry.task}`)}>
                                                            {entry.task_details?.title || 'General'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[#5E6C84] truncate max-w-xs">
                                                        {entry.description || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[#172B4D] font-bold text-right">
                                                        {entry.duration_minutes}m
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`w-2 h-2 rounded-full mx-auto ${entry.is_billable ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                    </td>
                                                </tr>
                                            ))}
                                            {timeEntries.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-20 text-center text-[#5E6C84]">
                                                        <Clock size={48} className="mx-auto mb-4 opacity-20" />
                                                        <p>No time entries recorded for this project.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    viewMode === 'workload' && (
                        <div className="flex-1 p-8 overflow-y-auto bg-[#F4F5F7]">
                            <div className="max-w-6xl mx-auto space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#172B4D]">Workload & Resources</h2>
                                        <p className="text-sm text-[#5E6C84]">Team capacity and task allocation across the project.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCapacityModal(true)}
                                        className="px-4 py-2 bg-white border border-[#DFE1E6] rounded text-sm font-bold text-[#172B4D] hover:bg-[#FAFBFC]"
                                    >
                                        Manage Capacity
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {project.members_details?.map(member => {
                                        const memberTasks = tasks.filter(t => t.assigned_to === member.id);
                                        const openTasks = memberTasks.filter(t => t.status !== 'DONE');
                                        const totalPoints = memberTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);
                                        const openPoints = openTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);

                                        const memberTime = timeEntries.filter(e => e.user === member.id).reduce((acc, e) => acc + (e.duration_minutes || 0), 0);
                                        const capacityMins = (capacities.find(c => c.user === member.id)?.capacity_hours || 40) * 60;
                                        const utilization = capacityMins > 0 ? (memberTime / capacityMins) * 100 : 0;

                                        return (
                                            <div key={member.id} className="bg-white border border-[#DFE1E6] rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-lg font-bold">
                                                        {member.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-[#172B4D]">{member.username}</h3>
                                                        <p className="text-xs text-[#5E6C84] uppercase font-bold tracking-wider">{member.role_details?.name || 'Developer'}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-[#5E6C84] uppercase">Capacity Utilization</p>
                                                            <p className="text-lg font-bold text-[#172B4D]">{utilization.toFixed(0)}%</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">{memberTime}m / {capacityMins / 60}h</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-[#EBECF0] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-700 ${utilization > 100 ? 'bg-red-500' : utilization > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                                                            style={{ width: `${Math.min(utilization, 100)}%` }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#DFE1E6]">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-[#5E6C84] uppercase mb-1">Open Points</p>
                                                            <p className="text-xl font-bold text-[#172B4D]">{openPoints} / {totalPoints}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-[#5E6C84] uppercase mb-1">Tasks</p>
                                                            <p className="text-xl font-bold text-[#172B4D]">{openTasks.length} / {memberTasks.length}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    viewMode === 'overview' && (
                        <div className="flex-1 overflow-y-auto p-8 bg-white">
                            <div className="max-w-6xl">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        <section>
                                            <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest mb-4">Project Vitality</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-white border border-[#DFE1E6] p-4 rounded-sm shadow-sm transition-all hover:shadow-md">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[11px] font-bold text-[#5E6C84] uppercase">Health</span>
                                                        <Activity size={14} className={project.task_stats?.overdue > 5 ? "text-red-500" : "text-green-500"} />
                                                    </div>
                                                    <p className={`text-lg font-bold ${project.task_stats?.overdue > 5 ? "text-[#DE350B]" : "text-[#00875A]"}`}>
                                                        {project.task_stats?.overdue > 10 ? "At Risk" : project.task_stats?.overdue > 0 ? "Watch" : "On Track"}
                                                    </p>
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

                                        {/* Activity Log */}
                                        <section className="bg-white border border-[#DFE1E6] p-6 rounded-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-widest flex items-center gap-2">
                                                    <History size={14} className="text-[#0052CC]" /> Recent Activity
                                                </h3>
                                                <button className="text-[#0052CC] hover:underline text-xs font-bold">View full stream</button>
                                            </div>
                                            <div className="space-y-6">
                                                {auditLogs.slice(0, 10).map((log, idx) => (
                                                    <div key={log.id} className="flex gap-4 relative">
                                                        {idx !== auditLogs.slice(0, 10).length - 1 && (
                                                            <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-[#EBECF0]" />
                                                        )}
                                                        <div className="w-6 h-6 rounded-full bg-[#EBECF0] border-2 border-white flex items-center justify-center shrink-0 z-10">
                                                            <User size={12} className="text-[#42526E]" />
                                                        </div>
                                                        <div className="flex-1 pb-1">
                                                            <div className="flex items-baseline justify-between gap-2">
                                                                <p className="text-sm text-[#172B4D]">
                                                                    <span className="font-bold hover:text-[#0052CC] cursor-pointer">
                                                                        {log.user_details?.username || 'System'}
                                                                    </span>
                                                                    <span className="text-[#42526E] mx-1">
                                                                        {log.action === 'UPDATE_TASK' ? 'updated task' :
                                                                            log.action === 'CREATE_TASK' ? 'created task' :
                                                                                log.action.toLowerCase().replace('_', ' ')}
                                                                    </span>
                                                                    {log.details?.title && (
                                                                        <span className="font-medium text-[#0052CC] hover:underline cursor-pointer">
                                                                            "{log.details.title}"
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <span className="text-[10px] font-bold text-[#5E6C84] whitespace-nowrap uppercase">
                                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-[#5E6C84] mt-1 flex items-center gap-1 uppercase tracking-wider font-bold">
                                                                {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {auditLogs.length === 0 && (
                                                    <div className="text-center py-10 opacity-60">
                                                        <History size={32} className="mx-auto text-[#DFE1E6] mb-2" />
                                                        <p className="text-xs text-[#5E6C84]">No activity history yet.</p>
                                                    </div>
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
                    )
                }
            </main >

            {/* Floating Bulk Action Bar */}
            {
                selectedTaskIds.length > 0 && (
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
                )
            }

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
                                                    {member.username?.[0]?.toUpperCase()}
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
                showMembersModal && (
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
                                {allUsers.map((member) => {
                                    const isProjectMember = project.members?.includes(member.id);
                                    const isAssigned = selectedTask?.assigned_to === member.id;

                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => handleAssignMember(member.id)}
                                            className="w-full flex items-center gap-3 p-2 rounded hover:bg-[#F4F5F7] transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#DFE1E6] flex items-center justify-center text-xs font-semibold">
                                                {member.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-sm text-[#172B4D]">{member.username}</p>
                                                {isProjectMember && !selectedTask && <p className="text-[10px] text-[#00875A] font-bold uppercase">Member</p>}
                                            </div>
                                            {(isAssigned || (isProjectMember && !selectedTask)) && (
                                                <span className="ml-auto text-[#0079BF]">✓</span>
                                            )}
                                        </button>
                                    );
                                })}
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
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] mb-1 uppercase tracking-wider">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                                        value={tempStartDate || (selectedTask.start_date ? selectedTask.start_date.split('T')[0] : '')}
                                        onChange={(e) => setTempStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] mb-1 uppercase tracking-wider">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF]"
                                        value={tempDueDate || (selectedTask.due_date ? selectedTask.due_date.split('T')[0] : '')}
                                        onChange={(e) => setTempDueDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUpdateDates}
                                        className="flex-1 px-4 py-2 bg-[#0079BF] text-white rounded hover:bg-[#026AA7] transition-colors text-sm font-bold"
                                    >
                                        Save Dates
                                    </button>
                                    {(selectedTask.due_date || selectedTask.start_date) && (
                                        <button
                                            onClick={() => {
                                                handleUpdateTask(selectedTask.id, { due_date: null, start_date: null });
                                                setShowDatesModal(false);
                                                setTempDueDate('');
                                                setTempStartDate('');
                                            }}
                                            className="px-4 py-2 bg-[#EBECF0] text-[#172B4D] rounded hover:bg-[#FFEBE6] hover:text-[#BF2600] transition-colors text-sm font-bold"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
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
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Link to Milestone</label>
                                    <select
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0079BF] appearance-none bg-white"
                                        value={newDeliverable.milestone || ''}
                                        onChange={e => setNewDeliverable({ ...newDeliverable, milestone: e.target.value })}
                                    >
                                        <option value="">No Milestone</option>
                                        {project.milestones?.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
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
            {/* Sprint Modal */}
            {
                showSprintModal && (
                    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="font-bold text-[#172B4D]">Create Sprint</h3>
                                <button onClick={() => setShowSprintModal(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Sprint Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                        value={newSprint.name}
                                        onChange={e => setNewSprint({ ...newSprint, name: e.target.value })}
                                        placeholder="e.g. Sprint 1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                            value={newSprint.start_date}
                                            onChange={e => setNewSprint({ ...newSprint, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">End Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                            value={newSprint.end_date}
                                            onChange={e => setNewSprint({ ...newSprint, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Sprint Goal</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] min-h-[80px]"
                                        value={newSprint.goal}
                                        onChange={e => setNewSprint({ ...newSprint, goal: e.target.value })}
                                        placeholder="What are we aiming for?"
                                    />
                                </div>
                                <button onClick={handleCreateSprint} className="w-full py-2 bg-[#0052CC] text-white font-bold rounded hover:bg-[#0747A6] transition-colors">
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Create Task Modal */}
            {
                isTaskModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="font-bold text-[#172B4D]">Create Issue</h3>
                                <button onClick={() => setIsTaskModalOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreateTask} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Issue Type</label>
                                    <div className="flex gap-2">
                                        {['TASK', 'STORY', 'BUG', 'EPIC'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setNewTask({ ...newTask, issue_type: type })}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-sm transition-all ${newTask.issue_type === type ? 'border-[#0052CC] bg-[#DEEBFF] text-[#0052CC]' : 'border-[#DFE1E6] bg-white text-[#42526E] hover:bg-[#F4F5F7]'}`}
                                            >
                                                {getIssueTypeIcon(type)}
                                                <span className="text-[11px] font-bold">{type}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Summary <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded text-sm outline-none focus:border-[#4C9AFF]"
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="What needs to be done?"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Priority</label>
                                        <select
                                            className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#4C9AFF] bg-white"
                                            value={newTask.priority}
                                            onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Story Points</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#4C9AFF]"
                                            value={newTask.story_points}
                                            onChange={e => setNewTask({ ...newTask, story_points: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Parent Task (Optional)</label>
                                    <select
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#4C9AFF] bg-white"
                                        value={newTask.parent_task || ''}
                                        onChange={e => setNewTask({ ...newTask, parent_task: e.target.value || null })}
                                    >
                                        <option value="">None</option>
                                        {tasks.filter(t => t.issue_type === 'EPIC' || !t.parent_task).map(t => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-[#5E6C84] mt-1">Select an Epic or Parent task to link this issue.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#4C9AFF] min-h-[120px] resize-none"
                                        value={newTask.description || ''}
                                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="Add more details about this issue..."
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-2 border-t border-[#DFE1E6]">
                                    <button
                                        type="button"
                                        onClick={() => setIsTaskModalOpen(false)}
                                        className="px-4 py-2 text-sm font-bold text-[#42526E] hover:bg-[#EBECF0] rounded transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#0052CC] text-white rounded text-sm font-bold hover:bg-[#0747A6] transition-colors"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Release Modal */}
            {
                showReleaseModal && (
                    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="font-bold text-[#172B4D]">New Release</h3>
                                <button onClick={() => setShowReleaseModal(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreateRelease} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Release Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                        value={newRelease.name}
                                        onChange={e => setNewRelease({ ...newRelease, name: e.target.value })}
                                        placeholder="e.g. Q4 Platform Update"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Version Tag</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                            value={newRelease.version}
                                            onChange={e => setNewRelease({ ...newRelease, version: e.target.value })}
                                            placeholder="e.g. v2.1.0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Release Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                            value={newRelease.release_date}
                                            onChange={e => setNewRelease({ ...newRelease, release_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] min-h-[100px] resize-none"
                                        value={newRelease.description}
                                        onChange={e => setNewRelease({ ...newRelease, description: e.target.value })}
                                        placeholder="What's included in this release?"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full py-2 bg-[#0052CC] text-white font-bold rounded hover:bg-[#0747A6] transition-colors">
                                        Create Release
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Sprint Retrospective Modal */}
            {
                showRetroModal && (
                    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <h3 className="font-bold text-[#172B4D]">Sprint Retrospective: {activeSprintForRetro?.name}</h3>
                                <button onClick={() => setShowRetroModal(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreateRetro} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">What went well?</label>
                                    <textarea
                                        required
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] min-h-[80px] resize-none"
                                        value={newRetro.what_went_well}
                                        onChange={e => setNewRetro({ ...newRetro, what_went_well: e.target.value })}
                                        placeholder="Successes and wins..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">What could be improved?</label>
                                    <textarea
                                        required
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] min-h-[80px] resize-none"
                                        value={newRetro.what_could_be_improved}
                                        onChange={e => setNewRetro({ ...newRetro, what_could_be_improved: e.target.value })}
                                        placeholder="Challenges and blockers..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Action Items</label>
                                    <textarea
                                        required
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] min-h-[80px] resize-none"
                                        value={newRetro.action_items}
                                        onChange={e => setNewRetro({ ...newRetro, action_items: e.target.value })}
                                        placeholder="Tasks for next sprint..."
                                    />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full py-2 bg-[#00875A] text-white font-bold rounded hover:bg-[#006644] transition-colors">
                                        Save Retrospective
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Announcement Modal */}
            {
                showAnnounceModal && (
                    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <div className="flex items-center gap-2">
                                    <Flag size={18} className="text-[#0052CC]" />
                                    <h3 className="font-bold text-[#172B4D]">New Project Announcement</h3>
                                </div>
                                <button onClick={() => setShowAnnounceModal(false)} className="p-1 hover:bg-[#EBECF0] rounded transition-colors"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider mb-2">Subject</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2.5 border-2 border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] transition-all"
                                        value={newAnnounce.title}
                                        onChange={e => setNewAnnounce({ ...newAnnounce, title: e.target.value })}
                                        placeholder="Summarize your announcement..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider mb-2">Message</label>
                                    <textarea
                                        required
                                        className="w-full px-4 py-2.5 border-2 border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] min-h-[150px] resize-none transition-all"
                                        value={newAnnounce.content}
                                        onChange={e => setNewAnnounce({ ...newAnnounce, content: e.target.value })}
                                        placeholder="Enter the full message for your team..."
                                    />
                                </div>
                                <div className="flex items-center gap-2 py-1">
                                    <input
                                        type="checkbox"
                                        id="announce-pin"
                                        className="w-4 h-4 rounded text-[#0052CC] focus:ring-[#0052CC]"
                                        checked={newAnnounce.is_pinned}
                                        onChange={e => setNewAnnounce({ ...newAnnounce, is_pinned: e.target.checked })}
                                    />
                                    <label htmlFor="announce-pin" className="text-sm font-medium text-[#42526E] cursor-pointer">Pin to top of list</label>
                                </div>
                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAnnounceModal(false)}
                                        className="flex-1 py-1.5 px-4 bg-[#EBECF0] text-[#42526E] font-bold rounded hover:bg-[#DFE1E6] transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-2.5 px-4 bg-[#0052CC] text-white font-bold rounded hover:bg-[#0747A6] transition-all shadow-md active:scale-95"
                                    >
                                        Post Announcement
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Background Customization Modal */}
            {
                showBackgroundModal && (
                    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4 backdrop-blur-[2px] animate-in fade-in duration-200">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between">
                                <h3 className="font-bold text-[#172B4D]">Board Background</h3>
                                <button onClick={() => setShowBackgroundModal(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                            </div>
                            <div className="p-6">
                                <p className="text-xs text-[#5E6C84] mb-4 font-medium">Choose a color for your board header and atmosphere.</p>
                                <div className="grid grid-cols-4 gap-3">
                                    {[
                                        '#F4F5F7', '#0052CC', '#00875A', '#E54937',
                                        '#FF9F1A', '#00A3BF', '#89609E', '#253858',
                                        '#0747A6', '#006644', '#BF2600', '#FFAB00',
                                        '#FFFFFF', '#344563', '#DEEBFF', '#E3FCEF'
                                    ].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => handleUpdateBackground(color)}
                                            className={`w-full aspect-square rounded-sm border-2 transition-all hover:scale-110 active:scale-95 ${project.background_color === color ? 'border-[#0052CC] ring-2 ring-[#0052CC]/20' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-[#DFE1E6]">
                                    <button
                                        onClick={() => handleUpdateBackground('#FAFBFC')}
                                        className="w-full py-2 text-sm font-bold text-[#42526E] hover:bg-[#EBECF0] rounded transition-colors"
                                    >
                                        Reset to default
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Time Tracking Modal */}
            {
                showTimeModal && (
                    <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-[#0052CC]" />
                                    <h3 className="font-bold text-[#172B4D]">Log Work</h3>
                                </div>
                                <button onClick={() => setShowTimeModal(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); handleLogTime(); }} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Issue / Task</label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                        value={newTimeEntry.task}
                                        onChange={e => setNewTimeEntry({ ...newTimeEntry, task: e.target.value })}
                                    >
                                        <option value="">Select a task</option>
                                        {tasks.map(t => <option key={t.id} value={t.id}>[{project.key}-{t.id}] {t.title}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Duration (minutes)</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                            value={newTimeEntry.duration_minutes}
                                            onChange={e => setNewTimeEntry({ ...newTimeEntry, duration_minutes: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Start Time</label>
                                        <input
                                            required
                                            type="datetime-local"
                                            className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                            value={newTimeEntry.start_time}
                                            onChange={e => setNewTimeEntry({ ...newTimeEntry, start_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <textarea
                                        className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] min-h-[80px] resize-none"
                                        value={newTimeEntry.description}
                                        onChange={e => setNewTimeEntry({ ...newTimeEntry, description: e.target.value })}
                                        placeholder="What did you work on?"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is-billable"
                                        checked={newTimeEntry.is_billable}
                                        onChange={e => setNewTimeEntry({ ...newTimeEntry, is_billable: e.target.checked })}
                                    />
                                    <label htmlFor="is-billable" className="text-xs font-bold text-[#42526E] uppercase">Billable Time</label>
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="w-full py-2.5 bg-[#0052CC] text-white font-bold rounded hover:bg-[#0747A6] transition-all shadow-md">
                                        Log Time
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Capacity Planning Modal */}
            {
                showCapacityModal && (
                    <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                                <div className="flex items-center gap-2">
                                    <PieChart size={18} className="text-[#0052CC]" />
                                    <h3 className="font-bold text-[#172B4D]">Resource Capacity</h3>
                                </div>
                                <button onClick={() => setShowCapacityModal(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-xs text-[#5E6C84] mb-4">Set the weekly working hours for team members to calculate utilization correctly.</p>
                                <div className="space-y-3">
                                    {project.members_details?.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-3 bg-[#FAFBFC] border border-[#DFE1E6] rounded">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold">
                                                    {member.username?.[0]?.toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold text-[#172B4D]">{member.username}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    className="w-16 px-2 py-1 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC]"
                                                    value={memberCapacities[member.id] || 40}
                                                    onChange={(e) => setMemberCapacities({ ...memberCapacities, [member.id]: parseInt(e.target.value) })}
                                                />
                                                <span className="text-xs font-bold text-[#5E6C84]">H/WK</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={() => setShowCapacityModal(false)}
                                        className="flex-1 py-2 bg-[#EBECF0] text-[#42526E] font-bold rounded hover:bg-[#DFE1E6]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await Promise.all(Object.entries(memberCapacities).map(([userId, hours]) =>
                                                    api.post('/projects/capacities/set_capacity/', { user: userId, capacity_hours: hours })
                                                ));
                                                setShowCapacityModal(false);
                                                fetchProjectDetails();
                                                showToast('Capacities updated', 'success');
                                            } catch (error) { showToast('Update failed', 'error'); }
                                        }}
                                        className="flex-1 py-2 bg-[#0052CC] text-white font-bold rounded hover:bg-[#0747A6]"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProjectDetails;
