import { useState, useEffect } from 'react';
import {
    Star, Clock, CheckCircle2, ListTodo, Activity, ArrowRight,
    Briefcase, MessageSquare, ChevronRight, TrendingUp, Users, Plus,
    SlidersHorizontal, X, RotateCcw, Check, Sparkles, Layout
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import TimerWidget from '../components/TimerWidget';
import RemindersCard from '../components/RemindersCard';

const defaultWidgets = {
    stats: true,
    projects: true,
    tasks: true,
    activity: true,
    timetracking: true,
    reminders: true,
    quickactions: true,
    premium: true
};

const Dashboard = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ tickets: 0, projects: 0, tasks: 0 });
    const [recentProjects, setRecentProjects] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    // US-018: Personalized Dashboard widget customization
    const [widgetConfig, setWidgetConfig] = useState(() => {
        const saved = localStorage.getItem('omni_dashboard_widgets');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { }
        }
        return defaultWidgets;
    });
    const [showCustomizeModal, setShowCustomizeModal] = useState(false);

    const toggleWidget = (key) => {
        setWidgetConfig(prev => {
            const next = { ...prev, [key]: !prev[key] };
            localStorage.setItem('omni_dashboard_widgets', JSON.stringify(next));
            return next;
        });
    };

    const resetWidgets = () => {
        setWidgetConfig(defaultWidgets);
        localStorage.setItem('omni_dashboard_widgets', JSON.stringify(defaultWidgets));
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [tRes, pRes, tkRes, actRes] = await Promise.allSettled([
                    api.get('/tickets/tickets/'),
                    api.get('/projects/projects/'),
                    api.get('/projects/tasks/'),
                    api.get('/activity/audit-logs/')
                ]);
                const ticketsData = tRes.status === 'fulfilled' ? (tRes.value.data.results || tRes.value.data || []) : [];
                const projectsData = pRes.status === 'fulfilled' ? (pRes.value.data.results || pRes.value.data || []) : [];
                const tasksData = tkRes.status === 'fulfilled' ? (tkRes.value.data.results || tkRes.value.data || []) : [];
                const actData = actRes.status === 'fulfilled' ? (actRes.value.data.results || actRes.value.data || []) : [];

                setStats({
                    tickets: ticketsData.length,
                    projects: projectsData.length,
                    tasks: tasksData.filter(t => t.status !== 'DONE').length
                });
                setRecentProjects(projectsData.slice(0, 6));
                setUpcomingTasks(tasksData.filter(t => t.status !== 'DONE').slice(0, 5));
                setRecentActivity(actData.slice(0, 6));
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const StatCard = ({ label, value, icon: Icon, color, link }) => (
        <Link to={link} className="bg-white border border-[#DFE1E6] rounded-sm p-4 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-sm ${color}`}>
                    <Icon size={20} className="text-white" />
                </div>
                <ArrowRight size={16} className="text-[#5E6C84] group-hover:text-[#172B4D] transition-colors" />
            </div>
            <div className="space-y-1">
                <h3 className="text-2xl font-semibold text-[#172B4D]">{value}</h3>
                <p className="text-xs font-medium text-[#5E6C84] uppercase">{label}</p>
            </div>
        </Link>
    );

    return (
        <div className="min-h-screen bg-[#FAFBFC] p-4 md:p-6 pb-24 md:pb-6">
            {/* Header */}
            <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-[#172B4D] mb-1">
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.username}
                    </h1>
                    <p className="text-sm text-[#5E6C84]">Here's what's happening in your workspace</p>
                </div>
                <button
                    onClick={() => setShowCustomizeModal(true)}
                    className="self-start md:self-auto px-3.5 py-1.5 bg-white border border-[#DFE1E6] hover:bg-slate-50 text-[#172B4D] rounded text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                    <SlidersHorizontal size={14} className="text-[#0052CC]" />
                    <span>Customize Dashboard</span>
                </button>
            </header>

            {/* Stats Grid Widget */}
            {widgetConfig.stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {loading ? (
                        [1, 2, 3, 4].map(idx => (
                            <div key={idx} className="bg-white border border-[#DFE1E6] rounded-sm p-4 animate-pulse">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="w-8 h-8 bg-slate-200 rounded"></div>
                                    <div className="w-4 h-4 bg-slate-200 rounded"></div>
                                </div>
                                <div className="w-12 h-6 bg-slate-200 rounded mb-1"></div>
                                <div className="w-24 h-3 bg-slate-200 rounded"></div>
                            </div>
                        ))
                    ) : (
                        <>
                            <StatCard label="Active Projects" value={stats.projects} icon={Briefcase} color="bg-[var(--trello-primary)]" link="/projects" />
                            <StatCard label="Pending Tasks" value={stats.tasks} icon={ListTodo} color="bg-[#FF9F1A]" link="/projects" />
                            <StatCard label="Open Tickets" value={stats.tickets} icon={MessageSquare} color="bg-[#61BD4F]" link="/tickets" />
                            <StatCard label="In Progress" value={upcomingTasks.length} icon={TrendingUp} color="bg-[#C377E0]" link="/projects" />
                        </>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Boards Widget */}
                    {widgetConfig.projects && (
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-[#172B4D] flex items-center gap-2">
                                    <Star size={16} className="text-[#F2D600]" fill="#F2D600" />
                                    Recent Boards
                                </h2>
                                <Link to="/projects" className="text-sm text-[var(--trello-primary)] hover:underline">
                                    View all →
                                </Link>
                            </div>
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="rounded-sm p-4 min-h-[100px] bg-slate-200 animate-pulse"></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {recentProjects.map((project) => (
                                        <Link
                                            key={project.id}
                                            to={`/projects/${project.id}`}
                                            className="group trello-gradient rounded-sm p-4 hover:shadow-lg transition-all min-h-[100px] flex flex-col justify-between"
                                        >
                                            <h3 className="text-white font-semibold text-base mb-2">{project.name}</h3>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-white/80">{project.key}</span>
                                                <div className="flex -space-x-1">
                                                    {project.members_details?.slice(0, 3).map((m, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-6 h-6 rounded-full bg-white text-[var(--trello-primary)] border-[var(--trello-primary)] flex items-center justify-center text-[10px] font-semibold"
                                                            title={m.username}
                                                        >
                                                            {m.username?.[0]?.toUpperCase()}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                    <Link
                                        to="/projects"
                                        className="border-2 border-dashed border-[#DFE1E6] rounded-sm p-4 hover:bg-[#F4F5F7] transition-colors min-h-[100px] flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <Plus size={24} className="text-[#5E6C84] group-hover:text-[#172B4D]" />
                                        <span className="text-sm font-medium text-[#5E6C84] group-hover:text-[#172B4D]">
                                            Create new board
                                        </span>
                                    </Link>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Upcoming Tasks Widget */}
                    {widgetConfig.tasks && (
                        <section className="bg-white border border-[#DFE1E6] rounded-sm">
                            <div className="px-4 py-3 border-b border-[#DFE1E6]">
                                <h2 className="text-sm font-semibold text-[#172B4D] uppercase">Your Tasks</h2>
                            </div>
                            <div className="divide-y divide-[#DFE1E6]">
                                {upcomingTasks.map((task, i) => (
                                    <div key={i} className="px-4 py-3 hover:bg-[#F4F5F7] cursor-pointer transition-colors group">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-[#172B4D] group-hover:text-[var(--trello-primary)] transition-colors mb-1">
                                                    {task.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-[#5E6C84]">
                                                    <span className="font-medium">TASK-{task.id}</span>
                                                    {task.due_date && (
                                                        <>
                                                            <span>•</span>
                                                            <Clock size={12} />
                                                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`trello-badge ${task.status === 'IN_PROGRESS' ? 'bg-[var(--trello-primary)] text-white' : 'bg-[#EBECF0] text-[#172B4D]'
                                                    }`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                                {task.assigned_to_details && (
                                                    <div
                                                        className="w-6 h-6 rounded-full bg-[#DFE1E6] flex items-center justify-center text-[10px] font-semibold"
                                                        title={task.assigned_to_details.username}
                                                    >
                                                        {task.assigned_to_details.username?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {upcomingTasks.length === 0 && (
                                    <div className="px-4 py-8 text-center text-[#5E6C84] text-sm">
                                        No pending tasks. You're all caught up! 🎉
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Recent Activity Widget */}
                    {widgetConfig.activity && (
                        <section className="bg-white border border-[#DFE1E6] rounded-sm">
                            <div className="px-4 py-3 border-b border-[#DFE1E6]">
                                <h2 className="text-sm font-semibold text-[#172B4D] uppercase">Recent Activity</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                {recentActivity.map((log, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#DFE1E6] flex items-center justify-center text-xs font-semibold text-[#172B4D] shrink-0">
                                            {log.user_details?.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-[#172B4D]">
                                                <span className="font-semibold">{log.user_details?.username}</span>
                                                <span className="text-[#5E6C84]"> {log.action.toLowerCase()}</span>
                                            </p>
                                            <span className="text-xs text-[#5E6C84]">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {recentActivity.length === 0 && !loading && (
                                    <div className="py-6 text-center text-[#5E6C84] text-xs">
                                        No recent activity recorded yet.
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    {/* Time Tracking Widget */}
                    {widgetConfig.timetracking && (
                        <section className="bg-white border border-[#DFE1E6] rounded-sm p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={16} className="text-[#5E6C84]" />
                                <h3 className="text-xs font-semibold text-[#5E6C84] uppercase">Time Tracking</h3>
                            </div>
                            <TimerWidget />
                        </section>
                    )}

                    {/* Reminders Widget */}
                    {widgetConfig.reminders && (
                        <div className="mb-4">
                            <RemindersCard />
                        </div>
                    )}

                    {/* Quick Actions Widget */}
                    {widgetConfig.quickactions && (
                        <section className="bg-white border border-[#DFE1E6] rounded-sm p-4">
                            <h3 className="text-xs font-semibold text-[#5E6C84] uppercase mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link to="/projects" className="trello-btn trello-btn-primary w-full justify-start">
                                    <Plus size={14} />
                                    <span>Create Board</span>
                                </Link>
                                <Link to="/tickets" className="trello-btn trello-btn-secondary w-full justify-start">
                                    <MessageSquare size={14} />
                                    <span>New Ticket</span>
                                </Link>
                                <Link to="/team" className="trello-btn trello-btn-secondary w-full justify-start">
                                    <Users size={14} />
                                    <span>Invite Team</span>
                                </Link>
                            </div>
                        </section>
                    )}

                    {/* Workspace Info */}
                    {widgetConfig.premium && (
                        <section className="trello-gradient rounded-sm p-6 text-white">
                            <h3 className="text-lg font-semibold mb-2">Workspace Premium</h3>
                            <p className="text-sm text-white/90 mb-4 leading-relaxed">
                                Unlock advanced features for your team with Omni-PMS Premium.
                            </p>
                            <Link to="/settings" className="block text-center w-full py-2 bg-white text-[var(--trello-primary)] rounded-sm font-medium text-sm hover:bg-white/90 transition-colors">
                                Workspace Settings
                            </Link>
                        </section>
                    )}
                </div>
            </div>

            {/* Customize Dashboard Modal (US-018) */}
            {showCustomizeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={18} className="text-[#0052CC]" />
                                <h3 className="font-bold text-[#172B4D] text-base">Customize Dashboard Layout</h3>
                            </div>
                            <button onClick={() => setShowCustomizeModal(false)} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="py-4 space-y-3">
                            <p className="text-xs text-[#5E6C84]">Enable or disable the dashboard widgets that matter most to your daily workflow.</p>
                            {[
                                { key: 'stats', label: 'Top KPI Metrics Bar', desc: 'Active projects, pending tasks, and ticket counts' },
                                { key: 'projects', label: 'Recent Projects & Boards', desc: 'Quick shortcuts to recent project boards' },
                                { key: 'tasks', label: 'Assigned Tasks List', desc: 'Tasks pending your action with due dates' },
                                { key: 'activity', label: 'Live Activity Stream', desc: 'Real-time workspace update logs' },
                                { key: 'timetracking', label: 'Time Tracker', desc: 'Live timer and billable work logging' },
                                { key: 'reminders', label: 'Reminders & Approaching Deadlines', desc: 'Tasks and tickets due in 24 hours' },
                                { key: 'quickactions', label: 'Quick Action Shortcuts', desc: '1-click create buttons' },
                                { key: 'premium', label: 'Workspace Summary', desc: 'Workspace tier overview' }
                            ].map(w => (
                                <label
                                    key={w.key}
                                    onClick={() => toggleWidget(w.key)}
                                    className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer transition select-none"
                                >
                                    <input
                                        type="checkbox"
                                        checked={widgetConfig[w.key]}
                                        onChange={() => {}}
                                        className="mt-0.5 rounded text-[#0052CC]"
                                    />
                                    <div>
                                        <span className="text-xs font-bold text-[#172B4D] block">{w.label}</span>
                                        <span className="text-[11px] text-[#5E6C84]">{w.desc}</span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={resetWidgets}
                                className="text-xs text-[#5E6C84] hover:text-[#172B4D] font-bold flex items-center gap-1"
                            >
                                <RotateCcw size={12} /> Reset to Default
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCustomizeModal(false)}
                                className="px-4 py-2 bg-[#0052CC] text-white rounded text-xs font-bold hover:bg-[#0747A6]"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
