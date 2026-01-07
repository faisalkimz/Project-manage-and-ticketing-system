import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, UserPlus, Mail, Edit2, Trash2,
    Search, X, Check, Plus, Settings, MoreHorizontal,
    Briefcase, Shield, Filter
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/Toast';

const Team = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('structure');
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [invites, setInvites] = useState([]);
    const [search, setSearch] = useState('');

    // Modal States
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [isManageTeamModalOpen, setIsManageTeamModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Data States
    const [newTeam, setNewTeam] = useState({ name: '', description: '', members: [] });
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [editingTeamForm, setEditingTeamForm] = useState({ name: '', description: '' });
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('EMPLOYEE');
    const [loading, setLoading] = useState(false);
    const [activeUserMenu, setActiveUserMenu] = useState(null);

    const fetchData = async () => {
        try {
            const [usersRes, teamsRes, invitesRes] = await Promise.all([
                api.get('/users/list/'),
                api.get('/users/teams/'),
                api.get('/users/invites/')
            ]);
            setUsers(usersRes.data);
            setTeams(teamsRes.data);
            setInvites(invitesRes.data);
        } catch (error) { console.error('Failed to fetch data', error); }
    };

    useEffect(() => { fetchData(); }, []);

    // Handlers
    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/teams/', newTeam);
            setIsCreateTeamModalOpen(false);
            setNewTeam({ name: '', description: '', members: [] });
            fetchData();
        } catch (e) {
            const msg = e.response?.data?.detail || e.response?.data?.name?.[0] || 'Failed to create team.';
            showToast(msg, 'error');
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/users/invites/', { email: inviteEmail, role_name: inviteRole });
            setIsInviteModalOpen(false);
            setInviteEmail('');
            fetchData();
            showToast(`Invitation sent to ${inviteEmail}`, 'success');
        } catch (e) {
            const msg = e.response?.data?.detail || e.response?.data?.email?.[0] || 'Invite failed.';
            showToast(msg, 'error');
        } finally { setLoading(false); }
    };

    const toggleTeamMember = async (userId) => {
        if (!selectedTeam) return;
        const current = selectedTeam.members || [];
        const updated = current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId];

        // Optimistic update
        const newDetails = users.filter(u => updated.includes(u.id));
        setSelectedTeam({ ...selectedTeam, members: updated, members_details: newDetails });

        try { await api.patch(`/users/teams/${selectedTeam.id}/`, { members: updated }); fetchData(); }
        catch (e) { console.error(e); }
    };

    const handleDeleteTeam = async (id) => {
        if (!window.confirm("Are you sure you want to delete this team?")) return;
        try {
            await api.delete(`/users/teams/${id}/`);
            setIsManageTeamModalOpen(false);
            fetchData();
        } catch (e) { showToast("Could not delete team.", 'error'); }
    }

    const handleSettingsClick = () => {
        navigate('/settings');
    };

    const handleUpdateTeamDetails = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/users/teams/${selectedTeam.id}/`, editingTeamForm);
            // Update local state
            setTeams(teams.map(t => t.id === selectedTeam.id ? { ...t, ...editingTeamForm } : t));
            setSelectedTeam({ ...selectedTeam, ...editingTeamForm });
            showToast('Team updated successfully', 'success');
        } catch (e) { showToast('Failed to update team', 'error'); }
    };

    const handleUpdateUserRole = async (userId, newRole) => {
        try {
            await api.patch(`/users/${userId}/`, { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setActiveUserMenu(null);
            showToast('Role updated successfully', 'success');
        } catch (e) { showToast('Failed to update role', 'error'); }
    };

    const handleToggleUserStatus = async (userId, userIsActive) => {
        try {
            await api.patch(`/users/${userId}/`, { is_active: !userIsActive });
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: !userIsActive } : u));
            setActiveUserMenu(null);
            showToast(`User ${userIsActive ? 'deactivated' : 'activated'}`, 'info');
        } catch (e) { showToast('Failed to update status', 'error'); }
    };

    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

    const getRoleParams = (role) => {
        switch (role) {
            case 'ADMIN': return { bg: 'bg-purple-100', text: 'text-purple-700' };
            case 'DEVELOPER': return { bg: 'bg-blue-100', text: 'text-blue-700' };
            case 'PROJECT_MANAGER': return { bg: 'bg-orange-100', text: 'text-orange-700' };
            default: return { bg: 'bg-green-100', text: 'text-green-700' };
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-6 font-sans text-[#172B4D] pb-24 md:pb-6">
            {/* Professional Header */}
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-[#5E6C84] mb-1">
                            <Briefcase size={16} />
                            <span className="text-sm font-medium uppercase tracking-wide">Workspace</span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-semibold text-[#172B4D]">Team Management</h1>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleSettingsClick}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-[#EBECF0] hover:bg-[#DFE1E6] text-[#172B4D] rounded-[3px] font-medium transition-colors"
                        >
                            <Settings size={16} />
                            <span>Settings</span>
                        </button>
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-[#0079BF] hover:bg-[#026AA7] text-white rounded-[3px] font-medium transition-colors shadow-sm"
                        >
                            <UserPlus size={16} />
                            <span>Invite Member</span>
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="border-b border-[#DFE1E6] mb-8">
                    <div className="flex gap-6">
                        {[
                            { id: 'structure', label: 'Teams & Groups' },
                            { id: 'members', label: 'All Members' },
                            { id: 'invites', label: `Pending Invites (${invites.length})` }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-[#0079BF] text-[#0079BF]'
                                    : 'border-transparent text-[#5E6C84] hover:text-[#172B4D] hover:border-[#DFE1E6]'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="animate-fade-in">
                    {/* --- TEAMS TAB --- */}
                    {activeTab === 'structure' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Create Team Card */}
                            <button
                                onClick={() => setIsCreateTeamModalOpen(true)}
                                className="group h-48 border-2 border-dashed border-[#DFE1E6] rounded-[3px] flex flex-col items-center justify-center gap-3 text-[#5E6C84] hover:border-[#0079BF] hover:text-[#0079BF] hover:bg-[#F4F5F7] transition-all"
                            >
                                <div className="p-3 bg-[#EBECF0] rounded-full group-hover:bg-[#0079BF] group-hover:text-white transition-colors">
                                    <Plus size={24} />
                                </div>
                                <span className="font-medium text-sm">Create a new team</span>
                            </button>

                            {teams.map(team => (
                                <div key={team.id} className="bg-white border border-[#DFE1E6] rounded-[3px] p-5 hover:shadow-md transition-shadow group relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-lg font-semibold text-[#172B4D]">{team.name}</h3>
                                        <button
                                            onClick={() => {
                                                setSelectedTeam(team);
                                                setEditingTeamForm({ name: team.name, description: team.description });
                                                setIsManageTeamModalOpen(true);
                                            }}
                                            className="p-1.5 hover:bg-[#EBECF0] rounded text-[#5E6C84] transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-[#5E6C84] text-sm mb-6 h-10 line-clamp-2">{team.description || "No description provided."}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-[#DFE1E6]">
                                        <div className="flex -space-x-1">
                                            {team.members_details?.slice(0, 4).map((m, i) => (
                                                <div key={i} title={m.username} className="w-7 h-7 rounded-full bg-[#DFE1E6] border border-white flex items-center justify-center text-[10px] font-bold text-[#172B4D]">
                                                    {m.username?.[0]?.toUpperCase()}
                                                </div>
                                            ))}
                                            {(team.members_details?.length || 0) > 4 && (
                                                <div className="w-7 h-7 rounded-full bg-[#FAFBFC] border border-[#DFE1E6] flex items-center justify-center text-[10px] font-medium text-[#5E6C84]">
                                                    +{team.members_details.length - 4}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-[#5E6C84] uppercase">{team.member_count} Members</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* --- MEMBERS TAB --- */}
                    {activeTab === 'members' && (
                        <div className="space-y-6">
                            <div className="max-w-md relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#0079BF] outline-none transition-colors"
                                />
                            </div>

                            <div className="bg-white border border-[#DFE1E6] rounded-[3px] overflow-x-auto custom-scrollbar shadow-sm">
                                <table className="w-full min-w-[700px]">
                                    <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-[#5E6C84] uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-[#5E6C84] uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-[#5E6C84] uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-[#5E6C84] uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#DFE1E6]">
                                        {filteredUsers.map(user => {
                                            const roleStyle = getRoleParams(user.role);
                                            return (
                                                <tr key={user.id} className="hover:bg-[#F4F5F7] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-[#DFE1E6] flex items-center justify-center text-xs font-bold text-[#172B4D]">
                                                                {user.username?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-[#172B4D]">{user.username}</p>
                                                                <p className="text-xs text-[#5E6C84]">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-[3px] text-xs font-bold uppercase ${roleStyle.bg} ${roleStyle.text}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {user.is_active ? (
                                                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                                                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-xs font-medium text-[#5E6C84]">
                                                                <span className="w-2 h-2 rounded-full bg-[#DFE1E6]"></span> Inactive
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 relative">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveUserMenu(activeUserMenu === user.id ? null : user.id); }}
                                                            className="p-1 hover:bg-[#EBECF0] rounded text-[#5E6C84]"
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </button>
                                                        {activeUserMenu === user.id && (
                                                            <div className="absolute right-8 top-8 w-56 bg-white border border-[#DFE1E6] rounded-[3px] shadow-xl z-20 animate-scale-in" onClick={e => e.stopPropagation()}>
                                                                <div className="p-2 border-b border-[#DFE1E6]">
                                                                    <p className="text-xs font-bold text-[#5E6C84] px-2 mb-2 uppercase">Change Role</p>
                                                                    {['EMPLOYEE', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMIN'].map(role => (
                                                                        <button
                                                                            key={role}
                                                                            onClick={() => handleUpdateUserRole(user.id, role)}
                                                                            className={`w-full text-left px-2 py-1.5 text-xs rounded-[3px] mb-0.5 ${user.role === role ? 'bg-blue-50 text-[#0079BF] font-semibold' : 'text-[#172B4D] hover:bg-[#F4F5F7]'}`}
                                                                        >
                                                                            {role}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <div className="p-2">
                                                                    <button
                                                                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                                                        className="w-full text-left px-2 py-1.5 text-xs text-[#EB5A46] hover:bg-[#FFF0B3] rounded-[3px] font-medium"
                                                                    >
                                                                        {user.is_active ? 'Deactivate User' : 'Activate User'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- INVITES TAB --- */}
                    {activeTab === 'invites' && (
                        <div className="max-w-3xl">
                            {invites.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-[#DFE1E6] rounded-[3px] bg-[#FAFBFC]">
                                    <Mail className="mx-auto mb-3 text-[#DFE1E6]" size={48} />
                                    <p className="text-[#5E6C84] font-medium">No pending invitations</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {invites.map(invite => (
                                        <div key={invite.id} className="bg-white border border-[#DFE1E6] rounded-[3px] p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#EBECF0] flex items-center justify-center text-[#5E6C84]">
                                                    <Mail size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#172B4D]">{invite.email}</p>
                                                    <p className="text-xs text-[#5E6C84]">Role: {invite.role_name}</p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-[#FFF0B3] text-[#172B4D] text-xs font-bold uppercase rounded-[3px]">Pending</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALS (Trello Style) --- */}

            {/* Create Team Modal */}
            {isCreateTeamModalOpen && (
                <div className="fixed inset-0 z-50 bg-[#091E42]/50 flex items-center justify-center p-4" onClick={() => setIsCreateTeamModalOpen(false)}>
                    <div className="bg-white w-full max-w-md rounded-[3px] shadow-lg animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-[#DFE1E6] flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-[#172B4D]">Create Team</h3>
                            <button onClick={() => setIsCreateTeamModalOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded text-[#5E6C84]"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Team Name</label>
                                <input
                                    autoFocus
                                    required
                                    className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#0079BF] outline-none"
                                    value={newTeam.name}
                                    onChange={e => setNewTeam({ ...newTeam, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#0079BF] outline-none min-h-[100px] resize-none"
                                    value={newTeam.description}
                                    onChange={e => setNewTeam({ ...newTeam, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="px-6 py-2 bg-[#0079BF] text-white font-bold rounded-[3px] hover:bg-[#026AA7] transition-colors text-sm">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Team Modal */}
            {isManageTeamModalOpen && selectedTeam && (
                <div className="fixed inset-0 z-50 bg-[#091E42]/50 flex items-center justify-center p-4" onClick={() => setIsManageTeamModalOpen(false)}>
                    <div className="bg-white w-full max-w-2xl h-[80vh] rounded-[3px] flex flex-col shadow-lg animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-[#DFE1E6] flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-[#172B4D]">{selectedTeam.name}</h3>
                            <button onClick={() => setIsManageTeamModalOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded text-[#5E6C84]"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
                            {/* Team Details Form */}
                            <form onSubmit={handleUpdateTeamDetails} className="mb-8 p-4 bg-white border border-[#DFE1E6] rounded-[3px]">
                                <h4 className="text-xs font-bold text-[#5E6C84] uppercase mb-3">Team Details</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#5E6C84] mb-1">Name</label>
                                        <input
                                            className="w-full px-2 py-1.5 border border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#0079BF] outline-none"
                                            value={editingTeamForm.name}
                                            onChange={e => setEditingTeamForm({ ...editingTeamForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#5E6C84] mb-1">Description</label>
                                        <textarea
                                            className="w-full px-2 py-1.5 border border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#0079BF] outline-none resize-none h-20"
                                            value={editingTeamForm.description}
                                            onChange={e => setEditingTeamForm({ ...editingTeamForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="submit" className="px-3 py-1.5 bg-[#0079BF] text-white text-xs font-bold rounded-[3px] hover:bg-[#026AA7]">Save Details</button>
                                    </div>
                                </div>
                            </form>

                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-bold text-[#5E6C84] uppercase">Members</h4>
                                <button onClick={() => handleDeleteTeam(selectedTeam.id)} className="text-xs text-red-600 hover:underline font-medium">Delete Team</button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {users.map(u => {
                                    const isMember = selectedTeam.members?.includes(u.id);
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => toggleTeamMember(u.id)}
                                            className={`flex items-center gap-3 p-2 rounded-[3px] border cursor-pointer transition-colors ${isMember
                                                ? 'bg-blue-50 border-[#0079BF]'
                                                : 'bg-white border-[#DFE1E6] hover:border-[#b3bac5]'
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#EBECF0] flex items-center justify-center text-xs font-bold text-[#172B4D]">
                                                {u.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-[#172B4D]">{u.username}</p>
                                                <p className="text-xs text-[#5E6C84]">{u.role}</p>
                                            </div>
                                            {isMember && <Check size={16} className="text-[#0079BF]" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#DFE1E6] bg-white flex justify-end">
                            <button onClick={() => setIsManageTeamModalOpen(false)} className="px-4 py-2 bg-[#091E42] text-white rounded-[3px] font-medium hover:bg-[#253858] transition-colors text-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 bg-[#091E42]/50 flex items-center justify-center p-4" onClick={() => setIsInviteModalOpen(false)}>
                    <div className="bg-white w-full max-w-md rounded-[3px] shadow-lg animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-[#DFE1E6] flex justify-between items-center bg-[#F4F5F7]">
                            <h3 className="text-lg font-semibold text-[#172B4D]">Invite to Workspace</h3>
                            <button onClick={() => setIsInviteModalOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded text-[#5E6C84]"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#0079BF] outline-none"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#0079BF] outline-none bg-white"
                                >
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="DEVELOPER">Developer</option>
                                    <option value="PROJECT_MANAGER">Project Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <button type="submit" disabled={loading} className="w-full mt-2 py-2 bg-[#0079BF] text-white font-bold rounded-[3px] hover:bg-[#026AA7] transition-colors text-sm disabled:opacity-50">
                                {loading ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
