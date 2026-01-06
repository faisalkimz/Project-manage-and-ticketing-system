import { useState, useEffect } from 'react';
import { Mail, Search, UserPlus, X, Users, Trash2, Plus } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Team = () => {
    const { user: currentUser } = useAuthStore();
    const [view, setView] = useState('members');
    const [teams, setTeams] = useState([]);
    const [directory, setDirectory] = useState([]);
    const [invites, setInvites] = useState([]);
    const [search, setSearch] = useState('');
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isManageTeamModalOpen, setIsManageTeamModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [newTeam, setNewTeam] = useState({ name: '', description: '' });
    const [inviteForm, setInviteForm] = useState({ email: '', role_name: 'EMPLOYEE' });
    const [memberSearch, setMemberSearch] = useState('');

    const fetchData = async () => {
        try {
            const [teamsRes, usersRes, invitesRes] = await Promise.all([
                api.get('/users/teams/'),
                api.get('/users/list/'),
                api.get('/users/invites/')
            ]);
            setTeams(teamsRes.data);
            setDirectory(usersRes.data);
            setInvites(invitesRes.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/teams/', newTeam);
            setIsCreateTeamModalOpen(false);
            setNewTeam({ name: '', description: '' });
            fetchData();
        } catch (error) { console.error(error); }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/invites/', inviteForm);
            setIsInviteModalOpen(false);
            setInviteForm({ email: '', role_name: 'EMPLOYEE' });
            fetchData();
        } catch (error) { console.error(error); }
    };

    const toggleMember = async (team, userId) => {
        const isMember = team.members.includes(userId);
        const newMembers = isMember ? team.members.filter(id => id !== userId) : [...team.members, userId];
        try {
            const res = await api.patch(`/users/teams/${team.id}/`, { members: newMembers });
            setTeams(teams.map(t => t.id === team.id ? res.data : t));
            setSelectedTeam(res.data);
        } catch (error) { console.error(error); }
    };

    const deleteTeam = async (teamId) => {
        if (!confirm('Delete this team?')) return;
        try {
            await api.delete(`/users/teams/${teamId}/`);
            setIsManageTeamModalOpen(false);
            fetchData();
        } catch (error) { console.error(error); }
    };

    const getRoleBadge = (role) => {
        const colors = {
            ADMIN: 'bg-[#C377E0]',
            DEVELOPER: 'bg-[#0079BF]',
            PROJECT_MANAGER: 'bg-[#FF9F1A]',
            EMPLOYEE: 'bg-[#61BD4F]'
        };
        return colors[role] || colors.EMPLOYEE;
    };

    const filteredMembers = directory.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#FAFBFC] p-6">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-[#172B4D] mb-1">Team Management</h1>
                    <p className="text-sm text-[#5E6C84]">Manage team members and groups</p>
                </div>
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="trello-btn trello-btn-primary"
                >
                    <UserPlus size={16} />
                    <span>Invite</span>
                </button>
            </header>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
                <button
                    onClick={() => setView('members')}
                    className={`trello-btn ${view === 'members' ? 'trello-btn-primary' : 'trello-btn-secondary'}`}
                >
                    Members
                </button>
                <button
                    onClick={() => setView('teams')}
                    className={`trello-btn ${view === 'teams' ? 'trello-btn-primary' : 'trello-btn-secondary'}`}
                >
                    Teams
                </button>
                {invites.length > 0 && (
                    <button
                        onClick={() => setView('invites')}
                        className={`trello-btn ${view === 'invites' ? 'trello-btn-primary' : 'trello-btn-secondary'}`}
                    >
                        Pending Invites ({invites.length})
                    </button>
                )}
            </div>

            {/* Search */}
            {view === 'members' && (
                <div className="mb-6 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={16} />
                        <input
                            type="text"
                            placeholder="Search members..."
                            className="trello-input pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            {view === 'members' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMembers.map(member => (
                        <div key={member.id} className="bg-white border border-[#DFE1E6] rounded-sm p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#DFE1E6] flex items-center justify-center text-base font-semibold text-[#172B4D] shrink-0">
                                    {member.username[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-[#172B4D] truncate">{member.username}</h3>
                                    <p className="text-xs text-[#5E6C84] truncate">{member.email || 'No email'}</p>
                                    <div className="mt-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium text-white ${getRoleBadge(member.role)}`}>
                                            {member.role?.replace('_', ' ') || 'Employee'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {view === 'teams' && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-[#172B4D]">Teams</h2>
                        <button
                            onClick={() => setIsCreateTeamModalOpen(true)}
                            className="trello-btn trello-btn-primary"
                        >
                            <Plus size={16} />
                            <span>Create Team</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teams.map(team => (
                            <div
                                key={team.id}
                                onClick={() => { setSelectedTeam(team); setIsManageTeamModalOpen(true); }}
                                className="bg-white border border-[#DFE1E6] rounded-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-[#0079BF] rounded-sm flex items-center justify-center text-white">
                                        <Users size={20} />
                                    </div>
                                    <h3 className="text-base font-semibold text-[#172B4D]">{team.name}</h3>
                                </div>
                                <p className="text-sm text-[#5E6C84] mb-3 line-clamp-2">{team.description || 'No description'}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[#5E6C84]">{team.member_count || 0} members</span>
                                    <div className="flex -space-x-2">
                                        {team.members_details?.slice(0, 3).map((m, i) => (
                                            <div
                                                key={i}
                                                className="w-6 h-6 rounded-full bg-[#DFE1E6] border-2 border-white flex items-center justify-center text-[10px] font-semibold"
                                                title={m.username}
                                            >
                                                {m.username[0].toUpperCase()}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'invites' && (
                <div className="space-y-3">
                    {invites.map(invite => (
                        <div key={invite.id} className="bg-white border border-[#DFE1E6] rounded-sm p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-[#172B4D]">{invite.email}</p>
                                <p className="text-xs text-[#5E6C84]">Invited as {invite.role_name?.replace('_', ' ')}</p>
                            </div>
                            <span className="trello-badge bg-[#F2D600] text-[#172B4D]">Pending</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Manage Team Modal */}
            {isManageTeamModalOpen && selectedTeam && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 animate-fade-in" onClick={() => setIsManageTeamModalOpen(false)}>
                    <div className="trello-modal w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#DFE1E6]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-[#172B4D]">{selectedTeam.name}</h3>
                                <button onClick={() => setIsManageTeamModalOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded-sm">
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-sm text-[#5E6C84] mt-1">{selectedTeam.description}</p>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    className="trello-input"
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                {directory.filter(u => u.username.toLowerCase().includes(memberSearch.toLowerCase())).map(user => {
                                    const isMember = selectedTeam.members.includes(user.id);
                                    return (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-[#F4F5F7] rounded-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#DFE1E6] flex items-center justify-center text-xs font-semibold">
                                                    {user.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[#172B4D]">{user.username}</p>
                                                    <p className="text-xs text-[#5E6C84]">{user.role?.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleMember(selectedTeam, user.id)}
                                                className={`trello-btn ${isMember ? 'bg-[#EB5A46] text-white hover:bg-[#CF513D]' : 'trello-btn-primary'}`}
                                            >
                                                {isMember ? 'Remove' : 'Add'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#DFE1E6] flex justify-end gap-2">
                            <button onClick={() => deleteTeam(selectedTeam.id)} className="trello-btn bg-[#EB5A46] text-white hover:bg-[#CF513D]">
                                <Trash2 size={14} />
                                <span>Delete Team</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Team Modal */}
            {isCreateTeamModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 animate-fade-in" onClick={() => setIsCreateTeamModalOpen(false)}>
                    <div className="trello-modal w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleCreateTeam}>
                            <div className="p-6 border-b border-[#DFE1E6]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-[#172B4D]">Create Team</h3>
                                    <button type="button" onClick={() => setIsCreateTeamModalOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded-sm">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Team Name</label>
                                    <input type="text" required className="trello-input" placeholder="Engineering Team" value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <textarea className="trello-input min-h-[80px]" placeholder="Team description..." value={newTeam.description} onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })} />
                                </div>
                            </div>
                            <div className="p-6 border-t border-[#DFE1E6] flex justify-end gap-2">
                                <button type="button" onClick={() => setIsCreateTeamModalOpen(false)} className="trello-btn trello-btn-subtle">Cancel</button>
                                <button type="submit" className="trello-btn trello-btn-primary">Create Team</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 animate-fade-in" onClick={() => setIsInviteModalOpen(false)}>
                    <div className="trello-modal w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleInvite}>
                            <div className="p-6 border-b border-[#DFE1E6]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-[#172B4D]">Invite Member</h3>
                                    <button type="button" onClick={() => setIsInviteModalOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded-sm">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Email</label>
                                    <input type="email" required className="trello-input" placeholder="colleague@example.com" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Role</label>
                                    <select className="trello-input" value={inviteForm.role_name} onChange={(e) => setInviteForm({ ...inviteForm, role_name: e.target.value })}>
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="DEVELOPER">Developer</option>
                                        <option value="PROJECT_MANAGER">Project Manager</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 border-t border-[#DFE1E6] flex justify-end gap-2">
                                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="trello-btn trello-btn-subtle">Cancel</button>
                                <button type="submit" className="trello-btn trello-btn-primary">
                                    <Mail size={14} />
                                    <span>Send Invite</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
