import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Users, Layout, Settings, Plus, Briefcase,
    ChevronRight, Star, Clock, MessageSquare, Shield, Edit2
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Workspace = () => {
    const { id } = useParams();
    const { user } = useAuthStore();
    const [workspace, setWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Boards');

    useEffect(() => {
        const fetchWorkspace = async () => {
            try {
                const res = await api.get(`/users/teams/${id}/`);
                setWorkspace(res.data);
            } catch (error) {
                console.error('Failed to fetch workspace', error);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkspace();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-[#FAFBFC]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0079BF]"></div>
        </div>
    );

    if (!workspace) return (
        <div className="p-12 text-center">
            <h2 className="text-2xl font-bold text-[#172B4D]">Workspace not found</h2>
            <Link to="/" className="text-[#0079BF] hover:underline mt-4 inline-block">Back to Dashboard</Link>
        </div>
    );

    const getWorkspaceStyle = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('engineering')) return {
            from: '#0052CC', to: '#0747A6',
            accent: 'bg-[#DEEBFF] text-[#0052CC]',
            banner: 'bg-gradient-to-r from-[#0052CC] to-[#0747A6]'
        };
        if (lowerName.includes('design')) return {
            from: '#E54937', to: '#BF2600',
            accent: 'bg-[#FFEBE6] text-[#BF2600]',
            banner: 'bg-gradient-to-r from-[#E54937] to-[#BF2600]'
        };
        if (lowerName.includes('success') || lowerName.includes('customer')) return {
            from: '#00875A', to: '#006644',
            accent: 'bg-[#E3FCEF] text-[#006644]',
            banner: 'bg-gradient-to-r from-[#00875A] to-[#006644]'
        };
        return {
            from: '#0079BF', to: '#026AA7',
            accent: 'bg-[#E6F0F7] text-[#0079BF]',
            banner: 'bg-gradient-to-r from-[#0079BF] to-[#026AA7]'
        };
    };

    const style = getWorkspaceStyle(workspace.name);
    const initials = workspace.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="min-h-screen bg-[#FAFBFC]">
            {/* Workspace Hero Banner */}
            <div className={`h-32 ${style.banner} w-full`} />

            <div className="bg-white border-b border-[#DFE1E6] -mt-12">
                <div className="max-w-6xl mx-auto px-6 pb-6">
                    <div className="flex items-end gap-6 relative">
                        <div
                            className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl font-bold text-white shadow-xl border-4 border-white shrink-0 mb-[-12px]"
                            style={{ backgroundColor: style.from }}
                        >
                            {initials}
                        </div>
                        <div className="flex-1 pb-2">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-[#172B4D]">{workspace.name}</h1>
                                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${style.accent}`}>
                                        Workspace
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#EBECF0] hover:bg-[#DFE1E6] text-[#172B4D] rounded-sm text-xs font-bold transition-colors">
                                        <Plus size={14} />
                                        Invite
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#EBECF0] hover:bg-[#DFE1E6] text-[#172B4D] rounded-sm text-xs font-bold transition-colors">
                                        <Settings size={14} />
                                        Settings
                                    </button>
                                </div>
                            </div>
                            <p className="text-[#5E6C84] text-sm max-w-2xl">
                                {workspace.description || "The central hub for all our projects and team collaboration."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex gap-8 border-b border-transparent">
                        {['Boards', 'Members', 'Settings'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-[#0079BF] text-[#0079BF]' : 'border-transparent text-[#5E6C84] hover:text-[#172B4D]'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-10">
                        {activeTab === 'Boards' ? (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-[#172B4D] flex items-center gap-2">
                                        <Layout size={20} className="text-[#5E6C84]" />
                                        Boards
                                    </h2>
                                    <button className="text-sm font-bold text-[#0079BF] hover:underline flex items-center gap-1">
                                        <Plus size={16} />
                                        New Board
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {workspace.projects_details?.map((project) => (
                                        <Link
                                            key={project.id}
                                            to={`/projects/${project.id}`}
                                            className="group relative h-28 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between"
                                            style={{ backgroundColor: project.background_color || '#0079BF' }}
                                        >
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            <div className="relative z-10">
                                                <h3 className="text-white font-bold text-base leading-tight">{project.name}</h3>
                                            </div>
                                            <div className="relative z-10 flex items-center justify-between text-white/90 text-xs font-medium">
                                                <span>{project.task_stats?.total || 0} tasks</span>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                    {project.task_stats?.percentage || 0}%
                                                </div>
                                            </div>
                                        </Link>
                                    ))}

                                    <button className="h-28 border-2 border-dashed border-[#DFE1E6] rounded-sm flex flex-col items-center justify-center gap-1.5 text-[#5E6C84] hover:border-[#0079BF] hover:text-[#0079BF] hover:bg-[#F4F5F7] transition-all">
                                        <Plus size={20} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Create Board</span>
                                    </button>
                                </div>
                            </section>
                        ) : activeTab === 'Members' ? (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-[#172B4D]">Workspace Members</h2>
                                    <button className="trello-btn trello-btn-primary">Invite Member</button>
                                </div>
                                <div className="bg-white border border-[#DFE1E6] rounded-sm overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                                            <tr>
                                                <th className="px-6 py-3 text-xs font-bold text-[#5E6C84] uppercase">User</th>
                                                <th className="px-6 py-3 text-xs font-bold text-[#5E6C84] uppercase">Role</th>
                                                <th className="px-6 py-3 text-xs font-bold text-[#5E6C84] uppercase">Department</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#DFE1E6]">
                                            {workspace.members_details?.map(m => (
                                                <tr key={m.id} className="hover:bg-[#F4F5F7] transition-colors">
                                                    <td className="px-6 py-4 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#EBECF0] flex items-center justify-center text-xs font-bold">{m.username[0].toUpperCase()}</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#172B4D]">{m.username}</p>
                                                            <p className="text-xs text-[#5E6C84]">{m.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 bg-[#EBECF0] text-[#172B4D] text-[10px] font-bold uppercase rounded-sm">
                                                            {m.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[#5E6C84]">
                                                        {m.department?.replace('_', ' ') || 'General'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        ) : (
                            <section className="bg-white border border-[#DFE1E6] rounded-sm p-12 text-center text-[#5E6C84]">
                                <Settings size={48} className="mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-semibold mb-1">Workspace Settings</h3>
                                <p className="text-sm">Manage visibility, integrations, and workspace preferences.</p>
                                <button className="mt-8 px-6 py-2 bg-[#F4F5F7] text-[#172B4D] font-bold rounded-sm text-sm hover:bg-[#EBECF0]">
                                    Open Settings
                                </button>
                            </section>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-8">
                        <section className="bg-white border border-[#DFE1E6] rounded-sm p-5 shadow-sm">
                            <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-wider mb-4">Workspace Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[#5E6C84]">Total Projects</span>
                                    <span className="text-sm font-bold text-[#172B4D]">{workspace.projects_details?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[#5E6C84]">Active Members</span>
                                    <span className="text-sm font-bold text-[#172B4D]">{workspace.member_count}</span>
                                </div>
                            </div>
                        </section>

                        <section className="bg-gradient-to-br from-[#0079BF] to-[#026AA7] rounded-sm p-6 text-white shadow-lg">
                            <Star className="mb-4 text-yellow-400" fill="currentColor" size={24} />
                            <h3 className="text-lg font-bold mb-2">Workspace Premium</h3>
                            <p className="text-sm text-white/90 mb-6">
                                Unlock timeline views, advanced reporting, and project security features.
                            </p>
                            <button className="w-full py-2 bg-white text-[#0079BF] rounded-sm font-bold text-xs uppercase tracking-widest transition-transform hover:scale-105">
                                Upgrade Now
                            </button>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Workspace;
