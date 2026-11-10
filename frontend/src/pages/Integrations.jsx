import { useState, useEffect } from 'react';
import { 
    Github, 
    Slack, 
    Gitlab, 
    Trello, 
    Check, 
    ExternalLink, 
    Webhook as WebhookIcon, 
    RefreshCw, 
    Shield, 
    Code, 
    AlertCircle, 
    Trash2, 
    PlayCircle 
} from 'lucide-react';
import api from '../services/api';

const Integrations = () => {
    const [connectedProviders, setConnectedProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [webhooks, setWebhooks] = useState([]);
    const [loadingWebhooks, setLoadingWebhooks] = useState(false);
    const [newWebhook, setNewWebhook] = useState({ name: '', url: '', event: 'TASK_CREATED' });
    const [showWebhookModal, setShowWebhookModal] = useState(false);
    const [notification, setNotification] = useState(null);

    const tools = [
        { 
            id: 'github', 
            name: 'GitHub', 
            icon: <Github size={24} className="text-gray-900" />, 
            desc: 'Sync issues, PRs, and branch deployments with tasks.' 
        },
        { 
            id: 'gitlab', 
            name: 'GitLab', 
            icon: <Gitlab size={24} className="text-orange-600" />, 
            desc: 'DevOps CI/CD pipelines and issue tracker integration.' 
        },
        { 
            id: 'slack', 
            name: 'Slack', 
            icon: <Slack size={24} className="text-emerald-600" />, 
            desc: 'Send real-time alerts for sprint retros, SLA breaches, and tickets.' 
        },
        { 
            id: 'jira', 
            name: 'Jira Software', 
            icon: <Trello size={24} className="text-blue-600" />, 
            desc: 'Bi-directional sync with Atlassian Jira projects and boards.' 
        },
    ];

    useEffect(() => {
        fetchConnections();
        fetchWebhooks();
    }, []);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchConnections = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users/oauth/');
            const providers = (res.data || []).map(conn => conn.provider.toLowerCase());
            setConnectedProviders(providers);
        } catch (err) {
            console.error('Failed to fetch OAuth connections:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWebhooks = async () => {
        try {
            setLoadingWebhooks(true);
            const res = await api.get('/automation/webhooks/');
            setWebhooks(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch webhooks:', err);
        } finally {
            setLoadingWebhooks(false);
        }
    };

    const handleToggleConnect = async (toolId) => {
        setActionLoading(toolId);
        const isConnected = connectedProviders.includes(toolId);

        try {
            if (isConnected) {
                await api.delete(`/users/oauth/?provider=${toolId}`);
                setConnectedProviders(prev => prev.filter(p => p !== toolId));
                showToast(`Disconnected ${toolId.toUpperCase()}`);
            } else {
                await api.post('/users/oauth/', {
                    provider: toolId,
                    provider_user_id: `${toolId}_user_${Date.now().toString().slice(-4)}`,
                    access_token: `mock_live_${toolId}_token_${Date.now()}`,
                    scopes: 'read,write'
                });
                setConnectedProviders(prev => [...prev, toolId]);
                showToast(`Successfully connected to ${toolId.toUpperCase()}!`);
            }
        } catch (err) {
            console.error('Error toggling connection:', err);
            showToast('Action failed. Please verify credentials.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateWebhook = async (e) => {
        e.preventDefault();
        if (!newWebhook.name || !newWebhook.url) return;

        try {
            const res = await api.post('/automation/webhooks/', newWebhook);
            setWebhooks(prev => [...prev, res.data]);
            setNewWebhook({ name: '', url: '', event: 'TASK_CREATED' });
            setShowWebhookModal(false);
            showToast('Webhook registered successfully!');
        } catch (err) {
            console.error('Failed to register webhook:', err);
            showToast('Failed to register webhook', 'error');
        }
    };

    const handleTestWebhook = async (webhookId) => {
        try {
            const res = await api.post(`/automation/webhooks/${webhookId}/test/`);
            if (res.data.success) {
                showToast('Test payload delivered successfully!');
            } else {
                showToast(`Webhook delivery failed: HTTP ${res.data.status_code}`, 'error');
            }
        } catch (err) {
            showToast('Failed to reach webhook endpoint', 'error');
        }
    };

    const handleDeleteWebhook = async (webhookId) => {
        try {
            await api.delete(`/automation/webhooks/${webhookId}/`);
            setWebhooks(prev => prev.filter(w => w.id !== webhookId));
            showToast('Webhook deleted');
        } catch (err) {
            showToast('Failed to delete webhook', 'error');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10">
            {/* Notification Toast */}
            {notification && (
                <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
                    notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                    <AlertCircle size={18} />
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#172B4D]">Integrations & Ecosystem</h1>
                <p className="text-[#5E6C84] mt-1 text-base">
                    Connect third-party developer platforms, configure automated webhooks, and explore our public REST API.
                </p>
            </div>

            {/* Apps & Providers */}
            <div>
                <h2 className="text-xl font-semibold text-[#172B4D] mb-4">Supported Platforms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tools.map(tool => {
                        const isConnected = connectedProviders.includes(tool.id);
                        const isLoading = actionLoading === tool.id;

                        return (
                            <div key={tool.id} className="bg-white p-6 rounded-xl border border-[#DFE1E6] shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-[#F4F5F7] rounded-lg flex items-center justify-center text-[#172B4D]">
                                        {tool.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#172B4D] text-lg">{tool.name}</h3>
                                        <p className="text-sm text-[#5E6C84] mt-1">{tool.desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleConnect(tool.id)}
                                    disabled={isLoading || loading}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                                        isConnected 
                                            ? 'bg-[#E3FCEF] text-[#006644] hover:bg-[#D3F5E4]' 
                                            : 'bg-[#0052CC] text-white hover:bg-[#0065FF]'
                                    }`}
                                >
                                    {isLoading ? (
                                        <RefreshCw size={16} className="animate-spin" />
                                    ) : isConnected ? (
                                        <><Check size={16} /> Connected</>
                                    ) : (
                                        'Connect'
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Webhooks Section */}
            <div className="bg-white p-6 rounded-xl border border-[#DFE1E6] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <WebhookIcon className="text-[#0052CC]" size={24} />
                        <div>
                            <h2 className="text-xl font-semibold text-[#172B4D]">Outbound Webhooks</h2>
                            <p className="text-sm text-[#5E6C84]">Trigger custom HTTP callbacks when platform events happen.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowWebhookModal(true)}
                        className="px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-semibold hover:bg-[#0065FF]"
                    >
                        + Add Webhook
                    </button>
                </div>

                {loadingWebhooks ? (
                    <div className="py-8 text-center text-[#5E6C84]">Loading webhooks...</div>
                ) : webhooks.length === 0 ? (
                    <div className="py-8 text-center border-2 border-dashed border-[#DFE1E6] rounded-lg text-[#5E6C84]">
                        No webhooks configured yet. Create one to receive automated event payloads.
                    </div>
                ) : (
                    <div className="divide-y divide-[#EBECF0]">
                        {webhooks.map(wh => (
                            <div key={wh.id} className="py-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#172B4D]">{wh.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-medium">
                                            {wh.event}
                                        </span>
                                    </div>
                                    <div className="text-xs font-mono text-[#5E6C84] mt-1">{wh.url}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleTestWebhook(wh.id)}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1.5"
                                        title="Send test payload"
                                    >
                                        <PlayCircle size={14} /> Test
                                    </button>
                                    <button
                                        onClick={() => handleDeleteWebhook(wh.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                        title="Delete webhook"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Developer API Card */}
            <div className="p-6 bg-[#DEEBFF] rounded-xl border border-[#B3D4FF]">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-[#0747A6] flex items-center gap-2 text-lg">
                            <Code size={22} /> Developer API & OpenAPI Documentation
                        </h3>
                        <p className="text-[#172B4D] mt-2 text-sm leading-relaxed max-w-2xl">
                            Build enterprise integrations, custom dashboard sidecars, or CLI automation using our complete REST API. 
                            Interactive Swagger and ReDoc documentation are fully generated and live.
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-700 font-mono">
                            <span className="flex items-center gap-1">
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

            {/* Modal for New Webhook */}
            {showWebhookModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                        <h3 className="text-lg font-bold text-[#172B4D] mb-4">Register New Outbound Webhook</h3>
                        <form onSubmit={handleCreateWebhook} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Webhook Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. CI/CD Deploy Trigger"
                                    value={newWebhook.name}
                                    onChange={e => setNewWebhook({ ...newWebhook, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Endpoint URL</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://your-server.com/api/webhook"
                                    value={newWebhook.url}
                                    onChange={e => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Trigger Event</label>
                                <select
                                    value={newWebhook.event}
                                    onChange={e => setNewWebhook({ ...newWebhook, event: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="TASK_CREATED">Task Created</option>
                                    <option value="TASK_COMPLETED">Task Completed</option>
                                    <option value="TICKET_CREATED">Ticket Created</option>
                                    <option value="TICKET_RESOLVED">Ticket Resolved</option>
                                    <option value="SPRINT_STARTED">Sprint Started</option>
                                    <option value="SLA_BREACHED">SLA Breached</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowWebhookModal(false)}
                                    className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-semibold hover:bg-[#0065FF]"
                                >
                                    Save Webhook
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Integrations;
