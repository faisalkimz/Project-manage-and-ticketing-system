import { useState, useEffect } from 'react';
import { Ticket, FolderKanban, CheckCircle2, Clock, Plus, Users, FileText, Settings, ArrowUpRight, Activity, GitCommit, Layout } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
    const [stats, setStats] = useState({
        tickets: 0,
        activeProjects: 0,
        completedTasks: 0,
        pendingActions: 0,
        completionRate: 0,
        highPriority: 0,
        totalTasks: 0
    });
    const [activities, setActivities] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [ticketsRes, projectsRes, tasksRes, activityRes] = await Promise.all([
                    api.get('/tickets/tickets/'),
                    api.get('/projects/projects/'),
                    api.get('/projects/tasks/'),
                    api.get('/activity/audit-logs/')
                ]);

                const tickets = ticketsRes.data;
                const projects = projectsRes.data;
                const tasks = tasksRes.data;

                const highPriorityTasks = tasks.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL').length;
                const completedTasks = tasks.filter(t => t.status === 'DONE').length;
                const rate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

                setStats({
                    tickets: tickets.length,
                    activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
                    completedTasks: completedTasks,
                    pendingActions: tickets.filter(t => t.status === 'OPEN').length,
                    completionRate: rate,
                    highPriority: highPriorityTasks,
                    totalTasks: tasks.length
                });

                setActivities(activityRes.data.slice(0, 8));
                setUpcomingTasks(tasks.filter(t => t.status !== 'DONE').slice(0, 5));
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            }
        };
        fetchDashboardData();
    }, []);

    const MetricCard = ({ label, value, icon: Icon, trend }) => (
        <div className="card h-24 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <span className="text-zinc-500 text-xs font-medium">{label}</span>
                <Icon size={14} className="text-zinc-400" />
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-semibold text-zinc-900 tracking-tight">{value}</span>
                {trend && <span className="text-xs text-emerald-600 mb-1 font-medium">{trend}</span>}
            </div>
        </div>
    );

    return (
        <div className="layout-container p-6 min-h-screen space-y-8 animate-fade-in">
            {/* Header */}
            <header className="flex justify-between items-end border-b border-zinc-100 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-zinc-500 mb-2">
                        <Layout size={14} />
                        <span className="text-xs font-medium">Workspace / Overview</span>
                    </div>
                    <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn btn-secondary">
                        <Settings size={14} />
                        Customize
                    </button>
                    <button className="btn btn-primary">
                        <Plus size={14} />
                        New Issue
                    </button>
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Active Projects" value={stats.activeProjects} icon={FolderKanban} />
                <MetricCard label="Open Tickets" value={stats.tickets} icon={Ticket} trend="+2 new" />
                <MetricCard label="Task Completion" value={`${stats.completionRate}%`} icon={CheckCircle2} />
                <MetricCard label="High Priority" value={stats.highPriority} icon={Activity} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-zinc-900">My Tasks</h2>
                        <Link to="/projects" className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
                            View All <ArrowUpRight size={12} />
                        </Link>
                    </div>

                    <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3">Task Title</th>
                                    <th className="px-4 py-3">Project</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3 text-right">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                                    <tr key={task.id} className="group hover:bg-zinc-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className={`w-2 h-2 rounded-full ${task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'bg-orange-500' : 'bg-zinc-300'}`}></div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-zinc-900">{task.title}</td>
                                        <td className="px-4 py-3 text-zinc-500">{task.project_details?.name || 'Unknown'}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-600 font-mono">
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-zinc-500 font-mono text-xs">
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-12 text-center text-zinc-400">No tasks assigned.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar: Activity Stream */}
                <div className="space-y-6">
                    <h2 className="text-sm font-semibold text-zinc-900">Activity Stream</h2>
                    <div className="border border-zinc-200 rounded-lg bg-white p-4 space-y-6">
                        {activities.length > 0 ? activities.map((log) => (
                            <div key={log.id} className="flex gap-3 relative">
                                <div className="absolute left-[9px] top-6 bottom-[-24px] w-[1px] bg-zinc-100 last:hidden"></div>
                                <div className="mt-1">
                                    <GitCommit size={14} className="text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-900">
                                        <span className="font-medium">{log.user_details?.username}</span> <span className="text-zinc-500">{log.action.toLowerCase()}</span>
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                                        {log.details?.message || 'Updated entity details'}
                                    </p>
                                    <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-xs text-zinc-400 text-center py-4">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
