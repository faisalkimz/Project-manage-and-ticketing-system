import { useState, useEffect } from 'react';
import {
    Briefcase, Plus, Search, ChevronRight, Activity,
    Layers, PieChart, Users, Calendar, Target, MoreHorizontal, X
} from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';

const Portfolios = () => {
    const { showToast } = useToast();
    const [portfolios, setPortfolios] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('portfolios');
    const [showPortModal, setShowPortModal] = useState(false);
    const [showProgModal, setShowProgModal] = useState(false);
    const [newPort, setNewPort] = useState({ name: '', description: '' });
    const [newProg, setNewProg] = useState({ name: '', description: '', portfolio: '' });

    const fetchData = async () => {
        try {
            const [portRes, progRes] = await Promise.all([
                api.get('/projects/portfolios/'),
                api.get('/projects/programs/')
            ]);
            setPortfolios(portRes.data);
            setPrograms(progRes.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreatePortfolio = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/portfolios/', newPort);
            setNewPort({ name: '', description: '' });
            setShowPortModal(false);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleCreateProgram = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/programs/', newProg);
            setNewProg({ name: '', description: '', portfolio: '' });
            setShowProgModal(false);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const filteredPortfolios = portfolios.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    const filteredPrograms = programs.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

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

                <div className="flex items-center gap-4 mt-8 bg-white p-1 rounded-lg border border-[#DFE1E6] w-fit shadow-sm overflow-x-auto no-scrollbar max-w-full">
                    <button
                        onClick={() => setActiveTab('portfolios')}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'portfolios' ? 'bg-[#0052CC] text-white shadow-md' : 'text-[#5E6C84] hover:bg-[#F4F5F7]'}`}
                    >
                        Portfolios
                    </button>
                    <button
                        onClick={() => setActiveTab('programs')}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'programs' ? 'bg-[#0052CC] text-white shadow-md' : 'text-[#5E6C84] hover:bg-[#F4F5F7]'}`}
                    >
                        Programs
                    </button>
                    <button
                        onClick={() => setActiveTab('cross-view')}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'cross-view' ? 'bg-[#0052CC] text-white shadow-md' : 'text-[#5E6C84] hover:bg-[#F4F5F7]'}`}
                    >
                        Cross-Project View
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
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

                {activeTab === 'portfolios' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredPortfolios.length > 0 ? filteredPortfolios.map(portfolio => (
                            <div key={portfolio.id} className="bg-white rounded-xl shadow-sm border border-[#DFE1E6] overflow-hidden hover:shadow-md transition-all group">
                                <div className="p-6 border-b border-[#DFE1E6]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 rounded-lg bg-[#DEEBFF] text-[#0052CC]">
                                            <Briefcase size={20} />
                                        </div>
                                        <button className="text-[#5E6C84] hover:bg-[#F4F5F7] p-1 rounded">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#172B4D] mb-2">{portfolio.name}</h3>
                                    <p className="text-sm text-[#5E6C84] line-clamp-2 mb-4">{portfolio.description || 'No description provided.'}</p>

                                    <div className="flex items-center gap-4 py-3 bg-[#F4F5F7] rounded-lg px-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Status</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span className="text-sm font-bold text-[#172B4D]">On Track</span>
                                            </div>
                                        </div>
                                        <div className="h-8 w-px bg-[#DFE1E6]"></div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Projects</span>
                                            <span className="text-sm font-bold text-[#172B4D]">{portfolio.projects?.length || 0}</span>
                                        </div>
                                        <div className="h-8 w-px bg-[#DFE1E6]"></div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Last Sync</span>
                                            <span className="text-sm font-bold text-[#5E6C84]">Today</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-[#FAFBFC] flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {portfolio.owner_details ? (
                                            <div title={portfolio.owner_details.username} className="w-8 h-8 rounded-full border-2 border-white bg-[#0052CC] flex items-center justify-center text-white text-[10px] font-bold ring-1 ring-[#DFE1E6]">
                                                {portfolio.owner_details.username[0].toUpperCase()}
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full border-2 border-white bg-[#DFE1E6] flex items-center justify-center text-[#5E6C84] text-[10px] font-bold">?</div>
                                        )}
                                    </div>
                                    <Link
                                        to={`/portfolios/${portfolio.id}`}
                                        className="flex items-center gap-1 text-[#0052CC] text-sm font-bold hover:underline"
                                    >
                                        View Details <ChevronRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="lg:col-span-2 py-16 text-center bg-white rounded-xl border border-dashed border-[#DFE1E6] shadow-inner">
                                <Layers size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                                <h3 className="text-lg font-bold text-[#172B4D]">No Portfolios Defined</h3>
                                <p className="text-[#5E6C84] mb-6 max-w-sm mx-auto font-medium">Grouping projects into portfolios helps in strategic alignment and cross-initiative tracking.</p>
                                <button onClick={() => setShowPortModal(true)} className="bg-[#0052CC] text-white px-8 py-2.5 rounded-md font-bold hover:bg-[#0065FF] transition-all shadow-lg hover:scale-105 active:scale-95 antialiased">
                                    Create Portfolio Profile
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'programs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPrograms.length > 0 ? filteredPrograms.map(program => (
                            <div key={program.id} className="bg-white rounded-xl shadow-sm border border-[#DFE1E6] overflow-hidden hover:border-[#0052CC] transition-all group">
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 rounded bg-[#EAE6FF] text-[#403294]">
                                            <Target size={18} />
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAE6FF] text-[#403294] uppercase">In Progress</span>
                                    </div>
                                    <h3 className="font-bold text-[#172B4D] mb-1 group-hover:text-[#0052CC] transition-colors">{program.name}</h3>
                                    <p className="text-xs text-[#5E6C84] line-clamp-2 mb-4">{program.description || 'No description.'}</p>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-[#5E6C84]">
                                            <span>PROGRAM PROGRESS</span>
                                            <span>0%</span>
                                        </div>
                                        <div className="w-full bg-[#F4F5F7] h-1.5 rounded-full">
                                            <div className="bg-[#403294] h-full rounded-full" style={{ width: '0%' }}></div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-1.5 text-xs text-[#5E6C84]">
                                                <Calendar size={12} />
                                                <span>Just started</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-[#5E6C84]">
                                                <Layers size={12} />
                                                <span>{program.projects?.length || 0} Projects</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="md:col-span-2 lg:col-span-3 py-16 text-center bg-white rounded-xl border border-dashed border-[#DFE1E6] shadow-inner">
                                <PieChart size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                                <h3 className="text-lg font-bold text-[#172B4D]">Programs Area Empty</h3>
                                <p className="text-[#5E6C84] mb-6 max-w-sm mx-auto font-medium">Programs connect related projects to achieve shared goals and outcomes.</p>
                                <button onClick={() => setShowProgModal(true)} className="bg-[#0052CC] text-white px-8 py-2.5 rounded-md font-bold hover:bg-[#0065FF] transition-all shadow-lg hover:scale-105 active:scale-95 antialiased">
                                    Initialize Program
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'cross-view' && (
                    <div className="bg-white rounded-xl shadow-sm border border-[#DFE1E6] overflow-hidden">
                        <div className="p-6 border-b border-[#DFE1E6]">
                            <h3 className="font-bold text-[#172B4D]">Cross-Project Performance</h3>
                            <p className="text-sm text-[#5E6C84]">Compare health and progress across all initiatives</p>
                        </div>
                        <div className="overflow-x-auto w-full custom-scrollbar">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Project / Program</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Health</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Team</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Progress</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">Timeline</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#DFE1E6]">
                                    {portfolios.concat(programs).length > 0 ? portfolios.concat(programs).slice(0, 10).map((item, i) => (
                                        <tr key={`${item.id}-${i}`} className="hover:bg-[#F4F5F7] transition-colors cursor-pointer group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#172B4D] group-hover:text-[#0052CC]">{item.name}</span>
                                                    <span className="text-[10px] text-[#5E6C84]">{item.description ? item.description.substring(0, 30) + '...' : 'No description'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase ${i % 2 === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    <Activity size={12} />
                                                    {i % 2 === 0 ? 'Healthy' : 'At Risk'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex -space-x-1">
                                                    {[1, 2, 3].map(j => (
                                                        <div key={j} className="w-6 h-6 rounded-full border border-white bg-[#0052CC] flex items-center justify-center text-white text-[8px] font-bold">
                                                            P
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 bg-[#EBECF0] h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-[#0052CC] h-full" style={{ width: `${Math.random() * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-[#172B4D]">On Track</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-[#5E6C84] whitespace-nowrap font-medium">Q1 2026</span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-[#5E6C84]">
                                                <div className="flex flex-col items-center">
                                                    <PieChart size={32} className="mb-2 opacity-50" />
                                                    <span>No performance data available. Create portfolios or programs to see analytics.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            {showPortModal && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                            <h3 className="font-bold text-[#172B4D] text-lg">Create Portfolio</h3>
                            <button onClick={() => setShowPortModal(false)} className="p-1 hover:bg-[#EBECF0] rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreatePortfolio} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2 tracking-wide">Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 border-2 border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC] transition-colors"
                                    value={newPort.name}
                                    onChange={e => setNewPort({ ...newPort, name: e.target.value })}
                                    placeholder="e.g. Q1 Infrastructure Initiatives"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2 tracking-wide">Description</label>
                                <textarea
                                    className="w-full px-4 py-2 border-2 border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC] transition-colors min-h-[100px] resize-none"
                                    value={newPort.description}
                                    onChange={e => setNewPort({ ...newPort, description: e.target.value })}
                                    placeholder="What's the goal of this portfolio?"
                                />
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full py-3 bg-[#0052CC] text-white font-bold rounded-lg hover:bg-[#0065FF] transition-all shadow-lg hover:shadow-[#0052CC]/30">
                                    Create Portfolio Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showProgModal && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                            <h3 className="font-bold text-[#172B4D] text-lg">Initialize Program</h3>
                            <button onClick={() => setShowProgModal(false)} className="p-1 hover:bg-[#EBECF0] rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateProgram} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2 tracking-wide">Program Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 border-2 border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC] transition-colors"
                                    value={newProg.name}
                                    onChange={e => setNewProg({ ...newProg, name: e.target.value })}
                                    placeholder="e.g. Next-Gen Core Platform"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2 tracking-wide">Portfolio Assignment</label>
                                <select
                                    className="w-full px-4 py-2 border-2 border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC] transition-colors"
                                    value={newProg.portfolio}
                                    onChange={e => setNewProg({ ...newProg, portfolio: e.target.value })}
                                >
                                    <option value="">No Portfolio (Global)</option>
                                    {portfolios.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2 tracking-wide">Description</label>
                                <textarea
                                    className="w-full px-4 py-2 border-2 border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC] transition-colors min-h-[100px] resize-none"
                                    value={newProg.description}
                                    onChange={e => setNewProg({ ...newProg, description: e.target.value })}
                                    placeholder="Describe the shared goals..."
                                />
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full py-3 bg-[#403294] text-white font-bold rounded-lg hover:bg-[#50449C] transition-all shadow-lg hover:shadow-[#403294]/30">
                                    Initialize Program
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolios;
