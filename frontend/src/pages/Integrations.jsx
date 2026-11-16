import { useState, useEffect } from 'react';
import { 
    Github, 
    Slack, 
    Gitlab, 
    Trello, 
    ExternalLink, 
    Webhook as WebhookIcon, 
    RefreshCw, 
    Shield, 
    Code, 
    AlertCircle, 
    Trash2, 
    PlayCircle,
    Copy,
    Info,
    X,
    CheckCircle2,
    Plus,
    Edit2,
    Eye,
    EyeOff,
    Activity,
    Layers,
    Clock,
    Check,
    Lock
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import DeveloperApiStudio from '../components/DeveloperApiStudio';

const EVENT_CHOICES = [
    { value: 'TASK_CREATED', label: 'Task Created', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'TASK_UPDATED', label: 'Task Updated', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { value: 'TASK_COMPLETED', label: 'Task Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'PROJECT_CREATED', label: 'Project Created', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { value: 'TICKET_CREATED', label: 'Ticket Created', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'TICKET_RESOLVED', label: 'Ticket Resolved', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    { value: 'SPRINT_STARTED', label: 'Sprint Started', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { value: 'SPRINT_COMPLETED', label: 'Sprint Completed', color: 'bg-violet-50 text-violet-700 border-violet-200' },
];

const getEventBadge = (eventValue) => {
    const found = EVENT_CHOICES.find(e => e.value === eventValue);
    if (!found) {
        return { value: eventValue, label: eventValue || 'Custom Event', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
    return found;
};

const Integrations = () => {
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    // Tab state: 'webhooks' | 'apps' | 'api'
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('tab') || (window.location.hash ? window.location.hash.replace('#', '') : 'webhooks');
    });

    // Webhooks state
    const [webhooks, setWebhooks] = useState([]);
    const [loadingWebhooks, setLoadingWebhooks] = useState(false);
    const [testingWebhookId, setTestingWebhookId] = useState(null);
    const [copiedUrlId, setCopiedUrlId] = useState(null);

    // Create / Edit Webhook Modal state
    const initialWebhookForm = {
        name: '',
        url: '',
        event: 'TASK_CREATED',
        secret_token: '',
        max_retries: 3,
        is_active: true,
    };
    const [webhookForm, setWebhookForm] = useState(initialWebhookForm);
    const [editingWebhookId, setEditingWebhookId] = useState(null);
    const [showWebhookModal, setShowWebhookModal] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [submittingWebhook, setSubmittingWebhook] = useState(false);

    // Logs Modal state
    const [selectedWebhookForLogs, setSelectedWebhookForLogs] = useState(null);
    const [webhookLogs, setWebhookLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const tools = [
        { 
            id: 'github', 
            name: 'GitHub', 
            icon: <Github size={24} className="text-gray-900" />, 
            desc: 'Sync issues, pull requests, commit mentions, and branch deployments with tasks.',
            docUrl: 'https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app'
        },
        { 
            id: 'gitlab', 
            name: 'GitLab', 
            icon: <Gitlab size={24} className="text-orange-600" />, 
            desc: 'DevOps CI/CD pipelines and issue tracker integration.',
            docUrl: 'https://docs.gitlab.com/ee/integration/oauth_provider.html'
        },
        { 
            id: 'slack', 
            name: 'Slack', 
            icon: <Slack size={24} className="text-emerald-600" />, 
            desc: 'Send real-time alerts for sprint retros, SLA breaches, and tickets.',
            docUrl: 'https://api.slack.com/authentication/oauth-v2'
        },
        { 
            id: 'jira', 
            name: 'Jira Software', 
            icon: <Trello size={24} className="text-blue-600" />, 
            desc: 'Bi-directional sync with Atlassian Jira projects and boards.',
            docUrl: 'https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/'
        },
    ];

    useEffect(() => {
        fetchWebhooks();
    }, []);

    const fetchWebhooks = async () => {
        try {
            setLoadingWebhooks(true);
            const res = await api.get('/automation/webhooks/');
            setWebhooks(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch webhooks:', err);
            showToast('Failed to load webhooks', 'error');
        } finally {
            setLoadingWebhooks(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingWebhookId(null);
        setWebhookForm(initialWebhookForm);
        setShowSecret(false);
        setShowWebhookModal(true);
    };

    const handleOpenEditModal = (wh) => {
        setEditingWebhookId(wh.id);
        setWebhookForm({
            name: wh.name || '',
            url: wh.url || '',
            event: wh.event || 'TASK_CREATED',
            secret_token: wh.secret_token || '',
            max_retries: wh.max_retries ?? 3,
            is_active: wh.is_active ?? true,
        });
        setShowSecret(false);
        setShowWebhookModal(true);
    };

    const handleSubmitWebhook = async (e) => {
        e.preventDefault();
        if (!webhookForm.name.trim() || !webhookForm.url.trim()) {
            showToast('Please provide a name and target URL', 'error');
            return;
        }

        setSubmittingWebhook(true);
        try {
            const payload = {
                name: webhookForm.name.trim(),
                url: webhookForm.url.trim(),
                event: webhookForm.event,
                secret_token: webhookForm.secret_token || '',
                max_retries: Number(webhookForm.max_retries) || 3,
                is_active: Boolean(webhookForm.is_active),
            };

            if (editingWebhookId) {
                const res = await api.patch(`/automation/webhooks/${editingWebhookId}/`, payload);
                setWebhooks(prev => prev.map(w => w.id === editingWebhookId ? res.data : w));
                showToast('Webhook updated successfully!', 'success');
            } else {
                const res = await api.post('/automation/webhooks/', payload);
                setWebhooks(prev => [res.data, ...prev]);
                showToast('Webhook registered successfully!', 'success');
            }
            setShowWebhookModal(false);
            setEditingWebhookId(null);
            setWebhookForm(initialWebhookForm);
        } catch (err) {
            console.error('Failed to save webhook:', err);
            const errMsg = err.response?.data?.url?.[0] || err.response?.data?.name?.[0] || err.response?.data?.error || err.message || 'Failed to save webhook';
            showToast(`Failed to save webhook: ${errMsg}`, 'error');
        } finally {
            setSubmittingWebhook(false);
        }
    };

    const handleToggleActive = async (webhook) => {
        const nextState = !webhook.is_active;
        // Optimistic UI update
        setWebhooks(prev => prev.map(w => w.id === webhook.id ? { ...w, is_active: nextState } : w));
        try {
            await api.patch(`/automation/webhooks/${webhook.id}/`, { is_active: nextState });
            showToast(`Webhook "${webhook.name}" is now ${nextState ? 'Active' : 'Paused'}`, 'success');
        } catch (err) {
            // Revert on error
            setWebhooks(prev => prev.map(w => w.id === webhook.id ? { ...w, is_active: !nextState } : w));
            showToast('Failed to toggle webhook active state', 'error');
        }
    };

    const handleTestWebhook = async (webhookId) => {
        setTestingWebhookId(webhookId);
        try {
            const res = await api.post(`/automation/webhooks/${webhookId}/test/`);
            if (res.data?.success) {
                showToast(`Test payload delivered successfully! HTTP ${res.data.status_code}`, 'success');
            } else {
                const statusInfo = res.data?.status_code ? `HTTP ${res.data.status_code}` : (res.data?.error || 'Unknown error');
                showToast(`Webhook delivery failed: ${statusInfo}`, 'error');
            }
            // Refresh webhooks to get updated counts & timestamp
            fetchWebhooks();
            // If logs modal is open for this webhook, refresh logs list
            if (selectedWebhookForLogs && selectedWebhookForLogs.id === webhookId) {
                fetchWebhookLogs(webhookId);
            }
        } catch (err) {
            const statusInfo = err.response?.status ? `HTTP ${err.response.status}` : '';
            const msg = err.response?.data?.error || err.message || 'Failed to reach webhook endpoint';
            showToast(`Test delivery failed: ${statusInfo} ${msg}`.trim(), 'error');
        } finally {
            setTestingWebhookId(null);
        }
    };

    const handleDeleteWebhook = async (webhook) => {
        const confirmed = await confirm({
            title: 'Delete Webhook',
            message: `Are you sure you want to delete "${webhook.name}"? Active delivery to ${webhook.url} will stop immediately.`,
            confirmText: 'Delete Webhook',
            cancelText: 'Cancel',
            isDanger: true,
        });

        if (!confirmed) return;

        try {
            await api.delete(`/automation/webhooks/${webhook.id}/`);
            setWebhooks(prev => prev.filter(w => w.id !== webhook.id));
            showToast(`Webhook "${webhook.name}" deleted`, 'info');
        } catch (err) {
            showToast('Failed to delete webhook', 'error');
        }
    };

    const handleOpenLogs = (webhook) => {
        setSelectedWebhookForLogs(webhook);
        fetchWebhookLogs(webhook.id);
    };

    const fetchWebhookLogs = async (webhookId) => {
        setLoadingLogs(true);
        try {
            const res = await api.get(`/automation/webhooks/${webhookId}/logs/`);
            const logs = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            // Show last 20 delivery attempts as specified
            setWebhookLogs(logs.slice(0, 20));
        } catch (err) {
            console.error('Failed to fetch webhook logs:', err);
            showToast('Failed to load webhook logs', 'error');
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleCopyUrl = (url, id) => {
        navigator.clipboard.writeText(url);
        setCopiedUrlId(id);
        setTimeout(() => setCopiedUrlId(null), 2000);
        showToast('URL copied to clipboard!', 'success');
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24 md:pb-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#172B4D]">Integrations & Ecosystem</h1>
                <p className="text-[#5E6C84] mt-1 text-base">
                    Configure automated outbound webhooks, connect third-party developer platforms, and explore our public REST API.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#DFE1E6] gap-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('webhooks')}
                    className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-all shrink-0 ${
                        activeTab === 'webhooks'
                            ? 'border-[#0052CC] text-[#0052CC]'
                            : 'border-transparent text-[#5E6C84] hover:text-[#172B4D] hover:border-slate-300'
                    }`}
                >
                    <WebhookIcon size={18} />
                    <span>Webhooks</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === 'webhooks' ? 'bg-blue-100 text-[#0052CC]' : 'bg-[#EBECF0] text-[#5E6C84]'
                    }`}>
                        {webhooks.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('apps')}
                    className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-all shrink-0 ${
                        activeTab === 'apps'
                            ? 'border-[#0052CC] text-[#0052CC]'
                            : 'border-transparent text-[#5E6C84] hover:text-[#172B4D] hover:border-slate-300'
                    }`}
                >
                    <Layers size={18} />
                    <span>Connected Apps</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        Coming Soon
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('api')}
                    className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-all shrink-0 ${
                        activeTab === 'api'
                            ? 'border-[#0052CC] text-[#0052CC]'
                            : 'border-transparent text-[#5E6C84] hover:text-[#172B4D] hover:border-slate-300'
                    }`}
                >
                    <Code size={18} />
                    <span>API & Studio</span>
                </button>
            </div>

            {/* TAB 1: WEBHOOKS MANAGEMENT */}
            {activeTab === 'webhooks' && (
                <div className="space-y-6">
                    {/* Top Action Bar */}
                    <div className="bg-white p-6 rounded-xl border border-[#DFE1E6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-blue-50 text-[#0052CC] shrink-0">
                                <WebhookIcon size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-[#172B4D]">Outbound Webhooks</h2>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                                        Live Delivery Engine
                                    </span>
                                </div>
                                <p className="text-sm text-[#5E6C84] mt-0.5">
                                    Trigger instant HTTP POST callbacks when project tasks, tickets, or sprints are created and updated.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleOpenCreateModal}
                            className="px-4 py-2.5 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                        >
                            <Plus size={16} /> Create Webhook
                        </button>
                    </div>

                    {/* Webhooks List */}
                    {loadingWebhooks ? (
                        <div className="bg-white p-12 rounded-xl border border-[#DFE1E6] text-center text-[#5E6C84]">
                            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#0052CC]" />
                            <p className="text-sm font-medium">Loading configured webhooks...</p>
                        </div>
                    ) : webhooks.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border-2 border-dashed border-[#DFE1E6] text-center">
                            <WebhookIcon size={44} className="mx-auto mb-3 text-slate-400" />
                            <h3 className="text-lg font-bold text-[#172B4D]">No active webhooks configured</h3>
                            <p className="text-sm text-[#5E6C84] mt-1 max-w-md mx-auto">
                                Register an endpoint URL to receive real-time JSON payloads for tasks, tickets, and automated workflow triggers.
                            </p>
                            <button
                                onClick={handleOpenCreateModal}
                                className="mt-5 px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 shadow-sm"
                            >
                                <Plus size={16} /> Create your first webhook
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-[#DFE1E6] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6] text-xs font-bold text-[#5E6C84] uppercase tracking-wider">
                                            <th className="py-3 px-4">Webhook & Event</th>
                                            <th className="py-3 px-4">Target URL</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Delivery Stats</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EBECF0] text-sm">
                                        {webhooks.map(wh => {
                                            const badge = getEventBadge(wh.event);
                                            const isTesting = testingWebhookId === wh.id;

                                            return (
                                                <tr key={wh.id} className="hover:bg-slate-50/70 transition-colors">
                                                    {/* Name & Event Badge */}
                                                    <td className="py-4 px-4 align-top">
                                                        <div className="font-bold text-[#172B4D]">{wh.name}</div>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.color}`}>
                                                                {badge.label}
                                                            </span>
                                                            {wh.secret_token && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium" title="HMAC Signature Verification Enabled">
                                                                    <Lock size={11} className="text-emerald-600" /> Signed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* URL (Truncated) */}
                                                    <td className="py-4 px-4 align-top">
                                                        <div className="flex items-center gap-1.5">
                                                            <code className="text-xs font-mono text-[#172B4D] bg-[#F4F5F7] px-2 py-1 rounded max-w-[220px] sm:max-w-xs md:max-w-sm truncate block" title={wh.url}>
                                                                {wh.url}
                                                            </code>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyUrl(wh.url, wh.id)}
                                                                className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                                                                title="Copy endpoint URL"
                                                            >
                                                                {copiedUrlId === wh.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                                            </button>
                                                        </div>
                                                        <div className="text-[11px] text-[#5E6C84] mt-1">
                                                            Max retries: <span className="font-semibold">{wh.max_retries ?? 3}</span>
                                                        </div>
                                                    </td>

                                                    {/* Active Toggle */}
                                                    <td className="py-4 px-4 align-top">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                role="switch"
                                                                aria-checked={wh.is_active}
                                                                onClick={() => handleToggleActive(wh)}
                                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                    wh.is_active ? 'bg-emerald-600' : 'bg-slate-300'
                                                                }`}
                                                                title={wh.is_active ? 'Pause delivery' : 'Resume delivery'}
                                                            >
                                                                <span
                                                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                        wh.is_active ? 'translate-x-4' : 'translate-x-0'
                                                                    }`}
                                                                />
                                                            </button>
                                                            <span className={`text-xs font-bold ${wh.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                                {wh.is_active ? 'Active' : 'Paused'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Delivery Stats */}
                                                    <td className="py-4 px-4 align-top">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Successful deliveries">
                                                                <CheckCircle2 size={12} /> {wh.success_count || 0}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200" title="Failed deliveries">
                                                                <AlertCircle size={12} /> {wh.failure_count || 0}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-[#5E6C84] mt-1 flex items-center gap-1">
                                                            <Clock size={11} />
                                                            {wh.last_triggered ? (
                                                                <span>Fired {new Date(wh.last_triggered).toLocaleDateString()}</span>
                                                            ) : (
                                                                <span>Never fired</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-4 px-4 align-top text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleTestWebhook(wh.id)}
                                                                disabled={isTesting}
                                                                className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md flex items-center gap-1 transition-colors"
                                                                title="Send test payload"
                                                            >
                                                                {isTesting ? (
                                                                    <RefreshCw size={13} className="animate-spin text-[#0052CC]" />
                                                                ) : (
                                                                    <PlayCircle size={13} className="text-emerald-600" />
                                                                )}
                                                                <span>Test</span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleOpenLogs(wh)}
                                                                className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-[#F4F5F7] hover:bg-[#EBECF0] rounded-md flex items-center gap-1 transition-colors"
                                                                title="View delivery logs"
                                                            >
                                                                <Activity size={13} className="text-[#0052CC]" />
                                                                <span>Logs</span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleOpenEditModal(wh)}
                                                                className="p-1.5 text-slate-600 hover:text-[#0052CC] hover:bg-[#EBECF0] rounded-md transition-colors"
                                                                title="Edit webhook configuration"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteWebhook(wh)}
                                                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                                                title="Delete webhook"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: CONNECTED APPS (Coming Soon State) */}
            {activeTab === 'apps' && (
                <div className="space-y-6">
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-3">
                        <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-sm">Third-Party Direct OAuth Connectors In Development</h3>
                            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                Native integrations for GitHub, GitLab, Slack, and Jira Software are currently being built.
                                In the meantime, you can stream real-time events to your team and pipelines using our active{' '}
                                <button onClick={() => setActiveTab('webhooks')} className="font-bold underline text-[#0052CC]">
                                    Outbound Webhooks
                                </button>{' '}
                                or automate workflows via our public{' '}
                                <button onClick={() => setActiveTab('api')} className="font-bold underline text-[#0052CC]">
                                    REST API
                                </button>.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tools.map(tool => (
                            <div key={tool.id} className="bg-white p-6 rounded-xl border border-[#DFE1E6] shadow-sm flex flex-col justify-between">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-[#F4F5F7] rounded-lg flex items-center justify-center text-[#172B4D] shrink-0">
                                        {tool.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-[#172B4D] text-lg">{tool.name}</h3>
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                Coming Soon
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#5E6C84] mt-1.5 leading-relaxed">{tool.desc}</p>
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-[#DFE1E6] flex items-center justify-between">
                                    <a
                                        href={tool.docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#0052CC] hover:underline flex items-center gap-1 font-semibold"
                                    >
                                        OAuth Docs <ExternalLink size={12} />
                                    </a>

                                    <button
                                        disabled
                                        className="px-3.5 py-1.5 bg-[#F4F5F7] text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed border border-[#DFE1E6]"
                                    >
                                        Coming Soon
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: DEVELOPER API & STUDIO */}
            {activeTab === 'api' && (
                <div className="space-y-8">
                    {/* Developer API Card */}
                    <div className="p-6 bg-[#DEEBFF] rounded-xl border border-[#B3D4FF]">
                        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                            <div>
                                <h3 className="font-bold text-[#0747A6] flex items-center gap-2 text-lg">
                                    <Code size={22} /> Developer API & OpenAPI Documentation
                                </h3>
                                <p className="text-[#172B4D] mt-2 text-sm leading-relaxed max-w-2xl">
                                    Build enterprise integrations, custom dashboard sidecars, or CLI automation using our complete REST API. 
                                    Interactive Swagger and ReDoc documentation are fully generated and live.
                                </p>
                                <div className="mt-3 flex items-center gap-4 text-xs text-slate-700 font-mono">
                                    <span className="flex items-center gap-1 font-bold">
                                        <Shield size={14} className="text-emerald-700" /> Auth: Bearer JWT
                                    </span>
                                    <span>Base: http://localhost:8000/api</span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a
                                    href="http://localhost:8000/api/docs/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2.5 bg-[#0052CC] text-white rounded-lg font-bold text-sm hover:bg-[#0065FF] flex items-center gap-2 shadow-sm"
                                >
                                    Open Swagger UI <ExternalLink size={16} />
                                </a>
                                <a
                                    href="http://localhost:8000/api/redoc/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2.5 bg-white text-[#0052CC] border border-[#0052CC] rounded-lg font-bold text-sm hover:bg-blue-50 flex items-center gap-2 shadow-sm"
                                >
                                    ReDoc Spec <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Developer API Studio */}
                    <DeveloperApiStudio />
                </div>
            )}

            {/* MODAL: CREATE / EDIT WEBHOOK */}
            {showWebhookModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-[#DFE1E6] mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 text-[#0052CC] rounded-lg">
                                    <WebhookIcon size={18} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#172B4D]">
                                        {editingWebhookId ? 'Edit Webhook' : 'Create Webhook'}
                                    </h3>
                                    <p className="text-xs text-[#5E6C84]">Configure target endpoint and event subscription</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowWebhookModal(false)}
                                className="p-1.5 hover:bg-[#EBECF0] rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitWebhook} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase tracking-wider mb-1">
                                    Webhook Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. CI/CD Deploy Trigger"
                                    value={webhookForm.name}
                                    onChange={e => setWebhookForm({ ...webhookForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
                                />
                            </div>

                            {/* URL */}
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase tracking-wider mb-1">
                                    Target Endpoint URL <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://example.com/api/webhook"
                                    value={webhookForm.url}
                                    onChange={e => setWebhookForm({ ...webhookForm, url: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] font-mono text-xs"
                                />
                            </div>

                            {/* Event Select Dropdown (all 8 event choices) */}
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase tracking-wider mb-1">
                                    Trigger Event <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={webhookForm.event}
                                    onChange={e => setWebhookForm({ ...webhookForm, event: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC] bg-white font-medium text-[#172B4D]"
                                >
                                    {EVENT_CHOICES.map(c => (
                                        <option key={c.value} value={c.value}>
                                            {c.label} ({c.value})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Secret Token */}
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase tracking-wider mb-1">
                                    Secret Token <span className="text-slate-400 font-normal lowercase">(optional)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showSecret ? 'text' : 'password'}
                                        placeholder="Secret for payload signature / token validation"
                                        value={webhookForm.secret_token}
                                        onChange={e => setWebhookForm({ ...webhookForm, secret_token: e.target.value })}
                                        className="w-full pl-3 pr-10 py-2 border border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC] font-mono text-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-[#5E6C84] mt-1">
                                    Delivered via headers for HMAC-SHA256 signature verification.
                                </p>
                            </div>

                            {/* Max Retries & Is Active */}
                            <div className="grid grid-cols-2 gap-4 pt-1">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase tracking-wider mb-1">
                                        Max Retries
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={webhookForm.max_retries}
                                        onChange={e => setWebhookForm({ ...webhookForm, max_retries: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-sm outline-none focus:border-[#0052CC]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase tracking-wider mb-2">
                                        Active Status
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                                        <input
                                            type="checkbox"
                                            checked={webhookForm.is_active}
                                            onChange={e => setWebhookForm({ ...webhookForm, is_active: e.target.checked })}
                                            className="w-4 h-4 text-[#0052CC] rounded border-[#DFE1E6] focus:ring-[#0052CC]"
                                        />
                                        <span className="text-sm font-medium text-[#172B4D]">
                                            {webhookForm.is_active ? 'Active (Live)' : 'Paused'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-2 pt-4 border-t border-[#DFE1E6] mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowWebhookModal(false)}
                                    className="px-4 py-2 border border-[#DFE1E6] rounded-lg text-sm font-bold text-[#42526E] hover:bg-[#F4F5F7] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingWebhook}
                                    className="px-5 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    {submittingWebhook && <RefreshCw size={14} className="animate-spin" />}
                                    <span>{editingWebhookId ? 'Update Webhook' : 'Save Webhook'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: WEBHOOK LOGS */}
            {selectedWebhookForLogs && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[#DFE1E6]">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-lg font-bold text-[#172B4D] truncate">
                                        Delivery Logs: {selectedWebhookForLogs.name}
                                    </h3>
                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                        {selectedWebhookForLogs.event}
                                    </span>
                                </div>
                                <p className="text-xs text-[#5E6C84] mt-0.5 truncate font-mono">
                                    {selectedWebhookForLogs.url}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                <button
                                    onClick={() => handleTestWebhook(selectedWebhookForLogs.id)}
                                    disabled={testingWebhookId === selectedWebhookForLogs.id}
                                    className="px-3 py-1.5 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                >
                                    {testingWebhookId === selectedWebhookForLogs.id ? (
                                        <RefreshCw size={13} className="animate-spin" />
                                    ) : (
                                        <PlayCircle size={13} />
                                    )}
                                    <span>Test Again</span>
                                </button>

                                <button
                                    onClick={() => setSelectedWebhookForLogs(null)}
                                    className="p-1.5 hover:bg-[#EBECF0] rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Logs Content List */}
                        <div className="p-5 overflow-y-auto space-y-3 flex-1">
                            {loadingLogs ? (
                                <div className="py-12 text-center text-[#5E6C84]">
                                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#0052CC]" />
                                    <p className="text-sm font-medium">Fetching delivery attempts...</p>
                                </div>
                            ) : webhookLogs.length === 0 ? (
                                <div className="py-12 text-center border-2 border-dashed border-[#DFE1E6] rounded-xl">
                                    <Activity size={36} className="mx-auto mb-2 text-slate-300" />
                                    <p className="font-bold text-[#172B4D]">No delivery attempts recorded yet</p>
                                    <p className="text-xs text-[#5E6C84] mt-1 max-w-sm mx-auto">
                                        Click "Test Again" above to dispatch a test payload to this webhook endpoint.
                                    </p>
                                </div>
                            ) : (
                                webhookLogs.map((log, index) => {
                                    const isSuccess = log.status === 'SUCCESS';
                                    const isRetry = log.status === 'RETRY';

                                    return (
                                        <div
                                            key={log.id || index}
                                            className="p-4 rounded-xl border border-[#DFE1E6] bg-white hover:border-slate-300 transition-all space-y-2.5 shadow-sm"
                                        >
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 border ${
                                                            isSuccess
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : isRetry
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                                        }`}
                                                    >
                                                        {isSuccess ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                        {log.status}
                                                    </span>

                                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F4F5F7] text-[#172B4D] font-bold border border-[#DFE1E6]">
                                                        {log.status_code ? `HTTP ${log.status_code}` : 'No Status Code'}
                                                    </span>

                                                    <span className="text-xs text-[#5E6C84]">
                                                        Attempt #{log.attempt_number || 1}
                                                    </span>
                                                </div>

                                                <div className="text-xs text-[#5E6C84] flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                                                </div>
                                            </div>

                                            {/* Truncated Response Box */}
                                            <div className="bg-[#F4F5F7] rounded-lg p-3 font-mono text-xs text-[#172B4D] border border-[#DFE1E6]">
                                                <div className="text-[10px] uppercase font-bold text-[#5E6C84] mb-1">Response Body</div>
                                                <pre className="whitespace-pre-wrap break-all max-h-28 overflow-y-auto font-mono text-[11px] leading-relaxed">
                                                    {log.response_body || log.error_message || '(Empty response body)'}
                                                </pre>
                                            </div>

                                            {/* Collapsible Request Payload */}
                                            {log.request_payload && (
                                                <details className="text-xs text-slate-600">
                                                    <summary className="cursor-pointer text-[11px] font-bold text-[#0052CC] hover:underline select-none">
                                                        Inspect Request Payload
                                                    </summary>
                                                    <pre className="mt-1.5 p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto max-h-36">
                                                        {JSON.stringify(log.request_payload, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#DFE1E6] flex justify-between items-center text-xs text-[#5E6C84] bg-[#F4F5F7] rounded-b-xl">
                            <span>Showing up to 20 most recent deliveries</span>
                            <button
                                onClick={() => setSelectedWebhookForLogs(null)}
                                className="px-4 py-1.5 bg-white border border-[#DFE1E6] rounded-lg text-xs font-bold text-[#42526E] hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Integrations;
