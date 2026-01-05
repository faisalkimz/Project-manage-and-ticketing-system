import { useState, useEffect } from 'react';
import { User, Mail, Shield, Search, Filter } from 'lucide-react';
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

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in bg-slate-50/20 min-h-screen">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-3">
                        <Shield size={14} className="text-indigo-500" /> Human Capital
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Team Members</h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Manage permissions and view organizational roles.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Find member..."
                            className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 transition-all w-64 shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((member) => (
                    <div key={member.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 flex items-center gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 group-hover:scale-110 transition-transform">
                            <User size={80} />
                        </div>

                        <div className="w-20 h-20 rounded-2xl bg-slate-900 border-4 border-white shadow-xl flex items-center justify-center text-white text-xl font-black shrink-0 relative z-10">
                            {member.profile_image ? (
                                <img src={member.profile_image} alt={member.username} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                member.username[0].toUpperCase()
                            )}
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-slate-900 mb-1">{member.username}</h3>
                            <div className="flex items-center gap-2 text-xs font-medim text-slate-500 mb-3">
                                <Mail size={12} /> {member.email}
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${member.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    member.role === 'DEVELOPER' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        member.role === 'PROJECT_MANAGER' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            'bg-slate-50 text-slate-500 border-slate-100'
                                }`}>
                                {member.role || 'Unassigned'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Team;
