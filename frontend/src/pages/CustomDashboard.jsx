import { useState, useEffect } from 'react';
import { Plus, Trash2, LayoutGrid, CheckCircle2, Clock, AlertTriangle, BarChart3, Save } from 'lucide-react';
import api from '../services/api';

const AVAILABLE_WIDGETS = [
    { id: 'task_status', title: 'Task Completion Overview', icon: CheckCircle2 },
    { id: 'sla_health', title: 'Ticket SLA Compliance', icon: AlertTriangle },
    { id: 'project_counts', title: 'Active Projects Summary', icon: BarChart3 },
    { id: 'time_summary', title: 'Logged Hours Snapshot', icon: Clock },
];

const CustomDashboard = () => {
    const [widgets, setWidgets] = useState(['task_status', 'sla_health', 'project_counts', 'time_summary']);
    const [savedLayouts, setSavedLayouts] = useState([]);
    const [layoutName, setLayoutName] = useState('My Custom Dashboard');
    const [stats, setStats] = useState({ tasks: [], tickets: [], projects: [], timeStats: null });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.allSettled([
            api.get('/projects/tasks/'),
            api.get('/tickets/tickets/'),
            api.get('/projects/projects/'),
            api.get('/timetracking/entries/stats/'),
            api.get('/projects/reports/'),
        ]).then(([tRes, tkRes, pRes, tmRes, rRes]) => {
            setStats({
                tasks: tRes.status === 'fulfilled' ? (Array.isArray(tRes.value.data) ? tRes.value.data : []) : [],
                tickets: tkRes.status === 'fulfilled' ? (Array.isArray(tkRes.value.data) ? tkRes.value.data : []) : [],
                projects: pRes.status === 'fulfilled' ? (Array.isArray(pRes.value.data) ? pRes.value.data : []) : [],
                timeStats: tmRes.status === 'fulfilled' ? tmRes.value.data : null,
            });
            if (rRes.status === 'fulfilled') {
                const list = Array.isArray(rRes.value.data) ? rRes.value.data : [];
                setSavedLayouts(list.filter(r => r.report_type === 'DASHBOARD'));
            }
        });
    }, []);

    const addWidget = (id) => {
        if (!widgets.includes(id)) setWidgets([...widgets, id]);
    };

    const removeWidget = (id) => {
        setWidgets(widgets.filter(w => w !== id));
    };

    const handleSaveLayout = async () => {
        setSaving(true);
        try {
            const res = await api.post('/projects/reports/', {
                name: layoutName || 'Custom Dashboard',
                report_type: 'DASHBOARD',
                description: 'Custom widget grid layout',
                config: { widgets },
            });
            setSavedLayouts(prev => [res.data, ...prev]);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const doneTasks = stats.tasks.filter(t => t.status === 'DONE').length;
    const breachedTickets = stats.tickets.filter(t => t.sla_breached).length;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-[#172B4D]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutGrid className="text-[#0079BF]" /> Custom Dashboard Builder
                    </h1>
                    <p className="text-sm text-[#5E6C84]">Configure and save your personalized KPI widgets</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={layoutName}
                        onChange={(e) => setLayoutName(e.target.value)}
                        className="px-3 py-1.5 border border-[#DFE1E6] rounded text-sm bg-white"
                        placeholder="Dashboard name"
                    />
                    <button
                        onClick={handleSaveLayout}
                        disabled={saving}
                        className="px-4 py-1.5 bg-[#0079BF] hover:bg-[#026AA7] text-white rounded text-sm font-semibold flex items-center gap-1.5"
                    >
                        <Save size={14} /> {saving ? 'Saving...' : 'Save Layout'}
                    </button>
                </div>
            </div>

            {/* Widget Palette */}
            <div className="bg-white border border-[#DFE1E6] rounded-lg p-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase text-[#5E6C84] mr-2">Add Widget:</span>
                {AVAILABLE_WIDGETS.map(w => (
                    <button
                        key={w.id}
                        onClick={() => addWidget(w.id)}
                        disabled={widgets.includes(w.id)}
                        className="px-3 py-1.5 border border-[#DFE1E6] rounded text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F4F5F7] disabled:opacity-40"
                    >
                        <Plus size={12} /> {w.title}
                    </button>
                ))}
                {savedLayouts.length > 0 && (
                    <select
                        onChange={(e) => {
                            const found = savedLayouts.find(l => String(l.id) === e.target.value);
                            if (found?.config?.widgets) setWidgets(found.config.widgets);
                        }}
                        className="ml-auto px-3 py-1.5 border border-[#DFE1E6] rounded text-xs bg-white"
                        defaultValue=""
                    >
                        <option value="" disabled>Load Saved Layout...</option>
                        {savedLayouts.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {widgets.map(wId => {
                    const meta = AVAILABLE_WIDGETS.find(w => w.id === wId);
                    if (!meta) return null;
                    return (
                        <div key={wId} className="bg-white border border-[#DFE1E6] rounded-lg p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <meta.icon size={16} className="text-[#0079BF]" /> {meta.title}
                                </h3>
                                <button onClick={() => removeWidget(wId)} className="text-[#5E6C84] hover:text-rose-600">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            {wId === 'task_status' && (
                                <div className="space-y-2">
                                    <p className="text-3xl font-bold">{doneTasks} / {stats.tasks.length}</p>
                                    <p className="text-xs text-[#5E6C84]">Tasks completed across accessible projects</p>
                                </div>
                            )}
                            {wId === 'sla_health' && (
                                <div className="space-y-2">
                                    <p className="text-3xl font-bold">{stats.tickets.length - breachedTickets} / {stats.tickets.length}</p>
                                    <p className="text-xs text-[#5E6C84]">Tickets within SLA ({breachedTickets} breached)</p>
                                </div>
                            )}
                            {wId === 'project_counts' && (
                                <div className="space-y-2">
                                    <p className="text-3xl font-bold">{stats.projects.length}</p>
                                    <p className="text-xs text-[#5E6C84]">Active projects in workspace</p>
                                </div>
                            )}
                            {wId === 'time_summary' && (
                                <div className="space-y-2">
                                    <p className="text-3xl font-bold">{stats.timeStats?.week_formatted || '0h 0m'}</p>
                                    <p className="text-xs text-[#5E6C84]">Logged this week ({stats.timeStats?.today_formatted || '0h 0m'} today)</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CustomDashboard;
