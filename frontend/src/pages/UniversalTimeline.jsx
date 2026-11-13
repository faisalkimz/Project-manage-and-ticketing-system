import { useState, useEffect } from 'react';
import { 
    Activity, 
    Sparkles, 
    Filter, 
    CheckCircle2, 
    AlertTriangle, 
    FileText, 
    MessageSquare, 
    Briefcase, 
    Clock, 
    RefreshCw, 
    User,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

const UniversalTimeline = () => {
    const { showToast } = useToast();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingDigest, setGeneratingDigest] = useState(false);
    const [filterType, setFilterType] = useState('ALL');
    const [digest, setDigest] = useState(null);
    const [lastGenerated, setLastGenerated] = useState(null);

    const fetchTimeline = async (type = filterType) => {
        try {
            setLoading(true);
            const res = await api.get(`/activity/audit-logs/universal-timeline/?type=${type}`);
            setEvents(res.data.timeline || []);
            if (res.data.digest) {
                setDigest(res.data.digest);
            }
        } catch (error) {
            console.error('Failed to fetch universal timeline', error);
            showToast('Failed to load activity timeline', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDigest = async () => {
        try {
            setGeneratingDigest(true);
            const res = await api.post(`/activity/audit-logs/universal-timeline/?type=${filterType}`, {});
            setDigest(res.data.digest);
            setLastGenerated(new Date().toLocaleTimeString());
            showToast('AI Daily Digest generated successfully!', 'success');
        } catch (error) {
            console.error('Failed to generate AI digest', error);
            showToast('Failed to generate AI Daily Digest', 'error');
        } finally {
            setGeneratingDigest(false);
        }
    };

    useEffect(() => {
        fetchTimeline(filterType);
    }, [filterType]);

    const getEventBadge = (model, action) => {
        const lowerModel = (model || '').toLowerCase();
        const lowerAction = (action || '').toLowerCase();

        if (lowerModel.includes('ticket')) {
            return {
                bg: 'bg-amber-50 text-amber-700 border-amber-200',
                icon: <MessageSquare size={14} className="text-amber-600" />,
                label: 'Support Ticket'
            };
        }
        if (lowerModel.includes('task')) {
            if (lowerAction.includes('create')) {
                return {
                    bg: 'bg-blue-50 text-blue-700 border-blue-200',
                    icon: <CheckCircle2 size={14} className="text-blue-600" />,
                    label: 'Task Created'
                };
            }
            return {
                bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                icon: <CheckCircle2 size={14} className="text-indigo-600" />,
                label: 'Task Activity'
            };
        }
        if (lowerModel.includes('project')) {
            return {
                bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                icon: <Briefcase size={14} className="text-emerald-600" />,
                label: 'Project Milestone'
            };
        }
        return {
            bg: 'bg-slate-50 text-slate-700 border-slate-200',
            icon: <FileText size={14} className="text-slate-600" />,
            label: model || 'System'
        };
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Universal Activity Timeline</h1>
                            <p className="text-sm text-slate-500">Cross-system audit stream spanning projects, tasks, sprints, and support tickets</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchTimeline(filterType)}
                        disabled={loading}
                        className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                        title="Refresh Timeline"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={handleGenerateDigest}
                        disabled={generatingDigest}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white rounded-lg shadow-sm text-sm font-semibold transition disabled:opacity-50"
                    >
                        <Sparkles size={16} className={generatingDigest ? 'animate-spin' : ''} />
                        {generatingDigest ? 'Synthesizing...' : 'Generate AI Daily Digest'}
                    </button>
                </div>
            </div>

            {/* AI Executive Daily Digest Banner */}
            {digest && (
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-start justify-between gap-4 relative z-10 mb-3">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-400/30">
                                <Sparkles size={16} />
                            </span>
                            <h3 className="font-bold text-lg text-white">AI Executive Daily Digest</h3>
                        </div>
                        {lastGenerated && (
                            <span className="text-xs text-indigo-300 bg-white/10 px-2.5 py-1 rounded-full">
                                Generated today at {lastGenerated}
                            </span>
                        )}
                    </div>
                    <div className="prose prose-invert max-w-none text-slate-200 text-sm whitespace-pre-wrap leading-relaxed relative z-10 bg-black/20 p-4 rounded-xl border border-white/5">
                        {digest}
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
                        <Filter size={12} /> Filter:
                    </span>
                    {[
                        { id: 'ALL', label: 'All Activity' },
                        { id: 'TASKS', label: 'Tasks Only' },
                        { id: 'TICKETS', label: 'Support Tickets' },
                        { id: 'PROJECTS', label: 'Projects & Milestones' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilterType(f.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                filterType === f.id
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="text-xs text-slate-400 font-medium">
                    {events.length} events logged
                </div>
            </div>

            {/* Timeline Stream */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                {loading ? (
                    <div className="space-y-4 py-8">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="animate-pulse flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 space-y-3">
                        <Activity size={40} className="mx-auto text-slate-300" />
                        <h4 className="text-base font-semibold text-slate-700">No activity logged yet</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Events from project tasks, sprints, commits, and support tickets will populate here automatically in real time.
                        </p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6">
                        {events.map((event) => {
                            const badge = getEventBadge(event.content_type_model, event.action);
                            const userAvatar = event.user_details?.username?.substring(0, 2).toUpperCase() || 'SYS';
                            const eventTime = new Date(event.timestamp).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            return (
                                <div key={event.id} className="relative group">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow-sm group-hover:scale-125 transition-transform" />

                                    <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-xl p-4 transition-all hover:shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                    {userAvatar}
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">
                                                    {event.user_details?.username || 'Automated System'}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg}`}>
                                                    {badge.icon}
                                                    {badge.label}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <Clock size={12} />
                                                <span>{eventTime}</span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-700 font-medium">
                                            {event.action}
                                        </p>

                                        {event.details && Object.keys(event.details).length > 0 && (
                                            <div className="mt-2 text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100 font-mono">
                                                {Object.entries(event.details).map(([k, v]) => (
                                                    <div key={k} className="truncate">
                                                        <span className="text-slate-400 font-semibold">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UniversalTimeline;
