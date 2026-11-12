import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    PieChart,
    AlertCircle,
    CheckCircle2,
    Clock,
    Download,
    RefreshCw,
    Users,
    Target,
    Activity,
    FileText,
    Calendar,
    Flame,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    ShieldAlert,
    Layers
} from 'lucide-react';
import api from '../services/api';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('overview'); // overview, burndown, velocity, workload
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [sprints, setSprints] = useState([]);
    const [selectedSprintId, setSelectedSprintId] = useState('');

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [projectHealth, setProjectHealth] = useState([]);
    const [workload, setWorkload] = useState([]);
    const [velocityData, setVelocityData] = useState([]);
    const [burndownData, setBurndownData] = useState(null);
    const [burnupData, setBurnupData] = useState([]);
    const [isExporting, setIsExporting] = useState(false);

    // Initial load: projects & overall stats
    useEffect(() => {
        fetchInitialData();
    }, []);

    // When project changes, fetch project-specific sprints & velocity
    useEffect(() => {
        if (selectedProjectId) {
            fetchSprintsForProject(selectedProjectId);
            fetchVelocity(selectedProjectId);
        } else {
            setSprints([]);
            setSelectedSprintId('');
            setVelocityData([]);
        }
        fetchDashboardStats();
        fetchWorkload();
    }, [selectedProjectId]);

    // When sprint changes, fetch burndown and burnup
    useEffect(() => {
        if (selectedSprintId) {
            fetchBurndown(selectedSprintId);
            fetchBurnup(selectedSprintId);
        } else {
            setBurndownData(null);
            setBurnupData([]);
        }
    }, [selectedSprintId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [projRes, statsRes, kpiRes, healthRes, workRes] = await Promise.allSettled([
                api.get('/projects/'),
                api.get('/reports/analytics/dashboard_stats/'),
                api.get('/reports/analytics/kpis/'),
                api.get('/reports/analytics/project_health/'),
                api.get('/reports/analytics/workload/')
            ]);

            if (projRes.status === 'fulfilled') {
                const projs = projRes.value.data.results || projRes.value.data || [];
                setProjects(projs);
                if (projs.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(projs[0].id.toString());
                }
            }

            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            if (kpiRes.status === 'fulfilled') setKpis(kpiRes.value.data);
            if (healthRes.status === 'fulfilled') setProjectHealth(healthRes.value.data || []);
            if (workRes.status === 'fulfilled') setWorkload(workRes.value.data || []);
        } catch (err) {
            console.error('Failed to load initial analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const res = await api.get('/reports/analytics/dashboard_stats/');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchWorkload = async () => {
        try {
            const params = selectedProjectId ? { project_id: selectedProjectId } : {};
            const res = await api.get('/reports/analytics/workload/', { params });
            setWorkload(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSprintsForProject = async (projectId) => {
        try {
            const res = await api.get('/projects/sprints/', { params: { project_id: projectId } });
            const sprintList = res.data.results || res.data || [];
            setSprints(sprintList);
            if (sprintList.length > 0) {
                // Select active sprint or latest
                const active = sprintList.find(s => s.status === 'ACTIVE') || sprintList[0];
                setSelectedSprintId(active.id.toString());
            } else {
                setSelectedSprintId('');
            }
        } catch (err) {
            console.error('Failed to fetch sprints:', err);
        }
    };

    const fetchVelocity = async (projectId) => {
        try {
            const res = await api.get('/reports/analytics/velocity/', { params: { project_id: projectId } });
            setVelocityData(res.data || []);
        } catch (err) {
            console.error('Failed to fetch velocity:', err);
        }
    };

    const fetchBurndown = async (sprintId) => {
        try {
            const res = await api.get('/reports/analytics/burndown/', { params: { sprint_id: sprintId } });
            setBurndownData(res.data);
        } catch (err) {
            console.error('Failed to fetch burndown:', err);
        }
    };

    const fetchBurnup = async (sprintId) => {
        try {
            const res = await api.get('/reports/analytics/burnup/', { params: { sprint_id: sprintId } });
            setBurnupData(res.data || []);
        } catch (err) {
            console.error('Failed to fetch burnup:', err);
        }
    };

    // Export Handlers
    const handleExportCSV = async (type) => {
        try {
            setIsExporting(true);
            const params = { type };
            if (selectedProjectId) params.project_id = selectedProjectId;

            const res = await api.get('/reports/analytics/export_csv/', {
                params,
                responseType: 'blob'
            });

            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export CSV failed:', err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async (type) => {
        try {
            setIsExporting(true);
            const params = { type };
            if (selectedProjectId) params.project_id = selectedProjectId;

            const res = await api.get('/reports/analytics/export_pdf/', {
                params,
                responseType: 'blob'
            });

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export PDF failed:', err);
        } finally {
            setIsExporting(false);
        }
    };

    // SVG Line Chart Renderer for Burndown
    const renderBurndownChart = () => {
        if (!burndownData || !burndownData.ideal || burndownData.ideal.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <Flame className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="font-medium text-slate-600">No Burndown Data for this Sprint</p>
                    <p className="text-xs text-slate-400 mt-1">Make sure tasks have story points assigned and sprint has defined dates.</p>
                </div>
            );
        }

        const ideal = burndownData.ideal;
        const actual = burndownData.actual || [];

        const maxPoints = Math.max(
            ...ideal.map(d => d.points),
            ...actual.map(d => d.points),
            10
        );

        const width = 700;
        const height = 300;
        const padding = 50;

        const getX = (idx, total) => padding + (idx / Math.max(total - 1, 1)) * (width - padding * 2);
        const getY = (val) => height - padding - (val / maxPoints) * (height - padding * 2);

        // Generate Path for Ideal line
        const idealPoints = ideal.map((d, i) => `${getX(i, ideal.length)},${getY(d.points)}`).join(' ');

        // Generate Path for Actual line
        const actualPoints = actual.map((d, i) => `${getX(i, ideal.length)},${getY(d.points)}`).join(' ');

        return (
            <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-4xl mx-auto drop-shadow-sm">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                        const yVal = height - padding - pct * (height - padding * 2);
                        const pointLabel = Math.round(pct * maxPoints);
                        return (
                            <g key={idx}>
                                <line x1={padding} y1={yVal} x2={width - padding} y2={yVal} stroke="#E2E8F0" strokeDasharray="3 3" />
                                <text x={padding - 10} y={yVal + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-medium">
                                    {pointLabel} pts
                                </text>
                            </g>
                        );
                    })}

                    {/* Ideal Line (Dashed Slate) */}
                    <polyline
                        fill="none"
                        stroke="#94A3B8"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                        points={idealPoints}
                    />

                    {/* Actual Line (Vibrant Indigo/Violet) */}
                    <polyline
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={actualPoints}
                    />

                    {/* Data Points on Actual */}
                    {actual.map((d, i) => {
                        const cx = getX(i, ideal.length);
                        const cy = getY(d.points);
                        return (
                            <g key={i} className="cursor-pointer group">
                                <circle cx={cx} cy={cy} r="5" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2" />
                                <title>{`${d.day}: ${d.points} pts remaining`}</title>
                            </g>
                        );
                    })}

                    {/* X-Axis Dates */}
                    {ideal.map((d, i) => {
                        if (ideal.length > 10 && i % 2 !== 0 && i !== ideal.length - 1) return null;
                        const cx = getX(i, ideal.length);
                        return (
                            <text key={i} x={cx} y={height - padding + 22} textAnchor="middle" className="text-[9px] fill-slate-400">
                                {d.day.split('-').slice(1).join('/')}
                            </text>
                        );
                    })}
                </svg>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400"></span>
                        <span>Guideline Ideal Burndown</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-600"></span>
                        <span className="text-indigo-600 font-semibold">Actual Remaining Story Points</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Analytics & Velocity Studio</h1>
                            <p className="text-sm text-slate-500">
                                Real-time sprint tracking, burndown projections, project health diagnostics, and team workload insights.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls & Export */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Project Selector */}
                    <div className="relative">
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                            <option value="">All Scoped Projects</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchInitialData}
                        disabled={loading}
                        className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition"
                        title="Refresh Analytics"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Export Dropdown / Buttons */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => handleExportCSV('tasks')}
                            disabled={isExporting}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            CSV
                        </button>
                        <button
                            onClick={() => handleExportPDF('tasks')}
                            disabled={isExporting}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            {isExporting ? 'Generating...' : 'PDF Report'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Rate</span>
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-bold text-slate-900">
                            {kpis?.task_completion_rate?.value ?? stats?.completion_rate_monthly ?? '0%'}
                            {kpis?.task_completion_rate?.unit && !stats?.completion_rate_monthly ? kpis.task_completion_rate.unit : ''}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Based on active cycle tasks</p>
                    </div>
                    <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${kpis?.task_completion_rate?.value || 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Velocity</span>
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                            <Zap className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-bold text-slate-900">
                            {kpis?.average_velocity?.value ?? 0} <span className="text-xs font-normal text-slate-500">pts / sprint</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Rolling historical completed story points</p>
                    </div>
                    <div className="mt-3 flex items-center text-xs text-indigo-600 font-medium">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Stable sprint throughput
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">On-Time Delivery</span>
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-bold text-slate-900">
                            {kpis?.on_time_delivery?.value ?? 100}%
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Tasks resolved within schedule</p>
                    </div>
                    <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-amber-500 h-1.5 rounded-full"
                            style={{ width: `${kpis?.on_time_delivery?.value || 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Scope</span>
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-bold text-slate-900">
                            {stats?.total_tasks ?? 0} <span className="text-xs font-normal text-slate-500">Tasks</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            {stats?.active_projects ?? 0} Active Projects • {stats?.open_tickets ?? 0} Open Tickets
                        </p>
                    </div>
                    <div className="mt-3 flex items-center text-xs text-slate-500 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" /> Safe multi-tenant isolated
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
                        activeTab === 'overview'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Activity className="w-4 h-4" />
                    Project Health Matrix
                </button>
                <button
                    onClick={() => setActiveTab('burndown')}
                    className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
                        activeTab === 'burndown'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Flame className="w-4 h-4" />
                    Sprint Burndown
                </button>
                <button
                    onClick={() => setActiveTab('velocity')}
                    className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
                        activeTab === 'velocity'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <BarChart3 className="w-4 h-4" />
                    Sprint Velocity
                </button>
                <button
                    onClick={() => setActiveTab('workload')}
                    className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px flex items-center gap-2 ${
                        activeTab === 'workload'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Team Workload
                </button>
            </div>

            {/* Tab 1: Project Health Matrix */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900">Active Projects Health Monitor</h2>
                        <span className="text-xs text-slate-500 font-medium">
                            {projectHealth.length} scoped projects tracked
                        </span>
                    </div>

                    {projectHealth.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
                            No active projects found. Create a project to start tracking health metrics.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projectHealth.map((proj) => {
                                const isCritical = proj.health === 'CRITICAL';
                                const isAtRisk = proj.health === 'AT_RISK';
                                const badgeColor = isCritical
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : isAtRisk
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                                return (
                                    <div
                                        key={proj.id}
                                        className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm leading-snug">{proj.name}</h3>
                                                <p className="text-xs text-slate-400 mt-0.5">{proj.members} team members</p>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
                                                {proj.health.replace('_', ' ')}
                                            </span>
                                        </div>

                                        {/* Progress */}
                                        <div>
                                            <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
                                                <span>Completion</span>
                                                <span className="font-bold text-slate-900">{proj.progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full ${
                                                        isCritical ? 'bg-rose-500' : isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`}
                                                    style={{ width: `${proj.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                                            <div className="p-2 bg-slate-50 rounded-lg">
                                                <div className="text-xs font-bold text-slate-800">{proj.total_tasks}</div>
                                                <div className="text-[10px] text-slate-400">Total</div>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-lg">
                                                <div className="text-xs font-bold text-emerald-600">{proj.completed_tasks}</div>
                                                <div className="text-[10px] text-slate-400">Done</div>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-lg">
                                                <div className={`text-xs font-bold ${proj.overdue_tasks > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                                    {proj.overdue_tasks}
                                                </div>
                                                <div className="text-[10px] text-slate-400">Overdue</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Sprint Burndown & Burnup */}
            {activeTab === 'burndown' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Sprint Burndown Projection</h2>
                            <p className="text-xs text-slate-500">Visualizing completed work vs remaining story points trajectory.</p>
                        </div>

                        {/* Sprint Selector */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-slate-500">Select Sprint:</label>
                            <select
                                value={selectedSprintId}
                                onChange={(e) => setSelectedSprintId(e.target.value)}
                                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {sprints.length === 0 && <option value="">No sprints for selected project</option>}
                                {sprints.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.status})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Chart Canvas */}
                    {renderBurndownChart()}

                    {/* Burnup summary if available */}
                    {burnupData.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Burnup Scope Progression</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {burnupData.slice(-4).map((b, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                        <div className="text-[10px] font-medium text-slate-400">{b.day}</div>
                                        <div className="text-sm font-bold text-indigo-600 mt-0.5">
                                            {b.completed} / {b.total_scope} pts
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 3: Sprint Velocity */}
            {activeTab === 'velocity' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Sprint Velocity History</h2>
                        <p className="text-xs text-slate-500">Completed story points per finalized sprint for predictability.</p>
                    </div>

                    {velocityData.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <BarChart3 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-slate-600">No Completed Sprints Recorded Yet</p>
                            <p className="text-xs text-slate-400 mt-1">Velocity will calibrate automatically as sprints are marked as COMPLETED.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {velocityData.map((v, i) => (
                                    <div key={i} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-semibold text-slate-500">{v.sprint}</div>
                                            <div className="text-xl font-bold text-slate-900 mt-1">{v.points} <span className="text-xs font-medium text-slate-400">pts</span></div>
                                        </div>
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 4: Team Workload */}
            {activeTab === 'workload' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Team Workload Distribution</h2>
                            <p className="text-xs text-slate-500">Resource allocation, open task counts, and story point pressure.</p>
                        </div>
                        <button
                            onClick={() => handleExportCSV('workload')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                        >
                            <Download className="w-3.5 h-3.5 text-slate-500" /> Export Workload CSV
                        </button>
                    </div>

                    {workload.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-slate-600">No Assigned Tasks Found</p>
                            <p className="text-xs text-slate-400 mt-1">Assign tasks to team members to visualize work distribution.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {workload.map((w, idx) => {
                                const total = w.total_tasks || 1;
                                const open = w.open_tasks || 0;
                                const loadPct = Math.min(100, Math.round((open / total) * 100));

                                return (
                                    <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-[200px]">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-sm">
                                                {w.assigned_to__username?.slice(0, 2) || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-900">{w.assigned_to__username}</div>
                                                <div className="text-xs text-slate-400">{w.total_points || 0} Total Story Points</div>
                                            </div>
                                        </div>

                                        <div className="flex-1 max-w-md">
                                            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                                                <span>{open} Open Tasks</span>
                                                <span>{w.total_tasks} Total Assigned</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full ${open > 10 ? 'bg-rose-500' : open > 5 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${loadPct}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                open > 10 ? 'bg-rose-50 text-rose-700' : open > 5 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {open > 10 ? 'Heavy Load' : open > 5 ? 'Moderate' : 'Optimal'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reports;
