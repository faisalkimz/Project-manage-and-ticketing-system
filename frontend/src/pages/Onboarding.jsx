import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ArrowRight, Check, Users, Layout, Briefcase, Sparkles,
    Kanban, Bug, Rocket, Shield, Layers, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useToast } from '../components/Toast';

const TEMPLATES = [
    {
        id: 'scrum',
        name: 'Scrum / Agile Sprint',
        desc: 'Sprints, backlog, story points, burndown tracking, and velocity analytics.',
        icon: Rocket,
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: 'kanban',
        name: 'Kanban Flow',
        desc: 'Continuous delivery board with WIP limits, Backlog, In Progress, Review, Done.',
        icon: Kanban,
        color: 'from-emerald-500 to-teal-600'
    },
    {
        id: 'bug_tracker',
        name: 'Bug Tracker & Triage',
        desc: 'Severity classification, triage queue, AI root-cause analysis, and SLAs.',
        icon: Bug,
        color: 'from-rose-500 to-amber-600'
    },
    {
        id: 'roadmap',
        name: 'Product Roadmap & Portfolio',
        desc: 'Milestones, high-level deliverables, Gantt timeline, and cross-team dependencies.',
        icon: Layers,
        color: 'from-purple-500 to-violet-600'
    }
];

const Onboarding = () => {
    const [step, setStep] = useState(0);
    const [workspaceName, setWorkspaceName] = useState('');
    const [boardName, setBoardName] = useState('My First Sprint');
    const [selectedTemplate, setSelectedTemplate] = useState('scrum');
    const [emails, setEmails] = useState('');
    const [inviteRole, setInviteRole] = useState('DEVELOPER');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleNext = () => {
        if (step === 3) {
            finishOnboarding();
        } else {
            setStep(step + 1);
        }
    };

    const finishOnboarding = async () => {
        setLoading(true);
        try {
            // 1. Create Team / Workspace
            let teamId = null;
            if (workspaceName.trim()) {
                const teamRes = await api.post('/users/teams/', {
                    name: workspaceName.trim(),
                    description: 'Primary Team Workspace'
                });
                teamId = teamRes.data.id;
            }

            // 2. Create Initial Project Board
            let createdProjectId = null;
            if (boardName.trim()) {
                const projRes = await api.post('/projects/projects/', {
                    name: boardName.trim(),
                    description: `Created via ${TEMPLATES.find(t => t.id === selectedTemplate)?.name || 'Standard'} template`,
                    status: 'ACTIVE',
                    team_id: teamId
                });
                createdProjectId = projRes.data.id;
            }

            // 3. Send Team Invites if provided
            if (emails.trim()) {
                const emailList = emails.split(',').map(e => e.trim()).filter(Boolean);
                for (const email of emailList) {
                    try {
                        await api.post('/users/invites/', {
                            email,
                            role_name: inviteRole
                        });
                    } catch (e) {
                        console.error('Invite error for', email, e);
                    }
                }
                showToast(`Sent ${emailList.length} team invite(s)!`, 'success');
            }

            showToast('Workspace initialized successfully!', 'success');

            // Redirect directly to the new project or dashboard
            if (createdProjectId) {
                navigate(`/projects/${createdProjectId}`);
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            showToast('Setup encountered a minor issue; taking you to your dashboard.', 'info');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-sm">
                        M
                    </div>
                    <span className="font-bold text-slate-900 tracking-tight text-lg">Omni-PMS</span>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === step
                                    ? 'w-10 bg-indigo-600'
                                    : i < step
                                    ? 'w-6 bg-emerald-500'
                                    : 'w-6 bg-slate-200'
                            }`}
                        />
                    ))}
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                    Skip setup
                </button>
            </header>

            {/* Main Stage */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-xl bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200/90 animate-scale-in">
                    {/* Step 0: Welcome & Purpose */}
                    {step === 0 && (
                        <div className="space-y-6 text-center">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                                    Welcome to Omni-PMS
                                </h1>
                                <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                                    Your unified platform for agile sprint planning, automated ticketing, AI-assisted work breakdowns, and team wikis.
                                </p>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                                >
                                    <span>Let's Set Up Your Workspace</span>
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Workspace Name */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                    Step 1 of 3
                                </span>
                                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                                    Name your Workspace
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    This acts as the organization hub for all your team's projects, tickets, and docs.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Workspace / Team Name
                                </label>
                                <div className="flex items-center gap-3 border-2 border-slate-200 rounded-xl px-4 py-3 focus-within:border-indigo-600 transition bg-slate-50 focus-within:bg-white">
                                    <Briefcase className="text-slate-400 shrink-0" size={20} />
                                    <input
                                        autoFocus
                                        type="text"
                                        className="flex-1 outline-none text-slate-900 bg-transparent font-medium"
                                        placeholder="e.g. Engineering Core, Acme Labs"
                                        value={workspaceName}
                                        onChange={(e) => setWorkspaceName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && workspaceName && setStep(2)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={() => setStep(0)}
                                    className="px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!workspaceName.trim()}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: First Project Board & Template Selection */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                    Step 2 of 3
                                </span>
                                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                                    Choose Your Project Template
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Pick a pre-configured workflow tailored to how your team builds.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    First Board Name
                                </label>
                                <div className="flex items-center gap-3 border-2 border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-indigo-600 transition bg-slate-50 focus-within:bg-white">
                                    <Layout className="text-slate-400 shrink-0" size={18} />
                                    <input
                                        type="text"
                                        className="flex-1 outline-none text-slate-900 bg-transparent font-medium text-sm"
                                        placeholder="e.g. Platform Revamp, Sprint Alpha"
                                        value={boardName}
                                        onChange={(e) => setBoardName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Template Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {TEMPLATES.map((tpl) => {
                                    const isSelected = selectedTemplate === tpl.id;
                                    const Icon = tpl.icon;
                                    return (
                                        <button
                                            key={tpl.id}
                                            type="button"
                                            onClick={() => setSelectedTemplate(tpl.id)}
                                            className={`p-3.5 text-left rounded-xl border-2 transition relative flex flex-col justify-between ${
                                                isSelected
                                                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className={`p-2 rounded-lg bg-gradient-to-tr ${tpl.color} text-white shadow-sm`}>
                                                    <Icon size={16} />
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 size={18} className="text-indigo-600" />
                                                )}
                                            </div>
                                            <div className="mt-2.5">
                                                <div className="font-bold text-xs text-slate-900">{tpl.name}</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                                                    {tpl.desc}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!boardName.trim()}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Team Invites */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                    Step 3 of 3
                                </span>
                                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                                    Invite Teammates
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Collaborate in real time with shared kanban cards, backlog estimation, and wiki docs.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Teammate Email Addresses
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-slate-400 font-medium">Default Role:</span>
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700"
                                        >
                                            <option value="DEVELOPER">Developer</option>
                                            <option value="PROJECT_MANAGER">Project Manager</option>
                                            <option value="EMPLOYEE">Member</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="border-2 border-slate-200 rounded-xl p-3 focus-within:border-indigo-600 transition bg-slate-50 focus-within:bg-white">
                                    <textarea
                                        autoFocus
                                        className="w-full outline-none text-slate-900 bg-transparent text-sm min-h-[90px] resize-none"
                                        placeholder="alice@company.com, bob@company.com..."
                                        value={emails}
                                        onChange={(e) => setEmails(e.target.value)}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400">Separate multiple emails with commas.</p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={finishOnboarding}
                                    disabled={loading}
                                    className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <span>Setting Up Workspace...</span>
                                    ) : (
                                        <>
                                            <span>Launch My Workspace</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={finishOnboarding}
                                    disabled={loading}
                                    className="w-full text-xs font-semibold text-slate-400 hover:text-slate-600 transition text-center py-1"
                                >
                                    I'll invite teammates later
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <footer className="py-4 text-center text-xs text-slate-400">
                Omni-PMS • Open Source Project Management & Ticketing
            </footer>
        </div>
    );
};

export default Onboarding;
