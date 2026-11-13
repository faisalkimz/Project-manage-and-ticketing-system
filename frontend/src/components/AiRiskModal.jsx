import React from 'react';
import { Sparkles, X, Target, Loader2, AlertTriangle, ShieldCheck, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

const AiRiskModal = ({
    isOpen,
    onClose,
    isLoading,
    riskData,
    onRerun
}) => {
    if (!isOpen) return null;

    const riskLevel = riskData?.risk_level || 'LOW';

    const getRiskBadge = (level) => {
        switch (level) {
            case 'CRITICAL':
                return {
                    bg: 'bg-red-50 border-red-200 text-red-700',
                    icon: <AlertTriangle size={24} className="text-red-600" />,
                    label: 'Critical Risk',
                    sub: 'High probability of milestone delivery delay'
                };
            case 'HIGH':
                return {
                    bg: 'bg-orange-50 border-orange-200 text-orange-700',
                    icon: <AlertCircle size={24} className="text-orange-600" />,
                    label: 'High Risk',
                    sub: 'Bottlenecks detected in active sprint'
                };
            case 'MEDIUM':
                return {
                    bg: 'bg-amber-50 border-amber-200 text-amber-700',
                    icon: <TrendingUp size={24} className="text-amber-600" />,
                    label: 'Moderate Risk',
                    sub: 'Minor backlog impediments observed'
                };
            default:
                return {
                    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                    icon: <ShieldCheck size={24} className="text-emerald-600" />,
                    label: 'Healthy / Low Risk',
                    sub: 'Project velocity aligns with milestone targets'
                };
        }
    };

    const badge = getRiskBadge(riskLevel);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-purple-200 animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#DFE1E6]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-[#172B4D]">AI Delivery Risk Radar</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700">Predictive</span>
                            </div>
                            <p className="text-xs text-[#5E6C84]">AI analysis of project velocity, overdue tasks, and bottleneck milestones</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-[#EBECF0] rounded-full text-[#5E6C84]">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                        <Loader2 size={36} className="animate-spin text-purple-600" />
                        <p className="text-base font-bold text-[#172B4D]">Running Delivery Risk Heuristics...</p>
                        <p className="text-xs text-[#5E6C84] max-w-sm">Assessing task completion velocity, unresolved critical blockers, and team distribution</p>
                    </div>
                ) : riskData ? (
                    <div className="py-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                        {/* Risk Score Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${badge.bg}`}>
                                <div className="mb-1">{badge.icon}</div>
                                <div className="text-2xl font-black">{badge.label}</div>
                                <span className="text-[11px] font-semibold mt-1 opacity-80">{badge.sub}</span>
                            </div>

                            <div className="md:col-span-2 p-4 bg-[#F4F5F7] rounded-xl border border-[#DFE1E6] flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider mb-1">AI Executive Summary</span>
                                <p className="text-xs text-[#172B4D] leading-relaxed">
                                    {riskData.summary || 'Project backlog velocity is stable. Continue monitoring scheduled release milestones.'}
                                </p>
                            </div>
                        </div>

                        {/* Recommendations */}
                        {riskData.recommendations && riskData.recommendations.length > 0 && (
                            <div className="bg-white border border-[#DFE1E6] rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                                    <Target size={14} className="text-[#0052CC]" /> Strategic Interventions & Action Items
                                </h4>
                                <ul className="space-y-2">
                                    {riskData.recommendations.map((rec, i) => (
                                        <li key={i} className="text-xs text-[#172B4D] flex items-start gap-2.5 bg-[#FAFBFC] p-2.5 rounded-lg border border-[#DFE1E6]">
                                            <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">{i + 1}</span>
                                            <span className="leading-snug font-medium">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center text-sm text-[#5E6C84]">
                        <p>No risk assessment generated yet.</p>
                        <button onClick={onRerun} className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold shadow-sm">
                            Run Risk Radar
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-[#DFE1E6] flex items-center justify-between">
                    <span className="text-[11px] text-[#5E6C84]">Powered by OpenAI GPT-4o & Heuristic Risk Engine</span>
                    <div className="flex gap-2">
                        <button
                            onClick={onRerun}
                            disabled={isLoading}
                            className="px-3 py-1.5 border border-[#DFE1E6] hover:bg-[#F4F5F7] text-xs font-bold text-[#42526E] rounded-lg transition-colors"
                        >
                            Re-analyze
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-xs font-bold transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiRiskModal;

