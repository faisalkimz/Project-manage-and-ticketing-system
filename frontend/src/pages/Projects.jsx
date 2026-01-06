import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Star, Users, X, Briefcase, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Projects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', start_date: '', end_date: '' });
    const { user } = useAuthStore();

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects/projects/');
            setProjects(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/projects/', newProject);
            setIsCreateModalOpen(false);
            setNewProject({ name: '', description: '', start_date: '', end_date: '' });
            fetchProjects();
        } catch (err) { console.error(err); }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.key && p.key.toLowerCase().includes(search.toLowerCase()))
    );

    const boardColors = [
        { from: '#0079BF', to: '#026AA7' },
        { from: '#61BD4F', to: '#519839' },
        { from: '#FF9F1A', to: '#E79015' },
        { from: '#EB5A46', to: '#CF513D' },
        { from: '#C377E0', to: '#A86CC1' },
        { from: '#00C2E0', to: '#00AECC' },
    ];

    return (
        <div className="min-h-screen bg-[#FAFBFC] p-6">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-[#172B4D] mb-1">Your Boards</h1>
                    <p className="text-sm text-[#5E6C84]">Organize and manage all your projects</p>
                </div>
                {user?.role !== 'EMPLOYEE' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="trello-btn trello-btn-primary"
                    >
                        <Plus size={16} />
                        <span>Create new board</span>
                    </button>
                )}
            </header>

            {/* Search Bar */}
            <div className="mb-8 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={16} />
                    <input
                        type="text"
                        placeholder="Search boards..."
                        className="trello-input pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Starred Boards Section */}
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Star size={16} className="text-[#F2D600]" fill="#F2D600" />
                    <h2 className="text-base font-semibold text-[#172B4D]">Starred Boards</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredProjects.slice(0, 4).map((project, index) => {
                        const color = boardColors[index % boardColors.length];
                        return (
                            <Link
                                key={project.id}
                                to={`/projects/${project.id}`}
                                className="group relative rounded-sm shadow-sm hover:shadow-md transition-all min-h-[96px] p-4 flex flex-col justify-between overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${color.from} 0%, ${color.to} 100%)`
                                }}
                            >
                                <div className="relative z-10">
                                    <h3 className="text-white font-semibold text-base mb-1">{project.name}</h3>
                                    <span className="text-xs text-white/80">{project.key}</span>
                                </div>
                                <button className="absolute top-2 right-2 p-1 hover:bg-[rgba(0,0,0,0.1)] rounded-sm transition-colors opacity-0 group-hover:opacity-100">
                                    <Star size={14} className="text-white" />
                                </button>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* All Boards Section */}
            <section>
                <h2 className="text-base font-semibold text-[#172B4D] mb-4">All Boards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredProjects.map((project, index) => {
                        const color = boardColors[index % boardColors.length];
                        return (
                            <Link
                                key={project.id}
                                to={`/projects/${project.id}`}
                                className="group relative rounded-sm shadow-sm hover:shadow-md transition-all min-h-[96px] p-4 flex flex-col justify-between overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${color.from} 0%, ${color.to} 100%)`
                                }}
                            >
                                <div className="relative z-10">
                                    <h3 className="text-white font-semibold text-base mb-2">{project.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/80">{project.key}</span>
                                        <div className="flex -space-x-1">
                                            {project.members_details?.slice(0, 3).map((m, i) => (
                                                <div
                                                    key={i}
                                                    className="w-6 h-6 rounded-full bg-white text-[#172B4D] border border-white flex items-center justify-center text-[10px] font-semibold"
                                                    title={m.username}
                                                >
                                                    {m.username[0].toUpperCase()}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {project.task_stats?.percentage > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[rgba(0,0,0,0.2)]">
                                        <div
                                            className="h-full bg-white/80"
                                            style={{ width: `${project.task_stats.percentage}%` }}
                                        />
                                    </div>
                                )}
                            </Link>
                        );
                    })}

                    {/* Create New Board Card */}
                    {user?.role !== 'EMPLOYEE' && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="border-2 border-dashed border-[#DFE1E6] rounded-sm p-4 hover:bg-[#F4F5F7] transition-colors min-h-[96px] flex flex-col items-center justify-center gap-2 group"
                        >
                            <Plus size={24} className="text-[#5E6C84] group-hover:text-[#172B4D]" />
                            <span className="text-sm font-medium text-[#5E6C84] group-hover:text-[#172B4D]">
                                Create new board
                            </span>
                        </button>
                    )}
                </div>

                {filteredProjects.length === 0 && (
                    <div className="border-2 border-dashed border-[#DFE1E6] rounded-sm p-12 text-center">
                        <Briefcase size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                        <p className="text-[#5E6C84] mb-2">No boards found</p>
                        <p className="text-sm text-[#8993A4]">Create your first board to get started</p>
                    </div>
                )}
            </section>

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 animate-fade-in"
                    onClick={() => setIsCreateModalOpen(false)}
                >
                    <div className="trello-modal w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleCreateProject}>
                            <div className="p-6 border-b border-[#DFE1E6]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-[#172B4D]">Create Board</h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="p-1 hover:bg-[#EBECF0] rounded-sm text-[#5E6C84] transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">
                                        Board Title
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        className="trello-input"
                                        placeholder="e.g. Marketing Plan"
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        className="trello-input min-h-[80px]"
                                        placeholder="What is this board about?"
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            className="trello-input"
                                            value={newProject.start_date}
                                            onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            className="trello-input"
                                            value={newProject.end_date}
                                            onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-[#DFE1E6] flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="trello-btn trello-btn-subtle"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="trello-btn trello-btn-primary">
                                    Create Board
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
