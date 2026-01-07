import { useState, useEffect } from 'react';
import {
    Star, Clock, CheckCircle2, ListTodo, Activity, ArrowRight,
    Briefcase, MessageSquare, ChevronRight, TrendingUp, Users, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import TimerWidget from '../components/TimerWidget';

const Dashboard = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ tickets: 0, projects: 0, tasks: 0 });
    const [recentProjects, setRecentProjects] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tRes, pRes, tkRes, actRes] = await Promise.all([
                    api.get('/tickets/tickets/'),
                    api.get('/projects/projects/'),
                    api.get('/projects/tasks/'),
                    api.get('/activity/audit-logs/')
                ]);
                setStats({
                    tickets: tRes.data.length,
                    projects: pRes.data.length,
                    tasks: tkRes.data.filter(t => t.status !== 'DONE').length
                });
                setRecentProjects(pRes.data.slice(0, 6));
                setUpcomingTasks(tkRes.data.filter(t => t.status !== 'DONE').slice(0, 5));
                setRecentActivity(actRes.data.slice(0, 6));
            } catch (error) { console.error(error); }
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
            <header className="mb-6 md:mb-8">
                <h1 className="text-xl md:text-2xl font-semibold text-[#172B4D] mb-1">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.username}
                </h1>
                <p className="text-sm text-[#5E6C84]">Here's what's happening in your workspace</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Active Projects" value={stats.projects} icon={Briefcase} color="bg-[#0079BF]" link="/projects" />
                <StatCard label="Pending Tasks" value={stats.tasks} icon={ListTodo} color="bg-[#FF9F1A]" link="/projects" />
                <StatCard label="Open Tickets" value={stats.tickets} icon={MessageSquare} color="bg-[#61BD4F]" link="/tickets" />
                <StatCard label="In Progress" value={upcomingTasks.length} icon={TrendingUp} color="bg-[#C377E0]" link="/projects" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Boards */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-[#172B4D] flex items-center gap-2">
                                <Star size={16} className="text-[#F2D600]" fill="#F2D600" />
                                Recent Boards
                            </h2>
                            <Link to="/projects" className="text-sm text-[#0079BF] hover:underline">
                                View all →
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentProjects.map((project) => (
                                <Link
                                    key={project.id}
                                    to={`/projects/${project.id}`}
                                    className="group bg-gradient-to-br from-[#0079BF] to-[#026AA7] rounded-sm p-4 hover:shadow-lg transition-all min-h-[100px] flex flex-col justify-between"
                                >
                                    <h3 className="text-white font-semibold text-base mb-2">{project.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/80">{project.key}</span>
                                        <div className="flex -space-x-1">
                                            {project.members_details?.slice(0, 3).map((m, i) => (
                                                <div
                                                    key={i}
                                                    className="w-6 h-6 rounded-full bg-white text-[#0079BF] border border-[#0079BF] flex items-center justify-center text-[10px] font-semibold"
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
                    </section>

                    {/* Upcoming Tasks */}
                    <section className="bg-white border border-[#DFE1E6] rounded-sm">
                        <div className="px-4 py-3 border-b border-[#DFE1E6]">
                            <h2 className="text-sm font-semibold text-[#172B4D] uppercase">Your Tasks</h2>
                        </div>
                        <div className="divide-y divide-[#DFE1E6]">
                            {upcomingTasks.map((task, i) => (
                                <div key={i} className="px-4 py-3 hover:bg-[#F4F5F7] cursor-pointer transition-colors group">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-[#172B4D] group-hover:text-[#0079BF] transition-colors mb-1">
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
                                            <span className={`trello-badge ${task.status === 'IN_PROGRESS' ? 'bg-[#0079BF] text-white' : 'bg-[#EBECF0] text-[#172B4D]'
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

                    {/* Recent Activity */}
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
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Time Tracking Widget */}
                    <section className="bg-white border border-[#DFE1E6] rounded-sm p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock size={16} className="text-[#5E6C84]" />
                            <h3 className="text-xs font-semibold text-[#5E6C84] uppercase">Time Tracking</h3>
                        </div>
                        <TimerWidget />
                    </section>

                    {/* Quick Actions */}
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

                    {/* Workspace Info */}
                    <section className="bg-gradient-to-br from-[#0079BF] to-[#026AA7] rounded-sm p-6 text-white">
                        <h3 className="text-lg font-semibold mb-2">Workspace Premium</h3>
                        <p className="text-sm text-white/90 mb-4 leading-relaxed">
                            Unlock advanced features for your team with Mbabali Premium.
                        </p>
                        <button className="w-full py-2 bg-white text-[#0079BF] rounded-sm font-medium text-sm hover:bg-white/90 transition-colors">
                            Learn More
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
