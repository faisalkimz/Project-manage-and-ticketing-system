import { useState } from 'react';
import { 
    Key, 
    Terminal, 
    Copy, 
    Check, 
    Plus, 
    Trash2, 
    ExternalLink, 
    Shield, 
    Code, 
    Zap, 
    CheckCircle2,
    X
} from 'lucide-react';
import { useToast } from './Toast';

const DeveloperApiStudio = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('curl');
    const [copiedKeyId, setCopiedKeyId] = useState(null);
    const [copiedSnippet, setCopiedSnippet] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [selectedScopes, setSelectedScopes] = useState(['read:projects', 'write:tasks']);

    const [apiKeys, setApiKeys] = useState(() => {
        const saved = localStorage.getItem('omni_api_keys');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { }
        }
        return [
            {
                id: 'key-1',
                name: 'Default CI/CD Integration',
                key: 'pf_live_7c4e92a108b39d84f1074a38',
                scopes: ['read:projects', 'write:tasks', 'read:tickets'],
                createdAt: 'Nov 12, 2026'
            }
        ];
    });

    const saveKeys = (keys) => {
        setApiKeys(keys);
        localStorage.setItem('omni_api_keys', JSON.stringify(keys));
    };

    const handleCopy = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedKeyId(id);
        showToast('API Key copied to clipboard', 'success');
        setTimeout(() => setCopiedKeyId(null), 2000);
    };

    const handleCreateKey = (e) => {
        e.preventDefault();
        if (!newKeyName.trim()) {
            showToast('Enter a key name', 'error');
            return;
        }

        const randHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        const generatedKey = `pf_live_${randHex}`;

        const newEntry = {
            id: `key-${Date.now()}`,
            name: newKeyName.trim(),
            key: generatedKey,
            scopes: selectedScopes,
            createdAt: 'Just now'
        };

        const updated = [newEntry, ...apiKeys];
        saveKeys(updated);
        setShowCreateModal(false);
        setNewKeyName('');
        showToast('API Key generated successfully!', 'success');
    };

    const handleRevokeKey = (id) => {
        const updated = apiKeys.filter(k => k.id !== id);
        saveKeys(updated);
        showToast('API Key revoked', 'info');
    };

    const toggleScope = (scope) => {
        setSelectedScopes(prev => 
            prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
        );
    };

    const activeToken = apiKeys[0]?.key || 'pf_live_your_api_token';

    const snippets = {
        curl: `curl -X POST https://api.omni-pms.local/api/projects/tasks/ \\
  -H "Authorization: Bearer ${activeToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project": 1,
    "title": "Automated deployment task",
    "priority": "HIGH",
    "description": "Triggered via Ecosystem API"
  }'`,
        python: `import requests

API_TOKEN = "${activeToken}"
url = "https://api.omni-pms.local/api/projects/tasks/"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

payload = {
    "project": 1,
    "title": "Automated deployment task",
    "priority": "HIGH",
    "description": "Triggered via Python SDK"
}

response = requests.post(url, json=payload, headers=headers)
print("Created Task ID:", response.json().get("id"))`,
        node: `import axios from 'axios';

const API_TOKEN = '${activeToken}';

const createTask = async () => {
  const { data } = await axios.post(
    'https://api.omni-pms.local/api/projects/tasks/',
    {
      project: 1,
      title: 'Automated deployment task',
      priority: 'HIGH',
      description: 'Triggered via Node.js SDK'
    },
    {
      headers: { Authorization: \`Bearer \${API_TOKEN}\` }
    }
  );
  console.log('Created Task ID:', data.id);
};

createTask();`
    };

    const handleCopySnippet = () => {
        navigator.clipboard.writeText(snippets[activeTab]);
        setCopiedSnippet(true);
        showToast('Code snippet copied!', 'success');
        setTimeout(() => setCopiedSnippet(false), 2000);
    };

    return (
        <div className="space-y-8">
            {/* API Keys Header & List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                            <Key size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">API Key Management</h2>
                            <p className="text-xs text-slate-500">Generate and manage developer tokens to access projects, tasks, and support tickets via REST.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={16} /> Generate New Key
                    </button>
                </div>

                <div className="mt-6 space-y-4">
                    {apiKeys.map(k => (
                        <div key={k.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-200 transition">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">{k.name}</span>
                                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-700">
                                        {k.key.substring(0, 10)}••••••••••••••••{k.key.substring(k.key.length - 4)}
                                    </code>
                                    <button
                                        onClick={() => handleCopy(k.id, k.key)}
                                        className="p-1 text-slate-400 hover:text-indigo-600 transition"
                                        title="Copy Token"
                                    >
                                        {copiedKeyId === k.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                    {k.scopes.map(s => (
                                        <span key={s} className="text-[10px] font-medium bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded">
                                            {s}
                                        </span>
                                    ))}
                                    <span className="text-[10px] text-slate-400 ml-1">Created {k.createdAt}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleRevokeKey(k.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-200 flex items-center gap-1.5 shrink-0"
                            >
                                <Trash2 size={13} /> Revoke Key
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Interactive Code Playground / SDK Studio */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                            <Terminal size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Developer SDK & Quickstart</h3>
                            <p className="text-xs text-slate-400">Copy code recipes in your preferred language to interact with your workspace API.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                            {[
                                { id: 'curl', label: 'cURL' },
                                { id: 'python', label: 'Python' },
                                { id: 'node', label: 'Node.js' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 py-1 rounded text-xs font-bold transition ${
                                        activeTab === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleCopySnippet}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
                            title="Copy snippet"
                        >
                            {copiedSnippet ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                <div className="bg-black/50 rounded-xl p-4 border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-300 leading-relaxed">
                    <pre>{snippets[activeTab]}</pre>
                </div>
            </div>

            {/* Create API Key Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Key size={18} className="text-indigo-600" />
                                <h3 className="font-bold text-slate-900 text-base">Generate API Key</h3>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded">
                                <X size={18} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateKey} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Key Description / Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. GitHub Actions Bot or Zapier Sync"
                                    value={newKeyName}
                                    onChange={e => setNewKeyName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Permission Scopes</label>
                                <div className="space-y-2">
                                    {[
                                        { id: 'read:projects', label: 'Read Projects & Sprints' },
                                        { id: 'write:tasks', label: 'Create & Update Tasks' },
                                        { id: 'read:tickets', label: 'Access Customer Support Tickets' },
                                        { id: 'admin:all', label: 'Full Admin Privileges' }
                                    ].map(scope => (
                                        <label
                                            key={scope.id}
                                            onClick={() => toggleScope(scope.id)}
                                            className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedScopes.includes(scope.id)}
                                                onChange={() => {}}
                                                className="rounded text-indigo-600"
                                            />
                                            {scope.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
                                >
                                    Generate Token
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeveloperApiStudio;
