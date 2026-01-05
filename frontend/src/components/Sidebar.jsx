import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, FolderKanban, Users, LogOut, Settings, Command } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useAuthStore();

    const links = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Tickets', path: '/tickets', icon: Ticket },
        { name: 'Projects', path: '/projects', icon: FolderKanban },
        { name: 'Team', path: '/team', icon: Users, roles: ['ADMIN', 'DEVELOPER', 'PROJECT_MANAGER'] },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-[240px] bg-zinc-50 border-r border-zinc-200 flex flex-col z-50">
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-zinc-200 bg-white">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center text-white">
                        <Command size={14} />
                    </div>
                    <span className="font-semibold text-sm text-zinc-900 tracking-tight">Omni System</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
                <div className="px-2 mb-2">
                    <span className="text-[11px] font-medium text-zinc-400">Workspace</span>
                </div>

                {links.map((link) => {
                    if (link.roles && !link.roles.includes(user?.role)) return null;
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;

                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive
                                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                                }`}
                        >
                            <Icon size={16} className={isActive ? 'text-zinc-900' : 'text-zinc-500'} strokeWidth={2} />
                            {link.name}
                        </Link>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-200 bg-white">
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all cursor-pointer group">
                    <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-600 text-xs font-semibold border border-zinc-200">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-900 truncate">{user?.username}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{user?.role}</p>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); logout(); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-600 transition-all"
                        title="Sign Out"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
