import { useState } from 'react';
import { Layout, Briefcase, Users, Settings, LogOut, MessageSquare, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const links = [
        { name: 'Boards', path: '/', icon: Layout },
        { name: 'Projects', path: '/projects', icon: Briefcase },
        { name: 'Tickets', path: '/tickets', icon: MessageSquare },
        { name: 'Team', path: '/team', icon: Users, roles: ['ADMIN', 'DEVELOPER', 'PROJECT_MANAGER'] },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className={`${isCollapsed ? 'w-16' : 'w-64'} h-screen bg-[#0079BF] flex flex-col shrink-0 transition-all duration-200 shadow-lg fixed left-0 top-0 z-50`}>
            {/* Trello Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[rgba(255,255,255,0.2)]">
                {!isCollapsed && (
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
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 hover:bg-[rgba(255,255,255,0.2)] rounded-sm transition-colors text-white"
                    aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ? <Menu size={18} /> : <X size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-4 overflow-y-auto custom-scrollbar px-3">
                <nav className="space-y-0.5">
                    {links.map((link) => {
                        if (link.roles && !link.roles.includes(user?.role)) return null;
                        const active = isActive(link.path);
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-all font-medium text-sm ${active
                                    ? 'bg-[rgba(255,255,255,0.25)] text-white'
                                    : 'text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.15)] hover:text-white'
                                    }`}
                                title={isCollapsed ? link.name : ''}
                            >
                                <link.icon size={18} strokeWidth={2} />
                                {!isCollapsed && <span>{link.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Workspace Section */}
                {!isCollapsed && (
                    <div className="mt-8">
                        <div className="px-3 mb-2">
                            <p className="text-[11px] font-semibold text-[rgba(255,255,255,0.7)] uppercase tracking-wider">
                                Workspace
                            </p>
                        </div>
                        <Link
                            to="/settings"
                            className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-all font-medium text-sm ${isActive('/settings')
                                ? 'bg-[rgba(255,255,255,0.25)] text-white'
                                : 'text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.15)] hover:text-white'
                                }`}
                        >
                            <Settings size={18} strokeWidth={2} />
                            <span>Settings</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* User Profile */}
            <div className="p-3 border-t border-[rgba(255,255,255,0.2)]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.3)] border-2 border-white flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {user?.username || 'User'}
                                </p>
                                <p className="text-[11px] text-[rgba(255,255,255,0.7)] truncate">
                                    {user?.role?.replace('_', ' ') || 'Viewer'}
                                </p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-1.5 hover:bg-[rgba(255,255,255,0.2)] rounded-sm transition-colors text-[rgba(255,255,255,0.85)] hover:text-white"
                                title="Log out"
                            >
                                <LogOut size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
