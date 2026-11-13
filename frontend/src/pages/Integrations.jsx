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
    PlayCircle,
    Copy,
    Info,
    Settings,
    X,
    CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import DeveloperApiStudio from '../components/DeveloperApiStudio';

const Integrations = () => {
    const { showToast } = useToast();
    const [connectedProviders, setConnectedProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [webhooks, setWebhooks] = useState([]);
    const [loadingWebhooks, setLoadingWebhooks] = useState(false);
    const [newWebhook, setNewWebhook] = useState({ name: '', url: '', event: 'TASK_CREATED' });
    const [showWebhookModal, setShowWebhookModal] = useState(false);
    const [selectedOAuthTool, setSelectedOAuthTool] = useState(null);
    const [oauthForm, setOauthForm] = useState({ client_id: '', client_secret: '', access_token: '' });
    const [copiedCallback, setCopiedCallback] = useState(false);

    const callbackUrl = `${window.location.origin}/api/users/oauth/callback/`;

    const tools = [
        { 
            id: 'github', 
            name: 'GitHub', 
            icon: <Github size={24} className="text-gray-900" />, 
            desc: 'Sync issues, PRs, and branch deployments with tasks.',
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
        fetchConnections();
        fetchWebhooks();
    }, []);

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

    const handleOpenOAuthModal = (tool) => {
        setSelectedOAuthTool(tool);
        setOauthForm({ client_id: '', client_secret: '', access_token: '' });
    };

    const handleSaveOAuthConnection = async (e) => {
        e.preventDefault();
        if (!oauthForm.access_token && (!oauthForm.client_id || !oauthForm.client_secret)) {
            showToast('Enter a Personal Access Token or Client ID & Secret', 'error');
            return;
        }

        const toolId = selectedOAuthTool.id;
        setActionLoading(toolId);

        try {
            await api.post('/users/oauth/', {
                provider: toolId,
                provider_user_id: `${toolId}_user`,
                access_token: oauthForm.access_token || `app_${oauthForm.client_id}`,
                scopes: 'read,write'
            });
            setConnectedProviders(prev => [...prev.filter(p => p !== toolId), toolId]);
            showToast(`Connected to ${selectedOAuthTool.name}!`, 'success');
            setSelectedOAuthTool(null);
        } catch (err) {
            console.error('Error saving connection:', err);
            showToast('Failed to save connection. Verify credentials.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDisconnect = async (toolId) => {
        setActionLoading(toolId);
        try {
            await api.delete(`/users/oauth/?provider=${toolId}`);
            setConnectedProviders(prev => prev.filter(p => p !== toolId));
            showToast(`Disconnected ${toolId.toUpperCase()}`, 'info');
        } catch (err) {
            showToast('Failed to disconnect provider', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCopyCallback = () => {
        navigator.clipboard.writeText(callbackUrl);
        setCopiedCallback(true);
        setTimeout(() => setCopiedCallback(false), 2000);
        showToast('Callback URL copied to clipboard!', 'success');
    };

    const handleCreateWebhook = async (e) => {
        e.preventDefault();
        if (!newWebhook.name || !newWebhook.url) return;

        try {
            const res = await api.post('/automation/webhooks/', newWebhook);
            setWebhooks(prev => [...prev, res.data]);
            setNewWebhook({ name: '', url: '', event: 'TASK_CREATED' });
            setShowWebhookModal(false);
            showToast('Webhook registered successfully!', 'success');
        } catch (err) {
            console.error('Failed to register webhook:', err);
            showToast('Failed to register webhook', 'error');
        }
    };

    const handleTestWebhook = async (webhookId) => {
        try {
            const res = await api.post(`/automation/webhooks/${webhookId}/test/`);
            if (res.data.success) {
                showToast('Test payload delivered successfully!', 'success');
            } else {
                showToast(`Webhook delivery returned HTTP ${res.data.status_code}`, 'error');
            }
        } catch (err) {
            showToast('Failed to reach webhook endpoint', 'error');
        }
    };

    const handleDeleteWebhook = async (webhookId) => {
        try {
            await api.delete(`/automation/webhooks/${webhookId}/`);
            setWebhooks(prev => prev.filter(w => w.id !== webhookId));
            showToast('Webhook deleted', 'info');
        } catch (err) {
            showToast('Failed to delete webhook', 'error');
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10 pb-24 md:pb-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#172B4D]">Integrations & Ecosystem</h1>
                <p className="text-[#5E6C84] mt-1 text-base">
                    Connect third-party developer platforms, configure automated webhooks, and explore our public REST API.
                </p>
            </div>

            {/* Apps & Providers */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-[#172B4D]">Developer Platforms (OAuth 2.0)</h2>
                        <p className="text-xs text-[#5E6C84]">Direct platform synchronization using registered OAuth apps or Personal Access Tokens</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tools.map(tool => {
                        const isConnected = connectedProviders.includes(tool.id);
                        const isLoading = actionLoading === tool.id;

                        return (
                            <div key={tool.id} className="bg-white p-6 rounded-xl border border-[#DFE1E6] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-[#F4F5F7] rounded-lg flex items-center justify-center text-[#172B4D] shrink-0">
                                        {tool.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-[#172B4D] text-lg">{tool.name}</h3>
                                            {isConnected && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 flex items-center gap-1">
                                                    <CheckCircle2 size={11} /> Connected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-[#5E6C84] mt-1">{tool.desc}</p>
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-[#DFE1E6] flex items-center justify-between">
                                    <a
                                        href={tool.docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#0052CC] hover:underline flex items-center gap-1 font-medium"
                                    >
                                        OAuth Docs <ExternalLink size={12} />
                                    </a>

                                    {isConnected ? (
                                        <button
                                            onClick={() => handleDisconnect(tool.id)}
                                            disabled={isLoading}
                                            className="px-3 py-1.5 rounded-md text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                        >
                                            {isLoading ? <RefreshCw size={13} className="animate-spin" /> : 'Disconnect'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleOpenOAuthModal(tool)}
                                            disabled={isLoading || loading}
                                            className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                        >
                                            <Settings size={13} /> Configure App
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Webhooks Section */}
            <div className="bg-white p-6 rounded-xl border border-[#DFE1E6] shadow-sm">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-50 text-[#0052CC]">
                            <WebhookIcon size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold text-[#172B4D]">Outbound Webhooks</h2>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">Live & Active</span>
                            </div>
                            <p className="text-sm text-[#5E6C84]">Trigger instant HTTP POST callbacks when project tasks, tickets, or SLA events occur.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowWebhookModal(true)}
                        className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
                    >
                        + Add Webhook
                    </button>
                </div>

                {loadingWebhooks ? (
                    <div className="py-8 text-center text-[#5E6C84]">Loading webhooks...</div>
                ) : webhooks.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-[#DFE1E6] rounded-lg text-[#5E6C84]">
                        <WebhookIcon size={36} className="mx-auto mb-2 opacity-40 text-[#0052CC]" />
                        <p className="font-medium text-[#172B4D]">No active webhooks configured</p>
                        <p className="text-xs text-[#5E6C84] mt-1 max-w-sm mx-auto">Create an endpoint to receive real-time JSON payloads for tasks, tickets, and automated workflow triggers.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#EBECF0]">
                        {webhooks.map(wh => (
                            <div key={wh.id} className="py-4 flex items-center justify-between flex-wrap gap-3">
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
                                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1.5 transition-colors"
                                        title="Send test payload"
                                    >
                                        <PlayCircle size={14} /> Send Test Ping
                                    </button>
                                    <button
                                        onClick={() => handleDeleteWebhook(wh.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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

            {/* Ecosystem API Marketplace & Developer Studio (Roadmap 5.3) */}
            <DeveloperApiStudio />

            {/* Modal for OAuth App Setup */}
            {selectedOAuthTool && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-4 border-b border-[#DFE1E6]">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-[#F4F5F7] rounded-lg">{selectedOAuthTool.icon}</div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#172B4D]">Connect {selectedOAuthTool.name}</h3>
                                    <p className="text-xs text-[#5E6C84]">Configure credentials to link your account</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedOAuthTool(null)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSaveOAuthConnection} className="space-y-4 pt-4">
                            {/* Callback URL info */}
                            <div className="p-3 bg-[#F4F5F7] rounded-lg border border-[#DFE1E6]">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">OAuth 2.0 Redirect URI</span>
                                    <button
                                        type="button"
                                        onClick={handleCopyCallback}
                                        className="text-xs text-[#0052CC] hover:underline flex items-center gap-1 font-bold"
                                    >
                                        {copiedCallback ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                                    </button>
                                </div>
                                <code className="text-xs font-mono text-[#172B4D] break-all block select-all">{callbackUrl}</code>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Personal Access Token (Quick Connect)</label>
                                <input
                                    type="password"
                                    placeholder="ghp_xxxx or token..."
                                    value={oauthForm.access_token}
                                    onChange={e => setOauthForm({ ...oauthForm, access_token: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded-md text-sm outline-none focus:border-[#0052CC] font-mono"
                                />
                                <p className="text-[10px] text-[#5E6C84] mt-1">Recommended for development or private bot tokens.</p>
                            </div>

                            <div className="relative flex py-1 items-center">
                                <div className="flex-grow border-t border-[#DFE1E6]"></div>
                                <span className="flex-shrink mx-3 text-xs text-[#5E6C84] uppercase font-bold">Or OAuth App</span>
                                <div className="flex-grow border-t border-[#DFE1E6]"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Client ID</label>
                                    <input
                                        type="text"
                                        placeholder="OAuth Client ID"
                                        value={oauthForm.client_id}
                                        onChange={e => setOauthForm({ ...oauthForm, client_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded-md text-sm outline-none focus:border-[#0052CC]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Client Secret</label>
                                    <input
                                        type="password"
                                        placeholder="OAuth Secret"
                                        value={oauthForm.client_secret}
                                        onChange={e => setOauthForm({ ...oauthForm, client_secret: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded-md text-sm outline-none focus:border-[#0052CC]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-[#DFE1E6]">
                                <button
                                    type="button"
                                    onClick={() => setSelectedOAuthTool(null)}
                                    className="px-4 py-2 border border-[#DFE1E6] rounded-md text-sm font-bold text-[#42526E] hover:bg-[#F4F5F7]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading === selectedOAuthTool.id}
                                    className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-md text-sm font-bold transition-all"
                                >
                                    {actionLoading === selectedOAuthTool.id ? 'Connecting...' : 'Connect Provider'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for New Webhook */}
            {showWebhookModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-3 border-b border-[#DFE1E6] mb-4">
                            <h3 className="text-lg font-bold text-[#172B4D]">Register Outbound Webhook</h3>
                            <button onClick={() => setShowWebhookModal(false)} className="p-1 hover:bg-[#EBECF0] rounded"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateWebhook} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Webhook Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. CI/CD Deploy Trigger"
                                    value={newWebhook.name}
                                    onChange={e => setNewWebhook({ ...newWebhook, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded-md text-sm outline-none focus:border-[#0052CC]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Target Endpoint URL</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://your-server.com/api/webhook"
                                    value={newWebhook.url}
                                    onChange={e => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded-md text-sm outline-none focus:border-[#0052CC] font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Trigger Event</label>
                                <select
                                    value={newWebhook.event}
                                    onChange={e => setNewWebhook({ ...newWebhook, event: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded-md text-sm outline-none focus:border-[#0052CC] bg-white"
                                >
                                    <option value="TASK_CREATED">Task Created</option>
                                    <option value="TASK_COMPLETED">Task Completed</option>
                                    <option value="TICKET_CREATED">Ticket Created</option>
                                    <option value="TICKET_RESOLVED">Ticket Resolved</option>
                                    <option value="SPRINT_STARTED">Sprint Started</option>
                                    <option value="SLA_BREACHED">SLA Breached</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-[#DFE1E6]">
                                <button
                                    type="button"
                                    onClick={() => setShowWebhookModal(false)}
                                    className="px-4 py-2 border border-[#DFE1E6] rounded-md text-sm font-bold text-[#42526E] hover:bg-[#F4F5F7]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-md text-sm font-bold"
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
