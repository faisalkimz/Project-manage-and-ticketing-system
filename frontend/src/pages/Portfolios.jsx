import { useState, useEffect } from 'react';
import {
    Briefcase, Plus, Search, ChevronRight, Activity,
    Layers, PieChart, Users, Calendar, Target, MoreHorizontal, X,
    TrendingUp, AlertTriangle, CheckCircle2, BarChart2
} from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';

const Portfolios = () => {
    const { showToast } = useToast();
    const [portfolios, setPortfolios] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('portfolios');
    const [showPortModal, setShowPortModal] = useState(false);
    const [showProgModal, setShowProgModal] = useState(false);
    const [newPort, setNewPort] = useState({ name: '', description: '' });
    const [newProg, setNewProg] = useState({ name: '', description: '', portfolio: '' });

    const fetchData = async () => {
        try {
            const [portRes, progRes, projRes] = await Promise.all([
                api.get('/projects/portfolios/'),
                api.get('/projects/programs/'),
                api.get('/projects/projects/'),
            ]);
            setPortfolios(portRes.data?.results || portRes.data || []);
            setPrograms(progRes.data?.results || progRes.data || []);
            setProjects(projRes.data?.results || projRes.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreatePortfolio = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/portfolios/', newPort);
            setNewPort({ name: '', description: '' });
            setShowPortModal(false);
            fetchData();
            showToast('Portfolio created!', 'success');
        } catch (err) { showToast('Failed to create portfolio', 'error'); }
    };

    const handleCreateProgram = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/programs/', newProg);
            setNewProg({ name: '', description: '', portfolio: '' });
            setShowProgModal(false);
            fetchData();
            showToast('Program created!', 'success');
        } catch (err) { showToast('Failed to create program', 'error'); }
    };

    const filteredPortfolios = portfolios.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    const filteredPrograms = programs.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    // Analytics helpers
    const healthMap = { ON_TRACK: 'Healthy', AT_RISK: 'At Risk', OFF_TRACK: 'Off Track', COMPLETED: 'Done' };
    const healthColor = {
        ON_TRACK: 'bg-green-100 text-green-700',
        AT_RISK: 'bg-amber-100 text-amber-700',
        OFF_TRACK: 'bg-red-100 text-red-700',
        COMPLETED: 'bg-blue-100 text-blue-700'
    };

    const totalTasks = projects.reduce((s, p) => s + (p.task_count || 0), 0);
    const healthCounts = projects.reduce((acc, p) => {
        const h = p.health_status || 'ON_TRACK';
        acc[h] = (acc[h] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-[#F4F5F7] p-4 md:p-8 pb-24 md:pb-8 font-sans overflow-x-hidden">
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-[#5E6C84] mb-1">
                            <Briefcase size={16} />
                            <span className="text-sm font-semibold uppercase tracking-wider">Strategy</span>
                        </div>
                        <h1 className="text-2xl font-bold text-[#172B4D]">Portfolio & Programs</h1>
                        <p className="text-[#5E6C84]">High-level overview of your organization's initiatives</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 mt-8 bg-white p-1 rounded-lg border border-[#DFE1E6] w-fit shadow-sm overflow-x-auto max-w-full">
                    {['portfolios', 'programs', 'analytics', 'cross-view'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#0052CC] text-white shadow-md' : 'text-[#5E6C84] hover:bg-[#F4F5F7]'}`}
                        >
                            {tab === 'cross-view' ? 'Cross-Project View' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {(activeTab === 'portfolios' || activeTab === 'programs') && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                        <div className="relative w-full md:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={16} />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-[#DFE1E6] rounded-md outline-none focus:border-[#0052CC] transition-colors shadow-sm"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        {activeTab === 'portfolios' && (
                            <button onClick={() => setShowPortModal(true)} className="w-full md:w-auto bg-[#0052CC] text-white px-4 py-2 rounded-md font-bold hover:bg-[#0065FF] transition-all flex items-center justify-center gap-2 shadow-md">
                                <Plus size={18} /> New Portfolio
                            </button>
                        )}
                        {activeTab === 'programs' && (
                            <button onClick={() => setShowProgModal(true)} className="w-full md:w-auto bg-[#0052CC] text-white px-4 py-2 rounded-md font-bold hover:bg-[#0065FF] transition-all flex items-center justify-center gap-2 shadow-md">
                                <Plus size={18} /> New Program
                            </button>
                        )}
                    </div>
                )}

                {/* ── PORTFOLIOS TAB ── */}
                {activeTab === 'portfolios' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredPortfolios.length > 0 ? filteredPortfolios.map(portfolio => (
                            <div key={portfolio.id} className="bg-white rounded-xl shadow-sm border border-[#DFE1E6] overflow-hidden hover:shadow-md transition-all group">
                                <div className="p-6 border-b border-[#DFE1E6]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 rounded-lg bg-[#DEEBFF] text-[#0052CC]"><Briefcase size={20} /></div>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#172B4D] mb-2">{portfolio.name}</h3>
                                    <p className="text-sm text-[#5E6C84] line-clamp-2 mb-4">{portfolio.description || 'No description provided.'}</p>
                                    <div className="flex items-center gap-4 py-3 bg-[#F4F5F7] rounded-lg px-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Projects</span>
                                            <span className="text-sm font-bold text-[#172B4D]">{portfolio.projects?.length || 0}</span>
                                        </div>
                                        <div className="h-8 w-px bg-[#DFE1E6]"></div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Owner</span>
                                            <span className="text-sm font-bold text-[#172B4D]">{portfolio.owner_details?.username || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-[#FAFBFC] flex items-center justify-end">
                                    <Link to={`/portfolios/${portfolio.id}`} className="flex items-center gap-1 text-[#0052CC] text-sm font-bold hover:underline">
                                        View Details <ChevronRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="lg:col-span-2 py-16 text-center bg-white rounded-xl border border-dashed border-[#DFE1E6]">
                                <Layers size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                                <h3 className="text-lg font-bold text-[#172B4D]">No Portfolios Defined</h3>
                                <p className="text-[#5E6C84] mb-6 max-w-sm mx-auto">Group projects into portfolios for strategic alignment.</p>
                                <button onClick={() => setShowPortModal(true)} className="bg-[#0052CC] text-white px-8 py-2.5 rounded-md font-bold hover:bg-[#0065FF] transition-all">Create Portfolio</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── PROGRAMS TAB ── */}
                {activeTab === 'programs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPrograms.length > 0 ? filteredPrograms.map(program => (
                            <div key={program.id} className="bg-white rounded-xl shadow-sm border border-[#DFE1E6] overflow-hidden hover:border-[#0052CC] transition-all group p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 rounded bg-[#EAE6FF] text-[#403294]"><Target size={18} /></div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAE6FF] text-[#403294] uppercase">Program</span>
                                </div>
                                <h3 className="font-bold text-[#172B4D] mb-1 group-hover:text-[#0052CC] transition-colors">{program.name}</h3>
                                <p className="text-xs text-[#5E6C84] line-clamp-2 mb-4">{program.description || 'No description.'}</p>
                                <div className="flex items-center justify-between pt-2 border-t border-[#DFE1E6]">
                                    <div className="flex items-center gap-1.5 text-xs text-[#5E6C84]">
                                        <Layers size={12} />
                                        <span>{program.projects?.length || 0} Projects</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="md:col-span-2 lg:col-span-3 py-16 text-center bg-white rounded-xl border border-dashed border-[#DFE1E6]">
                                <PieChart size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                                <h3 className="text-lg font-bold text-[#172B4D]">No Programs Yet</h3>
                                <p className="text-[#5E6C84] mb-6 max-w-sm mx-auto">Programs connect related projects to achieve shared goals.</p>
                                <button onClick={() => setShowProgModal(true)} className="bg-[#0052CC] text-white px-8 py-2.5 rounded-md font-bold hover:bg-[#0065FF] transition-all">Initialize Program</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── ANALYTICS TAB ── */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* KPI Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Projects', value: projects.length, icon: <Briefcase size={18} />, color: 'bg-blue-50 text-blue-600' },
                                { label: 'Portfolios', value: portfolios.length, icon: <Layers size={18} />, color: 'bg-purple-50 text-purple-600' },
                                { label: 'Programs', value: programs.length, icon: <Target size={18} />, color: 'bg-amber-50 text-amber-600' },
                                { label: 'Total Tasks', value: totalTasks, icon: <CheckCircle2 size={18} />, color: 'bg-green-50 text-green-600' },
                            ].map((kpi, i) => (
                                <div key={i} className="bg-white rounded-xl border border-[#DFE1E6] p-5 shadow-sm">
                                    <div className={`w-9 h-9 rounded-lg ${kpi.color} flex items-center justify-center mb-3`}>{kpi.icon}</div>
                                    <p className="text-2xl font-bold text-[#172B4D]">{kpi.value}</p>
                                    <p className="text-xs text-[#5E6C84] font-medium mt-0.5">{kpi.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Project Health Matrix */}
                        <div className="bg-white rounded-xl border border-[#DFE1E6] shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-[#DFE1E6] flex items-center gap-3">
                                <BarChart2 size={18} className="text-[#0052CC]" />
                                <div>
                                    <h3 className="font-bold text-[#172B4D]">Project Health Matrix</h3>
                                    <p className="text-xs text-[#5E6C84]">Real-time health across all active projects</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#DFE1E6] border-b border-[#DFE1E6]">
                                {[
                                    { label: 'On Track', count: healthCounts['ON_TRACK'] || 0, color: 'text-green-600', bg: 'bg-green-50' },
                                    { label: 'At Risk', count: healthCounts['AT_RISK'] || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
                                    { label: 'Off Track', count: healthCounts['OFF_TRACK'] || 0, color: 'text-red-600', bg: 'bg-red-50' },
                                    { label: 'Completed', count: healthCounts['COMPLETED'] || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                                ].map((h, i) => (
                                    <div key={i} className={`p-5 ${h.bg}`}>
                                        <p className={`text-3xl font-bold ${h.color}`}>{h.count}</p>
                                        <p className="text-xs font-medium text-[#5E6C84] mt-1">{h.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                                        <tr>
                                            {['Project', 'Health', 'Tasks', 'Portfolio', 'Status'].map(h => (
                                                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#DFE1E6]">
                                        {projects.length > 0 ? projects.map(proj => (
                                            <tr key={proj.id} className="hover:bg-[#F4F5F7] transition-colors">
                                                <td className="px-5 py-3 text-sm font-bold text-[#172B4D]">{proj.name}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${healthColor[proj.health_status] || 'bg-gray-100 text-gray-600'}`}>
                                                        {healthMap[proj.health_status] || 'On Track'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-sm text-[#5E6C84]">{proj.task_count || 0}</td>
                                                <td className="px-5 py-3 text-sm text-[#5E6C84]">{portfolios.find(p => p.projects?.includes(proj.id))?.name || '—'}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${proj.is_archived ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                                                        {proj.is_archived ? 'Archived' : 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" className="px-5 py-10 text-center text-[#5E6C84]">No projects found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Portfolio Distribution */}
                        <div className="bg-white rounded-xl border border-[#DFE1E6] shadow-sm p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <Users size={18} className="text-[#0052CC]" />
                                <div>
                                    <h3 className="font-bold text-[#172B4D]">Portfolio Distribution</h3>
                                    <p className="text-xs text-[#5E6C84]">Projects per portfolio</p>
                                </div>
                            </div>
                            {portfolios.length > 0 ? (
                                <div className="space-y-3">
                                    {portfolios.map(port => {
                                        const count = port.projects?.length || 0;
                                        const pct = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0;
                                        return (
                                            <div key={port.id}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-[#172B4D]">{port.name}</span>
                                                    <span className="text-xs text-[#5E6C84]">{count} projects ({pct}%)</span>
                                                </div>
                                                <div className="w-full bg-[#EBECF0] rounded-full h-2">
                                                    <div className="bg-[#0052CC] h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-[#5E6C84] text-center py-6">Create portfolios to see distribution</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── CROSS-PROJECT VIEW TAB ── */}
                {activeTab === 'cross-view' && (
                    <div className="bg-white rounded-xl shadow-sm border border-[#DFE1E6] overflow-hidden">
                        <div className="p-6 border-b border-[#DFE1E6]">
                            <h3 className="font-bold text-[#172B4D]">Cross-Project Performance</h3>
                            <p className="text-sm text-[#5E6C84]">Compare health and progress across all initiatives</p>
                        </div>
                        <div className="overflow-x-auto w-full">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                                    <tr>
                                        {['Initiative', 'Type', 'Health', 'Team', 'Projects', 'Timeline'].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#DFE1E6]">
                                    {portfolios.concat(programs).length > 0 ? portfolios.concat(programs).map((item, i) => (
                                        <tr key={`${item.id}-${i}`} className="hover:bg-[#F4F5F7] transition-colors cursor-pointer group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-[#172B4D] group-hover:text-[#0052CC]">{item.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DEEBFF] text-[#0052CC] uppercase">
                                                    {i < portfolios.length ? 'Portfolio' : 'Program'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700">
                                                    <Activity size={12} /> Healthy
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex -space-x-1">
                                                    {[1, 2].map(j => (
                                                        <div key={j} className="w-6 h-6 rounded-full border border-white bg-[#0052CC] flex items-center justify-center text-white text-[8px] font-bold">M</div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#5E6C84]">{item.projects?.length || 0}</td>
                                            <td className="px-6 py-4 text-xs text-[#5E6C84] font-medium">
                                                {item.created_at ? new Date(item.created_at).getFullYear() : 'Ongoing'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-[#5E6C84]">
                                                <PieChart size={32} className="mx-auto mb-2 opacity-50" />
                                                <span>No initiatives yet. Create portfolios or programs to see the cross-project view.</span>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Portfolio Modal */}
            {showPortModal && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                            <h3 className="font-bold text-[#172B4D] text-lg">Create Portfolio</h3>
                            <button onClick={() => setShowPortModal(false)} className="p-1 hover:bg-[#EBECF0] rounded-full"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreatePortfolio} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Name</label>
                                <input required type="text" className="w-full px-4 py-2 border-2 border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC]" value={newPort.name} onChange={e => setNewPort({ ...newPort, name: e.target.value })} placeholder="e.g. Q1 Infrastructure Initiatives" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Description</label>
                                <textarea className="w-full px-4 py-2 border-2 border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC] min-h-[80px] resize-none" value={newPort.description} onChange={e => setNewPort({ ...newPort, description: e.target.value })} placeholder="Strategic goal of this portfolio..." />
                            </div>
                            <button type="submit" className="w-full py-3 bg-[#0052CC] text-white font-bold rounded-lg hover:bg-[#0065FF] transition-all">Create Portfolio</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Program Modal */}
            {showProgModal && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                            <h3 className="font-bold text-[#172B4D] text-lg">Initialize Program</h3>
                            <button onClick={() => setShowProgModal(false)} className="p-1 hover:bg-[#EBECF0] rounded-full"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateProgram} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Program Name</label>
                                <input required type="text" className="w-full px-4 py-2 border-2 border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC]" value={newProg.name} onChange={e => setNewProg({ ...newProg, name: e.target.value })} placeholder="e.g. Next-Gen Core Platform" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Portfolio</label>
                                <select className="w-full px-4 py-2 border-2 border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC]" value={newProg.portfolio} onChange={e => setNewProg({ ...newProg, portfolio: e.target.value })}>
                                    <option value="">No Portfolio (Global)</option>
                                    {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Description</label>
                                <textarea className="w-full px-4 py-2 border-2 border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC] min-h-[80px] resize-none" value={newProg.description} onChange={e => setNewProg({ ...newProg, description: e.target.value })} placeholder="Shared goals..." />
                            </div>
                            <button type="submit" className="w-full py-3 bg-[#403294] text-white font-bold rounded-lg hover:bg-[#50449C] transition-all">Initialize Program</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolios;
