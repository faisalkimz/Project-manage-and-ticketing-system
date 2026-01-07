import { useState, useEffect } from 'react';
import { Layout, Briefcase, Users, Settings, LogOut, MessageSquare, Menu, X, Star, PieChart, Bell, Kanban, ClipboardList, Package, BarChart, Activity, Flag, Calendar, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const Sidebar = ({ isOpen, onClose, isMobile }) => {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const projectId = location.pathname.match(/\/projects\/(\d+)/)?.[1];
    const projectTab = new URLSearchParams(location.search).get('tab') || 'board';

    const links = [
        { name: 'Boards', path: '/', icon: Layout },
        { name: 'Projects', path: '/projects', icon: Briefcase },
        { name: 'Portfolios', path: '/portfolios', icon: PieChart, roles: ['ADMIN', 'DEVELOPER', 'PROJECT_MANAGER'] },
        { name: 'Jira Software', path: '/jira', icon: Layout },
        { name: 'Tickets', path: '/tickets', icon: MessageSquare },
        { name: 'Team', path: '/team', icon: Users, roles: ['ADMIN', 'DEVELOPER', 'PROJECT_MANAGER'] },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    const isActive = (path) => location.pathname === path;

    const [teams, setTeams] = useState([]);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await api.get('/users/teams/');
                setTeams(res.data);
            } catch (error) { console.error('Failed to fetch teams', error); }
        };
        if (user) fetchTeams();
    }, [user]);

    const getWorkspaceColor = (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('engineering')) return 'from-indigo-500 to-blue-600';
        if (lower.includes('design')) return 'from-rose-500 to-orange-600';
        if (lower.includes('success') || lower.includes('customer')) return 'from-emerald-500 to-teal-600';
        return 'from-indigo-400 to-cyan-500';
    };

    const [starredProjects, setStarredProjects] = useState([]);

    const fetchStarred = async () => {
        try {
            const res = await api.get('/projects/projects/');
            setStarredProjects(res.data.filter(p => p.is_starred));
        } catch (error) { console.error('Failed to fetch projects', error); }
    };

    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/collaboration/notifications/');
            setNotifications(res.data);
        } catch (error) { console.error('Failed to fetch notifications', error); }
    };

    useEffect(() => {
        if (user) {
            fetchStarred();
            fetchNotifications();
            // Listen for star updates
            window.addEventListener('projectStarred', fetchStarred);
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => {
                window.removeEventListener('projectStarred', fetchStarred);
                clearInterval(interval);
            };
        }
    }, [user, location.pathname]);

    const sidebarClasses = `
        ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : ''}
        ${!isMobile && isCollapsed ? 'w-16' : 'w-64'}
        h-shadow bg-[#172B4D] flex flex-col shrink-0 transition-transform duration-300 md:transition-all
        fixed left-0 top-0 bottom-0 z-[100] h-full
    `;

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[90] animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={sidebarClasses}>
                {/* Trello Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-[rgba(255,255,255,0.2)]">
                    {(!isCollapsed || isMobile) && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-[#0079BF] font-black text-base shadow-md">
                                M
                            </div>
                            <span className="font-semibold text-white text-base tracking-tight">
                                Mbabali
                            </span>
                        </div>
                    )}
                    <button
                        onClick={isMobile ? onClose : () => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 hover:bg-[rgba(255,255,255,0.2)] rounded-sm transition-colors text-white"
                        aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                        {isMobile ? <X size={18} /> : (isCollapsed ? <Menu size={18} /> : <X size={18} />)}
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-4 px-3 overflow-y-auto scrollbar-hide">
                    <nav className="space-y-0.5">
                        {links.map((link) => {
                            if (link.roles && !link.roles.includes(user?.role)) return null;
                            const active = isActive(link.path);
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => isMobile && onClose()}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-all font-medium text-sm ${active
                                        ? 'bg-[rgba(255,255,255,0.25)] text-white'
                                        : 'text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.15)] hover:text-white'
                                        }`}
                                    title={isCollapsed && !isMobile ? link.name : ''}
                                >
                                    <link.icon size={18} strokeWidth={2} />
                                    {(!isCollapsed || isMobile) && <span>{link.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Starred Boards */}
                    {(!isCollapsed || isMobile) && (
                        <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.1)] px-3">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <p className="text-[10px] font-bold text-[rgba(255,255,255,0.6)] uppercase tracking-widest">Starred Boards</p>
                                <Star size={12} className="text-[rgba(255,255,255,0.4)]" />
                            </div>
                            <div className="space-y-1">
                                {starredProjects.length > 0 ? starredProjects.map(proj => (
                                    <Link
                                        key={proj.id}
                                        to={`/projects/${proj.id}`}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.85)] hover:text-white transition-all group"
                                    >
                                        <div className={`w-6 h-6 rounded-[3px] bg-gradient-to-br ${getWorkspaceColor(proj.name)} flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20`}>
                                            {proj.name[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium truncate flex-1">{proj.name}</span>
                                        <Star size={10} fill="white" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                )) : (
                                    <div className="px-2 py-3 bg-white/10 rounded text-xs text-white/70 leading-relaxed">
                                        <p className="mb-1 font-medium">No starred boards yet</p>
                                        <p className="text-[10px]">Click the ★ icon on any project card to add it here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Project Contextual Links */}
                    {projectId && (!isCollapsed || isMobile) && (
                        <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.1)] px-3">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <p className="text-[10px] font-bold text-[rgba(255,255,255,0.6)] uppercase tracking-widest">Project</p>
                                <Briefcase size={12} className="text-[rgba(255,255,255,0.4)]" />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="px-3 text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-widest mb-1">Planning</p>
                                    {[
                                        { name: 'Roadmap', tab: 'roadmap', icon: Flag },
                                        { name: 'Backlog', tab: 'list', icon: ClipboardList },
                                        { name: 'Board', tab: 'board', icon: Kanban },
                                    ].map((item) => {
                                        const active = projectTab === item.tab;
                                        return (
                                            <Link
                                                key={item.tab}
                                                to={`/projects/${projectId}?tab=${item.tab}`}
                                                className={`flex items-center gap-3 px-3 py-1.5 rounded-sm transition-all font-medium text-xs ${active
                                                    ? 'bg-[rgba(255,255,255,0.15)] text-white'
                                                    : 'text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
                                                    }`}
                                            >
                                                <item.icon size={14} />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                <div>
                                    <p className="px-3 text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-widest mb-1">Organization</p>
                                    {[
                                        { name: 'Overview', tab: 'overview', icon: Layout },
                                        { name: 'Calendar', tab: 'calendar', icon: Calendar },
                                        { name: 'Timeline', tab: 'timeline', icon: Activity },
                                        { name: 'Grid', tab: 'grid', icon: Layout },
                                    ].map((item) => {
                                        const active = projectTab === item.tab;
                                        return (
                                            <Link
                                                key={item.tab}
                                                to={`/projects/${projectId}?tab=${item.tab}`}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-all font-medium text-xs ${active
                                                    ? 'bg-[rgba(255,255,255,0.15)] text-white'
                                                    : 'text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
                                                    }`}
                                            >
                                                <item.icon size={14} />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                <div>
                                    <p className="px-3 text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-widest mb-1">Team</p>
                                    {[
                                        { name: 'Releases', tab: 'releases', icon: Package },
                                        { name: 'Reports', tab: 'reports', icon: BarChart },
                                        { name: 'Workload', tab: 'workload', icon: Activity },
                                        { name: 'Timesheets', tab: 'timesheets', icon: Clock },
                                        { name: 'Collaborate', tab: 'collaboration', icon: MessageSquare }
                                    ].map((item) => {
                                        const active = projectTab === item.tab;
                                        return (
                                            <Link
                                                key={item.tab}
                                                to={`/projects/${projectId}?tab=${item.tab}`}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-all font-medium text-xs ${active
                                                    ? 'bg-[rgba(255,255,255,0.15)] text-white shadow-sm'
                                                    : 'text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
                                                    }`}
                                            >
                                                <item.icon size={14} />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* User Profile */}
                <div className="p-3 border-t border-[rgba(255,255,255,0.2)]">
                    <div className="flex items-center gap-2">
                        {user?.profile_image ? (
                            <img
                                src={user.profile_image.startsWith('http') ? user.profile_image : `http://localhost:8000${user.profile_image}`}
                                alt="Profile"
                                className="w-8 h-8 rounded-full object-cover border-2 border-white shrink-0"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.3)] border-2 border-white flex items-center justify-center text-xs font-bold text-white shrink-0">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        {(!isCollapsed || isMobile) && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">
                                        {user?.username || 'User'}
                                    </p>
                                    <p className="text-[11px] text-[rgba(255,255,255,0.7)] truncate">
                                        {user?.role?.replace('_', ' ') || 'Viewer'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Link
                                        to="/settings"
                                        className="p-1.5 hover:bg-[rgba(255,255,255,0.2)] rounded-sm transition-colors text-[rgba(255,255,255,0.85)] hover:text-white relative"
                                        title="Notifications"
                                    >
                                        <Bell size={16} />
                                        {notifications.filter(n => !n.is_read).length > 0 && (
                                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0079BF] rounded-full" />
                                        )}
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="p-1.5 hover:bg-[rgba(255,255,255,0.2)] rounded-sm transition-colors text-[rgba(255,255,255,0.85)] hover:text-white"
                                        title="Log out"
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
