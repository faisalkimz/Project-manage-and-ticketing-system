import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowRight, Check, Users, Layout, Briefcase } from 'lucide-react';

const Onboarding = () => {
    const [step, setStep] = useState(0);
    const [workspaceName, setWorkspaceName] = useState('');
    const [boardName, setBoardName] = useState('');
    const [emails, setEmails] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleNext = async () => {
        if (step === 3) {
            await finishOnboarding();
        } else {
            setStep(step + 1);
        }
    };

    const finishOnboarding = async () => {
        setLoading(true);
        try {
            // 1. Create Team
            let teamId = null;
            if (workspaceName) {
                const teamRes = await api.post('/users/teams/', {
                    name: workspaceName,
                    description: 'My First Workspace'
                });
                teamId = teamRes.data.id;
            }

            // 2. Create Project
            if (boardName) {
                await api.post('/projects/', {
                    name: boardName,
                    description: 'My first project board',
                    status: 'ACTIVE',
                });
            }

            // 3. Invites
            if (emails) {
                const emailList = emails.split(',').map(e => e.trim());
                for (const email of emailList) {
                    if (email) {
                        try {
                            await api.post('/users/invites/', { email, role_name: 'EMPLOYEE' });
                        } catch (e) { console.error('Invite failed', email); }
                    }
                }
            }

            navigate('/');
        } catch (error) {
            console.error('Onboarding failed', error);
            alert("Something went wrong, but let's take you to the dashboard.");
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="h-16 flex items-center justify-center border-b border-[#DFE1E6]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#0079BF] rounded-[3px] flex items-center justify-center font-bold text-white text-sm">M</div>
                    <span className="font-bold text-[#172B4D] tracking-tight">Mbabali</span>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-lg">
                    {/* Progress */}
                    <div className="flex justify-center mb-12 gap-2">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`h-1 w-16 rounded-full transition-colors ${i <= step ? 'bg-[#0079BF]' : 'bg-[#DFE1E6]'}`} />
                        ))}
                    </div>

                    {step === 0 && (
                        <div className="text-center animate-fade-in">
                            <h1 className="text-3xl font-bold text-[#172B4D] mb-4">Welcome to Mbabali!</h1>
                            <p className="text-lg text-[#5E6C84] mb-8">Let's get you set up specifically for your workflow.</p>
                            <button onClick={() => setStep(1)} className="px-8 py-3 bg-[#0079BF] text-white font-bold rounded-[3px] text-lg hover:bg-[#026AA7] transition-colors">
                                Let's go
                            </button>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="animate-fade-in">
                            <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Name your Workspace</label>
                            <h2 className="text-2xl font-bold text-[#172B4D] mb-6">What's the name of your team or company?</h2>
                            <div className="flex gap-4 items-center border-2 border-[#DFE1E6] p-1 rounded-[3px] focus-within:border-[#0079BF] transition-colors mb-8">
                                <span className="pl-3 text-[#5E6C84]"><Briefcase /></span>
                                <input
                                    autoFocus
                                    type="text"
                                    className="flex-1 p-2 outline-none text-lg text-[#172B4D]"
                                    placeholder="e.g. Acme Corp, Marketing Team"
                                    value={workspaceName}
                                    onChange={e => setWorkspaceName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleNext()}
                                />
                            </div>
                            <button onClick={handleNext} disabled={!workspaceName} className="w-full py-3 bg-[#0079BF] text-white font-bold rounded-[3px] hover:bg-[#026AA7] disabled:opacity-50 transition-colors">
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in">
                            <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Create your first Board</label>
                            <h2 className="text-2xl font-bold text-[#172B4D] mb-6">What are you working on right now?</h2>
                            <div className="flex gap-4 items-center border-2 border-[#DFE1E6] p-1 rounded-[3px] focus-within:border-[#0079BF] transition-colors mb-8">
                                <span className="pl-3 text-[#5E6C84]"><Layout /></span>
                                <input
                                    autoFocus
                                    type="text"
                                    className="flex-1 p-2 outline-none text-lg text-[#172B4D]"
                                    placeholder="e.g. Website Launch, Q1 Goals"
                                    value={boardName}
                                    onChange={e => setBoardName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleNext()}
                                />
                            </div>
                            <button onClick={handleNext} disabled={!boardName} className="w-full py-3 bg-[#0079BF] text-white font-bold rounded-[3px] hover:bg-[#026AA7] disabled:opacity-50 transition-colors">
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in">
                            <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-2">Invite your Team</label>
                            <h2 className="text-2xl font-bold text-[#172B4D] mb-6">Who else is on your team?</h2>
                            <div className="flex gap-4 items-start border-2 border-[#DFE1E6] p-1 rounded-[3px] focus-within:border-[#0079BF] transition-colors mb-8">
                                <span className="pl-3 pt-3 text-[#5E6C84]"><Users /></span>
                                <textarea
                                    autoFocus
                                    className="flex-1 p-2 outline-none text-lg text-[#172B4D] min-h-[100px] resize-none"
                                    placeholder="Enter email addresses separated by commas..."
                                    value={emails}
                                    onChange={e => setEmails(e.target.value)}
                                />
                            </div>
                            <button onClick={finishOnboarding} disabled={loading} className="w-full py-3 bg-[#0079BF] text-white font-bold rounded-[3px] hover:bg-[#026AA7] disabled:opacity-50 transition-colors flex justify-center items-center gap-2">
                                {loading ? 'Setting up...' : (
                                    <>
                                        <span>Take me to my board</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                            <button onClick={finishOnboarding} className="w-full mt-4 text-[#5E6C84] text-sm hover:underline">
                                I'll do this later
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 text-center">
                <img src="https://a.trellocdn.com/prgb/dist/images/login/login-background.01b7c4a1b02170364c7e.svg" alt="" className="hidden" />
                {/* Placeholder for illustration logic if desired */}
            </div>
        </div>
    );
};

export default Onboarding;
