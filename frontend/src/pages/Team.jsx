import { useState, useEffect } from 'react';
import { Mail, Shield, Search, User as UserIcon, MoreHorizontal } from 'lucide-react';
import api from '../services/api';

const Team = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users/list/');
                setUsers(response.data);
            } catch (error) {
                console.error('Failed to fetch team members', error);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const roleBadgeColor = (role) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'DEVELOPER': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PROJECT_MANAGER': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-zinc-100 text-zinc-600 border-zinc-200';
        }
    };

    return (
        <div className="layout-container p-6 animate-fade-in space-y-6">
            <header className="flex justify-between items-center pb-6 border-b border-zinc-200">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Team Directory</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage workspace members and permissions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn btn-secondary">Invite Member</button>
                    <button className="btn btn-primary">Export CSV</button>
                </div>
            </header>

            <div className="flex items-center mb-6">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="input-field pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Member</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {filteredUsers.map((member) => (
                            <tr key={member.id} className="group hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 font-bold text-xs">
                                            {member.profile_image ? (
                                                <img src={member.profile_image} alt={member.username} className="w-full h-full object-cover rounded" />
                                            ) : (
                                                member.username[0].toUpperCase()
                                            )}
                                        </div>
                                        <span className="font-medium text-zinc-900">{member.username}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${roleBadgeColor(member.role)}`}>
                                        {member.role || 'Unassigned'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-zinc-500 font-mono text-xs">
                                    {member.email}
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-xs text-zinc-600">Active</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button className="text-zinc-400 hover:text-zinc-600">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Team;
