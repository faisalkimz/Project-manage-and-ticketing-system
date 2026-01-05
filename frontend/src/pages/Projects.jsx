import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder, Calendar, User, MoreVertical, Hash, ArrowRight, LayoutGrid, List, Search, Filter } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', start_date: new Date().toISOString().split('T')[0] });
    const { user } = useAuthStore();

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects/projects/');
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to fetch projects', error);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/projects/', newProject);
            setIsModalOpen(false);
            setNewProject({ name: '', description: '', start_date: new Date().toISOString().split('T')[0] });
            fetchProjects();
        } catch (error) {
            console.error('Failed to create project', error);
        }
    };

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in bg-slate-50/20 min-h-screen font-display">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-3">
                        <Hash size={14} strokeWidth={3} className="text-indigo-400" /> Organizational Workspaces
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Projects</h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Monitoring {projects.length} strategic initiatives across the organization.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <button className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl transition-all"><LayoutGrid size={18} /></button>
                        <button className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl transition-all"><List size={18} /></button>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-8 py-3.5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                        <Plus size={20} strokeWidth={3} /> Launch Workspace
                    </button>
                </div>
            </header>

            <div className="flex items-center justify-between py-4 border-y border-slate-100">
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <button className="text-slate-900 border-b-2 border-indigo-600 pb-1">All Projects</button>
                    <button className="hover:text-slate-600 transition-colors">Shared With Me</button>
                    <button className="hover:text-slate-600 transition-colors">Archived</button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input type="text" placeholder="Filter workspaces..." className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:border-indigo-300 transition-all w-48 shadow-sm" />
                    </div>
                    <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 shadow-sm transition-all"><Filter size={18} /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                {projects.map((project) => (
                    <div key={project.id} className="group card bg-white border-slate-100 rounded-[2.5rem] p-8 flex flex-col hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-500 border-t-4 border-t-indigo-500 hover:border-t-indigo-600 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <Folder size={120} strokeWidth={1} />
                        </div>

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-100/50 border border-indigo-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                <Folder size={28} strokeWidth={2.5} />
                            </div>
                            <button className="p-2 text-slate-200 hover:text-slate-900 transition-colors bg-slate-50/50 rounded-xl border border-transparent hover:border-slate-100">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        <Link to={`/projects/${project.id}`} className="block flex-1 mb-10 relative z-10">
                            <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors tracking-tight leading-short">{project.name}</h3>
                            <p className="text-slate-400 text-sm font-medium line-clamp-3 leading-relaxed min-h-[4.5rem]">{project.description || "Experimental intelligence workspace focusing on strategic development and cross-functional operational excellence."}</p>
                        </Link>

                        <div className="space-y-4 mb-10 pt-8 border-t border-slate-50 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                    <Calendar size={14} strokeWidth={3} className="text-indigo-400" /> Deployment
                                </div>
                                <span className="text-xs font-black text-slate-900">{new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                    <User size={14} strokeWidth={3} className="text-amber-400" /> Authority
                                </div>
                                <span className="text-xs font-black text-slate-900">{project.created_by_details?.username}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
                            <div className="flex -space-x-3">
                                {project.members_details?.slice(0, 3).map((member, i) => (
                                    <div key={i} className="w-10 h-10 rounded-[1rem] bg-slate-900 border-4 border-white flex items-center justify-center text-[10px] font-black text-white shadow-xl ring-1 ring-slate-100 group-hover:translate-x-1 transition-all" title={member.username}>
                                        {member.username[0].toUpperCase()}
                                    </div>
                                ))}
                                {project.members_details?.length > 3 && (
                                    <div className="w-10 h-10 rounded-[1rem] bg-indigo-50 border-4 border-white flex items-center justify-center text-[10px] font-black text-indigo-400 shadow-xl ring-1 ring-slate-100">
                                        +{project.members_details.length - 3}
                                    </div>
                                )}
                                {(!project.members_details || project.members_details.length === 0) && (
                                    <div className="w-10 h-10 rounded-[1rem] bg-slate-50 border-4 border-white flex items-center justify-center text-slate-300 shadow-sm ring-1 ring-slate-100">
                                        <Plus size={14} />
                                    </div>
                                )}
                            </div>
                            <Link to={`/projects/${project.id}`} className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:scale-110 active:scale-95 transition-all">
                                <ArrowRight size={22} strokeWidth={3} />
                            </Link>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-32 flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner">
                            <Folder size={48} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-slate-900 mb-2">Workspace library is empty</h3>
                            <p className="text-slate-400 font-medium">Create your first strategic project to begin operations.</p>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Launch Initial Project</button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-slide-up">
                        <div className="p-12 border-b border-slate-50 bg-slate-50/50">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">Initialize Project</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Deployment starts immediately upon execution.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-12 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Workspace Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-2xl py-4 px-6 text-sm font-bold shadow-sm transition-all outline-none"
                                    placeholder="e.g. Project Phoenix"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Objective</label>
                                <textarea
                                    className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-3xl py-4 px-6 text-sm font-medium shadow-sm transition-all outline-none min-h-[120px] resize-none"
                                    placeholder="Define the scope and goals..."
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Launch Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest outline-none shadow-sm cursor-pointer"
                                    value={newProject.start_date}
                                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-4 pt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Authorize Deployment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx="true">{`
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};

export default Projects;
