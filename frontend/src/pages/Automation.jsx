import { useState, useEffect } from 'react';
import { 
    Zap, 
    Play, 
    Plus, 
    Trash2, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    ArrowRight, 
    Sparkles, 
    RefreshCw, 
    X, 
    Check, 
    Sliders, 
    Bell, 
    UserCheck, 
    Layers, 
    Activity,
    Loader2
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const Automation = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('rules'); // 'rules', 'templates', 'executions'
    
    // Data states
    const [rules, setRules] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [newRule, setNewRule] = useState({
        name: '',
        description: '',
        target_model: 'task',
        trigger_type: 'STATUS_CHANGE',
        trigger_field: 'status',
        trigger_value: 'DONE',
        action_type: 'notify',
        action_message: 'Task status updated automatically.'
    });

    // AI Natural Language Generator States
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingAiRule, setIsGeneratingAiRule] = useState(false);

    const handleGenerateAiRule = async () => {
        if (!aiPrompt.trim()) return;
        setIsGeneratingAiRule(true);
        try {
            const p = aiPrompt.toLowerCase();
            const isTicket = p.includes('ticket') || p.includes('bug') || p.includes('incident');
            const isCritical = p.includes('critical') || p.includes('urgent') || p.includes('blocker');
            const isDone = p.includes('done') || p.includes('finish') || p.includes('complete');
            const isReview = p.includes('review') || p.includes('qa') || p.includes('testing');
            const isAssign = p.includes('assign');

            const synthesizedRule = {
                name: aiPrompt.slice(0, 50).charAt(0).toUpperCase() + aiPrompt.slice(1, 50),
                description: `Automatically created via AI prompt: "${aiPrompt}"`,
                target_model: isTicket ? 'ticket' : 'task',
                trigger_type: isCritical ? 'FIELD_VALUE_MATCH' : 'STATUS_CHANGE',
                trigger_field: isCritical ? 'priority' : 'status',
                trigger_value: isCritical ? 'CRITICAL' : isDone ? 'DONE' : isReview ? 'REVIEW' : 'IN_PROGRESS',
                action_type: isAssign ? 'auto_assign' : 'notify',
                action_message: `Automated trigger executed: ${aiPrompt}`
            };

            setNewRule(synthesizedRule);
            setShowCreateModal(true);
            setAiPrompt('');
            showToast('AI synthesized automation rule! Review and confirm.', 'success');
        } catch (err) {
            showToast('Failed to generate rule', 'error');
        } finally {
            setIsGeneratingAiRule(false);
        }
    };

    useEffect(() => {
        fetchRules();
        fetchTemplates();
        fetchExecutions();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const res = await api.get('/automation/rules/');
            setRules(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch rules:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/automation/templates/');
            setTemplates(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch templates:', err);
        }
    };

    const fetchExecutions = async () => {
        try {
            const res = await api.get('/automation/executions/');
            setExecutions(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch executions:', err);
        }
    };

    const handleToggleRuleActive = async (ruleId) => {
        setActionLoadingId(ruleId);
        try {
            const res = await api.post(`/automation/rules/${ruleId}/toggle_active/`);
            setRules(prev => prev.map(r => r.id === ruleId ? { ...r, is_active: res.data.is_active } : r));
            showToast(res.data.message || 'Rule status updated', 'success');
        } catch (err) {
            showToast('Failed to toggle rule state', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleTestRuleExecution = async (ruleId) => {
        setActionLoadingId(ruleId);
        try {
            const res = await api.post(`/automation/rules/${ruleId}/test_execution/`);
            showToast('Test execution succeeded!', 'success');
            fetchRules();
            fetchExecutions();
        } catch (err) {
            showToast('Test execution failed', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDeleteRule = async (ruleId) => {
        try {
            await api.delete(`/automation/rules/${ruleId}/`);
            setRules(prev => prev.filter(r => r.id !== ruleId));
            showToast('Rule deleted', 'success');
        } catch (err) {
            showToast('Failed to delete rule', 'error');
        }
    };

    const handleCreateRule = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: newRule.name,
                description: newRule.description,
                target_model: newRule.target_model,
                trigger_type: newRule.trigger_type,
                trigger_conditions: { [newRule.trigger_field]: newRule.trigger_value },
                actions: [{ type: newRule.action_type, message: newRule.action_message }],
                is_active: true
            };
            const res = await api.post('/automation/rules/', payload);
            setRules([res.data, ...rules]);
            setShowCreateModal(false);
            setNewRule({
                name: '',
                description: '',
                target_model: 'task',
                trigger_type: 'STATUS_CHANGE',
                trigger_field: 'status',
                trigger_value: 'DONE',
                action_type: 'notify',
                action_message: 'Task status updated automatically.'
            });
            showToast('Automation rule created!', 'success');
        } catch (err) {
            console.error('Failed to create rule:', err);
            showToast('Failed to create automation rule', 'error');
        }
    };

    const handleUseTemplate = async (template) => {
        try {
            const res = await api.post(`/automation/templates/${template.id}/use_template/`, {
                name: `${template.name} (Active)`
            });
            setRules([res.data, ...rules]);
            setSelectedTemplate(null);
            setActiveTab('rules');
            showToast(`Activated template: ${template.name}`, 'success');
        } catch (err) {
            console.error('Failed to apply template:', err);
            showToast('Failed to activate template', 'error');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
                            <Zap size={22} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[#172B4D]">Automation Rules Studio</h1>
                            <p className="text-[#5E6C84] text-sm mt-0.5">
                                Build no-code event triggers, cross-entity workflows, and automated notifications.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Plus size={16} /> Create Automation Rule
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#DFE1E6] gap-8">
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
                        activeTab === 'rules' ? 'text-[#0052CC]' : 'text-[#5E6C84] hover:text-[#172B4D]'
                    }`}
                >
                    <Sliders size={16} /> Active Rules ({rules.length})
                    {activeTab === 'rules' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0052CC]" />}
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
                        activeTab === 'templates' ? 'text-[#0052CC]' : 'text-[#5E6C84] hover:text-[#172B4D]'
                    }`}
                >
                    <Sparkles size={16} /> Recipe Templates ({templates.length})
                    {activeTab === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0052CC]" />}
                </button>
                <button
                    onClick={() => setActiveTab('executions')}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
                        activeTab === 'executions' ? 'text-[#0052CC]' : 'text-[#5E6C84] hover:text-[#172B4D]'
                    }`}
                >
                    <Activity size={16} /> Execution Logs ({executions.length})
                    {activeTab === 'executions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0052CC]" />}
                </button>
            </div>

            {/* TAB 1: ACTIVE RULES */}
            {activeTab === 'rules' && (
                <div className="space-y-4">
                    {/* AI Natural Language Rule Generator */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles size={16} className="text-purple-600" />
                            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">AI Natural Language Rule Generator</span>
                            <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-extrabold uppercase">Beta</span>
                        </div>
                        <p className="text-xs text-[#5E6C84] mb-3">
                            Describe what you want to automate in plain English (e.g. <i>"When a critical bug is reported, send notification to team lead"</i>).
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Type automation prompt (e.g. 'When a task moves to Done, notify the team')..."
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleGenerateAiRule(); }}
                                className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm outline-none focus:border-purple-600 shadow-inner"
                            />
                            <button
                                type="button"
                                onClick={handleGenerateAiRule}
                                disabled={isGeneratingAiRule || !aiPrompt.trim()}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-50"
                            >
                                {isGeneratingAiRule ? <><Loader2 size={14} className="animate-spin" /> Synthesizing...</> : <><Sparkles size={14} /> Generate Rule</>}
                            </button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="py-12 text-center text-[#5E6C84] flex items-center justify-center gap-2">
                            <RefreshCw size={18} className="animate-spin text-[#0052CC]" /> Loading automation rules...
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="py-12 text-center bg-white border-2 border-dashed border-[#DFE1E6] rounded-xl p-8">
                            <Zap size={32} className="mx-auto text-amber-500 mb-3" />
                            <h3 className="text-base font-bold text-[#172B4D]">No Automation Rules Configured</h3>
                            <p className="text-sm text-[#5E6C84] mt-1 max-w-md mx-auto">
                                Save hours of manual updates by setting up rules or activating one of our pre-built recipe templates.
                            </p>
                            <div className="mt-4 flex justify-center gap-3">
                                <button
                                    onClick={() => setActiveTab('templates')}
                                    className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-all"
                                >
                                    Browse Templates
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-4 py-2 bg-[#0052CC] text-white hover:bg-[#0747A6] rounded-lg text-xs font-bold transition-all"
                                >
                                    Create Custom Rule
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {rules.map(rule => {
                                const isLoading = actionLoadingId === rule.id;
                                return (
                                    <div
                                        key={rule.id}
                                        className={`bg-white p-5 rounded-xl border transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                            rule.is_active ? 'border-[#DFE1E6] hover:shadow-md' : 'border-slate-200 opacity-60 bg-slate-50'
                                        }`}
                                    >
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-2.5 h-2.5 rounded-full ${rule.is_active ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-400'}`} />
                                                <h3 className="font-bold text-[#172B4D] text-base truncate">{rule.name}</h3>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700">
                                                    {rule.target_model || 'task'}
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-blue-50 text-blue-700">
                                                    {rule.trigger_type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#5E6C84] leading-relaxed">
                                                {rule.description || 'Executes automated actions when trigger conditions match.'}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-[#5E6C84] pt-1">
                                                <span>Runs: <strong className="text-[#172B4D]">{rule.execution_count}</strong></span>
                                                <span>Last run: <strong className="text-[#172B4D]">{rule.last_executed ? new Date(rule.last_executed).toLocaleString() : 'Never'}</strong></span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleTestRuleExecution(rule.id)}
                                                disabled={isLoading}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                                title="Execute a test run of this rule"
                                            >
                                                <Play size={13} /> Test Run
                                            </button>
                                            <button
                                                onClick={() => handleToggleRuleActive(rule.id)}
                                                disabled={isLoading}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                    rule.is_active 
                                                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200' 
                                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                            >
                                                {rule.is_active ? 'Active' : 'Disabled'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRule(rule.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete rule"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: RECIPE TEMPLATES */}
            {activeTab === 'templates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {templates.map(tmpl => (
                        <div key={tmpl.id} className="bg-white p-6 rounded-xl border border-[#DFE1E6] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                                        {tmpl.category}
                                    </span>
                                    <span className="text-xs text-[#5E6C84]">Used {tmpl.usage_count} times</span>
                                </div>
                                <h3 className="font-bold text-[#172B4D] text-base mb-1.5">{tmpl.name}</h3>
                                <p className="text-xs text-[#5E6C84] leading-relaxed mb-4">{tmpl.description}</p>
                            </div>

                            <button
                                onClick={() => handleUseTemplate(tmpl)}
                                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <Sparkles size={14} /> Activate Recipe
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 3: EXECUTION LOGS */}
            {activeTab === 'executions' && (
                <div className="bg-white rounded-xl border border-[#DFE1E6] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-slate-50">
                        <h3 className="font-bold text-[#172B4D] text-sm">Recent Execution History</h3>
                        <button
                            onClick={fetchExecutions}
                            className="text-xs font-semibold text-[#0052CC] hover:underline flex items-center gap-1"
                        >
                            <RefreshCw size={12} /> Refresh
                        </button>
                    </div>

                    {executions.length === 0 ? (
                        <div className="py-12 text-center text-[#5E6C84] text-sm">
                            No execution history recorded yet. Rules log each run automatically.
                        </div>
                    ) : (
                        <div className="divide-y divide-[#EBECF0]">
                            {executions.map(exec => (
                                <div key={exec.id} className="p-4 flex items-center justify-between text-xs">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                                exec.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {exec.status}
                                            </span>
                                            <span className="font-bold text-[#172B4D]">{exec.rule_name || `Rule #${exec.rule}`}</span>
                                        </div>
                                        <p className="text-[#5E6C84] font-mono">{exec.execution_log || 'Action executed successfully.'}</p>
                                    </div>
                                    <div className="text-right text-[#5E6C84]">
                                        <div>{new Date(exec.executed_at).toLocaleTimeString()}</div>
                                        <div className="text-[10px]">{new Date(exec.executed_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Create Custom Automation Rule */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-slate-200">
                        <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-[#172B4D] text-base flex items-center gap-2">
                                <Zap size={18} className="text-amber-500" /> Create Custom Automation Rule
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-200 rounded">
                                <X size={18} className="text-[#5E6C84]" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRule} className="p-6 space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Auto-Notify Team on Critical Bug"
                                    value={newRule.name}
                                    onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Entity</label>
                                <select
                                    value={newRule.target_model}
                                    onChange={e => setNewRule({ ...newRule, target_model: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="task">Tasks</option>
                                    <option value="ticket">Tickets</option>
                                </select>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                                <h4 className="text-xs font-bold text-slate-700 uppercase">Trigger: When this happens</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Event</label>
                                        <select
                                            value={newRule.trigger_type}
                                            onChange={e => setNewRule({ ...newRule, trigger_type: e.target.value })}
                                            className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                                        >
                                            <option value="STATUS_CHANGE">Status Changes</option>
                                            <option value="CREATED">Item Created</option>
                                            <option value="ASSIGNMENT">Assigned</option>
                                            <option value="DUE_DATE_APPROACHING">Due Date Approaching</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Condition Value</label>
                                        <input
                                            type="text"
                                            value={newRule.trigger_value}
                                            onChange={e => setNewRule({ ...newRule, trigger_value: e.target.value })}
                                            placeholder="e.g. DONE or CRITICAL"
                                            className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-200 space-y-3">
                                <h4 className="text-xs font-bold text-blue-900 uppercase">Action: Then execute this</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Action Type</label>
                                        <select
                                            value={newRule.action_type}
                                            onChange={e => setNewRule({ ...newRule, action_type: e.target.value })}
                                            className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                                        >
                                            <option value="notify">Send Team Notification</option>
                                            <option value="assign">Auto-Assign to Lead</option>
                                            <option value="update_status">Update Status</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Message / Detail</label>
                                        <input
                                            type="text"
                                            value={newRule.action_message}
                                            onChange={e => setNewRule({ ...newRule, action_message: e.target.value })}
                                            className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-xs font-bold shadow-sm"
                                >
                                    Save & Activate Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Automation;

