import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LayoutGrid, List, Search, Calendar, Folder, MoreHorizontal, ArrowRight } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', start_date: '', end_date: '' });
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects/projects/');
                setProjects(res.data);
            } catch (err) { console.error(err); }
        };
        fetchProjects();
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/projects/', newProject);
            setIsCreateModalOpen(false);
            window.location.reload();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="layout-container p-6 animate-fade-in space-y-6">
            <header className="flex justify-between items-end border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Projects</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage initiatives and track progress.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-zinc-100 p-0.5 rounded-lg flex items-center">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                    {user?.role !== 'EMPLOYEE' && (
                        <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
                            <Plus size={16} /> New Project
                        </button>
                    )}
                </div>
            </header>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <Link to={`/projects/${project.id}`} key={project.id} className="group card hover:border-zinc-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-48">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                        <Folder size={20} />
                                    </div>
                                    <span className="text-[10px] font-mono font-medium text-zinc-400 px-2 py-1 bg-zinc-50 rounded border border-zinc-100">
                                        {project.key || 'PRJ'}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-zinc-900 mb-1 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                                <p className="text-xs text-zinc-500 line-clamp-2">{project.description}</p>
                            </div>

                            <div className="pt-4 border-t border-zinc-50 flex items-center justify-between text-xs text-zinc-400 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${project.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-300'}`}></div>
                                    {project.status === 'ACTIVE' ? 'Active' : 'On Hold'}
                                </div>
                                <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1 text-zinc-300 group-hover:text-indigo-500">
                                    View <ArrowRight size={12} />
                                </span>
                            </div>
                        </Link>
                    ))}

                    {/* New Project Placeholder Card */}
                    {user?.role !== 'EMPLOYEE' && (
                        <button onClick={() => setIsCreateModalOpen(true)} className="border border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center h-48 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-all cursor-pointer">
                            <Plus size={32} strokeWidth={1.5} className="mb-2" />
                            <span className="text-sm font-medium">Create Project</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Project Name</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Lead</th>
                                <th className="px-6 py-3 font-medium text-right">Start Date</th>
                                <th className="px-6 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {projects.map(project => (
                                <tr key={project.id} className="hover:bg-zinc-50 group">
                                    <td className="px-6 py-3">
                                        <Link to={`/projects/${project.id}`} className="font-medium text-zinc-900 hover:text-indigo-600 block">
                                            {project.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${project.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                            }`}>
                                            {project.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-xs text-zinc-600">
                                        {project.created_by_username || 'System'}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-xs text-zinc-500">
                                        {project.start_date || '-'}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <Link to={`/projects/${project.id}`} className="text-zinc-400 hover:text-zinc-900">
                                            <ArrowRight size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h3 className="font-semibold text-zinc-900">Initialize Project</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
                        </div>
                        <form onSubmit={handleCreateProject} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Project Name</label>
                                <input type="text" required className="input-field" placeholder="e.g. Q1 Marketing Campaign"
                                    value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Description</label>
                                <textarea rows="3" className="input-field resize-none" placeholder="Goals and objectives..."
                                    value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Start Date</label>
                                    <input type="date" className="input-field"
                                        value={newProject.start_date} onChange={e => setNewProject({ ...newProject, start_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Target End Date</label>
                                    <input type="date" className="input-field"
                                        value={newProject.end_date} onChange={e => setNewProject({ ...newProject, end_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
