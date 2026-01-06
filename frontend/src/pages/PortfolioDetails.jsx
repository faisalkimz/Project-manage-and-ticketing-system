import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Layers, ArrowLeft, Calendar, User, Activity,
    PieChart, MoreHorizontal, Target, CheckCircle2, ChevronRight,
    X, Search, Check, Plus
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const PortfolioDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [availableProjects, setAvailableProjects] = useState([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState([]);
    const [projectSearch, setProjectSearch] = useState('');

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const res = await api.get(`/projects/portfolios/${id}/`);
                setPortfolio(res.data);
            } catch (error) {
                console.error("Failed to fetch portfolio", error);
                showToast("Failed to load portfolio details", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchPortfolio();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FAFBFC]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
            </div>
        );
    }

    if (!portfolio) {
        return (
            <div className="min-h-screen bg-[#FAFBFC] p-8 flex flex-col items-center justify-center text-center">
                <Layers size={64} className="text-[#DFE1E6] mb-4" />
                <h2 className="text-xl font-bold text-[#172B4D]">Portfolio Not Found</h2>
                <button
                    onClick={() => navigate('/portfolios')}
                    className="mt-4 text-[#0052CC] hover:underline font-medium"
                >
                    Return to Portfolios
                </button>
            </div>
        );
    }

    // Mock calculations since backend might not send these yet
    const health = portfolio.health || 'ON_TRACK';
    const progress = portfolio.progress || 0;
    const projectCount = portfolio.projects?.length || 0;

    const openLinkModal = async () => {
        console.log("Opening Link Modal");
        setIsLinkModalOpen(true);
        setSelectedProjectIds([]);
        try {
            const res = await api.get('/projects/');
            // Filter out projects already in this portfolio
            // Assuming portfolio.id is number/string matching params
            const currentId = parseInt(id);
            setAvailableProjects(res.data.filter(p => p.portfolio !== currentId));
        } catch (e) {
            showToast('Failed to fetch projects', 'error');
        }
    };

    const handleLinkSubmit = async () => {
        if (selectedProjectIds.length === 0) return;
        try {
            await api.post(`/projects/portfolios/${id}/link_projects/`, {
                project_ids: selectedProjectIds
            });
            showToast('Projects linked successfully', 'success');
            setIsLinkModalOpen(false);
            // Refresh
            const res = await api.get(`/projects/portfolios/${id}/`);
            setPortfolio(res.data);
        } catch (e) {
            showToast('Failed to link projects', 'error');
        }
    };

    const toggleProjectSelection = (pid) => {
        if (selectedProjectIds.includes(pid)) {
            setSelectedProjectIds(prev => prev.filter(id => id !== pid));
        } else {
            setSelectedProjectIds(prev => [...prev, pid]);
        }
    };

    const filteredProjects = availableProjects.filter(p =>
        p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
        (p.key && p.key.toLowerCase().includes(projectSearch.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#FAFBFC] p-6 lg:p-10 font-sans pb-24">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <button
                    onClick={() => navigate('/portfolios')}
                    className="flex items-center gap-2 text-[#5E6C84] hover:text-[#172B4D] mb-4 text-sm font-medium transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Portfolios
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white border border-[#DFE1E6] rounded-xl flex items-center justify-center text-[#0052CC] shadow-sm">
                            <Layers size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-[#172B4D]">{portfolio.name}</h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                                    Active
                                </span>
                            </div>
                            <p className="text-[#5E6C84] text-sm max-w-2xl">{portfolio.description || "No description provided."}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-white border border-[#DFE1E6] text-[#172B4D] font-bold rounded-lg hover:bg-[#F4F5F7] text-sm shadow-sm transition-all">
                            Generate Report
                        </button>
                        <button className="px-4 py-2 bg-[#0052CC] text-white font-bold rounded-lg hover:bg-[#0065FF] text-sm shadow-md transition-all">
                            Edit Portfolio
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Status Overview */}
                    <div className="bg-white border border-[#DFE1E6] rounded-xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wide mb-6 flex items-center gap-2">
                            <Activity size={16} /> Portfolio Health & Status
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="p-4 bg-[#FAFBFC] rounded-lg border border-[#DFE1E6]">
                                <span className="text-xs font-bold text-[#5E6C84] uppercase">Overall Progress</span>
                                <div className="flex items-end gap-2 mt-2">
                                    <span className="text-2xl font-black text-[#172B4D]">{progress}%</span>
                                    <span className="text-xs font-medium text-green-600 mb-1">Compete</span>
                                </div>
                                <div className="w-full bg-[#DFE1E6] h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-[#0052CC] h-full rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>

                            <div className="p-4 bg-[#FAFBFC] rounded-lg border border-[#DFE1E6]">
                                <span className="text-xs font-bold text-[#5E6C84] uppercase">Total Projects</span>
                                <div className="flex items-end gap-2 mt-2">
                                    <span className="text-2xl font-black text-[#172B4D]">{projectCount}</span>
                                    <span className="text-xs font-medium text-[#5E6C84] mb-1">Active Initiatives</span>
                                </div>
                            </div>

                            <div className="p-4 bg-[#FAFBFC] rounded-lg border border-[#DFE1E6]">
                                <span className="text-xs font-bold text-[#5E6C84] uppercase">Timeline</span>
                                <div className="flex items-end gap-2 mt-2">
                                    <span className="text-2xl font-black text-[#172B4D]">Q1</span>
                                    <span className="text-xs font-medium text-[#5E6C84] mb-1">Fiscal Year 2026</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Associated Projects */}
                    <div className="bg-white border border-[#DFE1E6] rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-[#DFE1E6] flex justify-between items-center bg-[#FAFBFC]">
                            <h3 className="text-sm font-bold text-[#172B4D] uppercase tracking-wide flex items-center gap-2">
                                <Target size={16} /> Associated Projects
                            </h3>
                            <button className="text-xs font-bold text-[#0052CC] hover:underline">View All Projects</button>
                        </div>

                        {portfolio.projects && portfolio.projects.length > 0 ? (
                            <div className="divide-y divide-[#DFE1E6]">
                                {portfolio.projects.map((proj, idx) => (
                                    <div key={idx} className="p-4 hover:bg-[#F4F5F7] transition-colors flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded bg-[#EAE6FF] text-[#403294] flex items-center justify-center font-bold text-sm">
                                                {proj.name ? proj.name[0] : 'P'}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">
                                                    {proj.name || `Project ID: ${proj}`}
                                                </h4>
                                                <p className="text-xs text-[#5E6C84]">Status: Active • Lead: Unassigned</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <span className="block text-xs font-bold text-[#172B4D]">0%</span>
                                                <span className="text-[10px] text-[#5E6C84] uppercase">Done</span>
                                            </div>
                                            <ChevronRight size={16} className="text-[#DFE1E6] group-hover:text-[#0052CC]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-[#5E6C84]">
                                <PieChart size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No projects are currently linked to this portfolio.</p>
                                <button
                                    onClick={openLinkModal}
                                    className="mt-4 px-4 py-2 border border-[#DFE1E6] rounded text-xs font-bold text-[#172B4D] hover:bg-[#F4F5F7]"
                                >
                                    Link Existing Projects
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <div className="bg-white border border-[#DFE1E6] rounded-xl p-6 shadow-sm">
                        <h4 className="text-xs font-bold text-[#5E6C84] uppercase mb-4">Portfolio Owner</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0052CC] text-white flex items-center justify-center font-bold text-xs border-2 border-white ring-1 ring-[#DFE1E6]">
                                {portfolio.owner_details ? portfolio.owner_details.username[0].toUpperCase() : 'A'}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#172B4D]">
                                    {portfolio.owner_details ? portfolio.owner_details.username : 'Admin User'}
                                </p>
                                <p className="text-xs text-[#5E6C84]">Portfolio Manager</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#E3FCEF] border border-[#ABF5D1] rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 size={20} className="text-[#006644] mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-[#006644] mb-1">On Track</h4>
                                <p className="text-xs text-[#006644]/80 leading-relaxed">
                                    All initiatives within this portfolio are currently meeting their projected milestones for Q1.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Link Projects Modal */}
            {
                isLinkModalOpen && (
                    <div className="fixed inset-0 z-[200] bg-[#091E42]/50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-4 border-b border-[#DFE1E6] flex justify-between items-center bg-[#F4F5F7]">
                                <h3 className="text-sm font-bold text-[#172B4D]">Link Projects to Portfolio</h3>
                                <button onClick={() => setIsLinkModalOpen(false)} className="text-[#5E6C84] hover:text-[#172B4D]"><X size={20} /></button>
                            </div>

                            <div className="p-4 border-b border-[#DFE1E6]">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" />
                                    <input
                                        type="text"
                                        placeholder="Search projects by name or key..."
                                        className="w-full pl-9 pr-4 py-2 border border-[#DFE1E6] rounded-lg text-sm focus:border-[#0052CC] outline-none"
                                        value={projectSearch}
                                        onChange={e => setProjectSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                {filteredProjects.length === 0 ? (
                                    <div className="text-center py-8 text-[#5E6C84] text-sm">No projects found.</div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredProjects.map(proj => {
                                            const isSelected = selectedProjectIds.includes(proj.id);
                                            return (
                                                <div
                                                    key={proj.id}
                                                    onClick={() => toggleProjectSelection(proj.id)}
                                                    className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-[#E6EFFC] border border-[#B3D4FF]' : 'hover:bg-[#F4F5F7] border border-transparent'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#0052CC] border-[#0052CC] text-white' : 'bg-white border-[#DFE1E6] text-transparent'}`}>
                                                        <Check size={14} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-bold text-[#172B4D]">{proj.name}</h4>
                                                        <p className="text-xs text-[#5E6C84]">
                                                            {proj.key} • {proj.portfolio ? 'Reassigning from other portfolio' : 'No Portfolio'}
                                                        </p>
                                                    </div>
                                                    {proj.portfolio && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">Transfer</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-[#DFE1E6] bg-[#F4F5F7] flex justify-end gap-3">
                                <button onClick={() => setIsLinkModalOpen(false)} className="px-4 py-2 border border-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] hover:bg-[#EAECEF]">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLinkSubmit}
                                    disabled={selectedProjectIds.length === 0}
                                    className="px-4 py-2 bg-[#0052CC] text-white rounded text-sm font-bold hover:bg-[#0065FF] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Link {selectedProjectIds.length > 0 ? `${selectedProjectIds.length} Projects` : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PortfolioDetails;
