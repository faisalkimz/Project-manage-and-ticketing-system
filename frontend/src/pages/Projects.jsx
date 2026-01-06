import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Search, Star, Users, X, Briefcase, CheckCircle2,
    Clock, Tag, Copy, Archive, Layers, Shield
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Projects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '', description: '', start_date: '', end_date: '',
        category: '', visibility: 'TEAM_ONLY', is_template: false, parent_project: ''
    });
    const { user } = useAuthStore();

    const fetchData = async () => {
        try {
            const [projRes, catRes] = await Promise.all([
                api.get('/projects/projects/'),
                api.get('/projects/categories/')
            ]);
            setProjects(projRes.data);
            setCategories(catRes.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/projects/', newProject);
            setIsCreateModalOpen(false);
            setNewProject({
                name: '', description: '', start_date: '', end_date: '',
                category: '', visibility: 'TEAM_ONLY', is_template: false, parent_project: ''
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleToggleStar = async (e, projectId) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();
        try {
            const res = await api.post(`/projects/projects/${projectId}/toggle_star/`);
            // Update local state
            setProjects(projects.map(p =>
                p.id === projectId ? { ...p, is_starred: res.data.is_starred } : p
            ));
            // Dispatch event for Sidebar
            window.dispatchEvent(new Event('projectStarred'));
        } catch (err) { console.error('Failed to toggle star', err); }
    };

    const filteredProjects = projects.filter(p =>
        (p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.key && p.key.toLowerCase().includes(search.toLowerCase()))) && !p.is_template && p.status !== 'COMPLETED'
    );

    const templates = projects.filter(p => p.is_template);
    const archived = projects.filter(p => p.status === 'COMPLETED');

    const boardColors = [
        { from: '#0079BF', to: '#026AA7' },
        { from: '#61BD4F', to: '#519839' },
        { from: '#FF9F1A', to: '#E79015' },
        { from: '#EB5A46', to: '#CF513D' },
        { from: '#C377E0', to: '#A86CC1' },
    ];

    const ProjectCard = ({ project, index }) => {
        const color = boardColors[index % boardColors.length];
        return (
            <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group relative rounded-sm shadow-sm hover:shadow-md transition-all min-h-[96px] p-4 flex flex-col justify-between overflow-hidden"
                style={{
                    background: project.background_color ? project.background_color : `linear-gradient(135deg, ${color.from} 0%, ${color.to} 100%)`
                }}
            >
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-semibold text-base truncate pr-6">{project.name}</h3>
                        <div className="flex items-center gap-1">
                            {project.visibility === 'PRIVATE' && <Shield size={12} className="text-white/80" />}
                            <button
                                onClick={(e) => handleToggleStar(e, project.id)}
                                className="p-1 hover:bg-white/20 rounded transition-all"
                                title={project.is_starred ? 'Unstar' : 'Star'}
                            >
                                <Star
                                    size={14}
                                    className={project.is_starred ? 'fill-amber-300 text-amber-300' : 'text-white/60 hover:text-white'}
                                />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80">{project.key}</span>
                        <div className="flex -space-x-1">
                            {project.members_details?.slice(0, 3).map((m, i) => (
                                <div
                                    key={i}
                                    className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center justify-center text-[10px] font-semibold"
                                    title={m.username}
                                >
                                    {m.username[0].toUpperCase()}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {project.category_details && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/20 text-white text-[10px] font-medium w-fit">
                        <Tag size={10} />
                        {project.category_details.name}
                    </div>
                )}
                {project.task_stats?.percentage > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
                        <div
                            className="h-full bg-white/60 transition-all duration-500"
                            style={{ width: `${project.task_stats.percentage}%` }}
                        />
                    </div>
                )}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-[#FAFBFC] p-4 md:p-6 pb-24 md:pb-6">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-[#172B4D] mb-1">Workspace Boards</h1>
                    <p className="text-sm text-[#5E6C84]">Manage projects, templates and portfolios</p>
                </div>
                <div className="flex gap-2">
                    {user?.role !== 'EMPLOYEE' && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="trello-btn trello-btn-primary w-full sm:w-auto"
                        >
                            <Plus size={16} />
                            <span>Create board</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Search Bar */}
            <div className="mb-8 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={16} />
                    <input
                        type="text"
                        placeholder="Search workspace..."
                        className="trello-input pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Active Boards Section */}
            <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <Layers size={18} className="text-[#0052CC]" />
                    <h2 className="text-base font-bold text-[#172B4D]">Active Projects</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredProjects.map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} />
                    ))}

                    {/* Create New Board Card */}
                    {user?.role !== 'EMPLOYEE' && !search && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="border-2 border-dashed border-[#DFE1E6] rounded-sm p-4 hover:bg-[#F4F5F7] transition-colors min-h-[96px] flex flex-col items-center justify-center gap-2 group"
                        >
                            <Plus size={24} className="text-[#5E6C84] group-hover:text-[#172B4D]" />
                            <span className="text-sm font-medium text-[#5E6C84] group-hover:text-[#172B4D]">
                                Create board
                            </span>
                        </button>
                    )}
                </div>
                {filteredProjects.length === 0 && search && (
                    <p className="text-sm text-[#5E6C84] italic">No active projects match your search.</p>
                )}
            </section>

            {/* Templates Section */}
            {templates.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Copy size={18} className="text-[#0052CC]" />
                        <h2 className="text-base font-bold text-[#172B4D]">Templates</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-80 hover:opacity-100 transition-opacity">
                        {templates.map((tpl, index) => (
                            <ProjectCard key={tpl.id} project={tpl} index={index + 10} />
                        ))}
                    </div>
                </section>
            )}

            {/* Archived Boards */}
            {archived.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Archive size={18} className="text-[#5E6C84]" />
                        <h2 className="text-base font-bold text-[#5E6C84]">Archived</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                        {archived.map((arc, index) => (
                            <ProjectCard key={arc.id} project={arc} index={index + 20} />
                        ))}
                    </div>
                </section>
            )}

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 md:p-6 animate-fade-in" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleCreateProject}>
                            <div className="p-6 border-b border-[#DFE1E6] flex items-center justify-between sticky top-0 bg-white z-10">
                                <h3 className="text-xl font-bold text-[#172B4D]">New Project</h3>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={20} /></button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Title</label>
                                            <input
                                                type="text" required autoFocus className="trello-input"
                                                placeholder="e.g. Q1 Marketing Campaign"
                                                value={newProject.name}
                                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Category</label>
                                            <select
                                                className="trello-input h-10 px-2"
                                                value={newProject.category}
                                                onChange={e => setNewProject({ ...newProject, category: e.target.value })}
                                            >
                                                <option value="">No Category</option>
                                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Visibility</label>
                                            <select
                                                className="trello-input h-10 px-2"
                                                value={newProject.visibility}
                                                onChange={e => setNewProject({ ...newProject, visibility: e.target.value })}
                                            >
                                                <option value="TEAM_ONLY">Team Only</option>
                                                <option value="PUBLIC">Public</option>
                                                <option value="PRIVATE">Private</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-3 pt-6">
                                            <input
                                                type="checkbox" id="is_template" className="w-4 h-4 rounded border-[#DFE1E6]"
                                                checked={newProject.is_template}
                                                onChange={e => setNewProject({ ...newProject, is_template: e.target.checked })}
                                            />
                                            <label htmlFor="is_template" className="text-sm font-medium text-[#172B4D]">Save as template</label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                                    <textarea
                                        className="trello-input min-h-[100px] py-2"
                                        placeholder="Outline the project goals and scope..."
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Start Date</label>
                                        <input
                                            type="date" className="trello-input"
                                            value={newProject.start_date}
                                            onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">End Date</label>
                                        <input
                                            type="date" className="trello-input"
                                            value={newProject.end_date}
                                            onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Parent Project (Optional)</label>
                                    <select
                                        className="trello-input h-10 px-2"
                                        value={newProject.parent_project}
                                        onChange={e => setNewProject({ ...newProject, parent_project: e.target.value })}
                                    >
                                        <option value="">None (Top-level Project)</option>
                                        {projects.filter(p => !p.is_template).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 border-t border-[#DFE1E6] flex justify-end gap-3 bg-[#FAFBFC]">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="trello-btn trello-btn-subtle px-6">Cancel</button>
                                <button type="submit" className="trello-btn trello-btn-primary px-8">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
