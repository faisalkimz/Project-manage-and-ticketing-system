import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { LogIn, Lock, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await login(username, password);
        if (success) {
            navigate('/');
        } else {
            setError('Check your username and password again.');
        }
    };

    return (
        <div className="min-h-screen flex font-display bg-white overflow-hidden">
            {/* Visual Side */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-950 p-12 flex-col justify-between relative">
                <div className="absolute inset-0 bg-indigo-600/10 mix-blend-overlay"></div>
                <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]"></div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-slate-950 rounded-sm rotate-45"></div>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Manajeks</span>
                </div>

                <div className="relative z-10">
                    <h1 className="text-5xl font-bold text-white leading-tight mb-6">
                        Everything you need,<br />
                        in one workspace.
                    </h1>
                    <p className="text-slate-400 text-lg max-w-md">
                        Manage your project timelines, dev activities, and support tickets in a clean, high-performance platform.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-8 text-white/40 font-bold text-xs uppercase tracking-[0.2em]">
                    <span>Secure</span>
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full"></div>
                    <span>Fast</span>
                    <div className="w-1.5 h-1.5 bg-white/10 rounded-full"></div>
                    <span>Scalable</span>
                </div>
            </div>

            {/* Form Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50/50">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="mb-10 lg:hidden flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">Manajeks</span>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Login</h2>
                        <p className="text-slate-500 font-medium">Please enter your account details.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input
                                    type="text"
                                    className="input-field pl-12 py-3.5 bg-white border-slate-200 text-base shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300"
                                    placeholder="e.g. adams"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                                <button type="button" className="text-xs font-bold text-indigo-600 hover:underline">Forgot?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input
                                    type="password"
                                    className="input-field pl-12 py-3.5 bg-white border-slate-200 text-base shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl flex items-start gap-3 animate-shake">
                                <div className="p-1 bg-red-100 rounded-lg"><ShieldCheck size={14} /></div>
                                <p className="font-semibold">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-3 group shadow-xl shadow-indigo-200/50"
                        >
                            {loading ? 'Logging in...' : (
                                <>
                                    Log In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Demo Credentials</span>
                            <p className="text-sm font-bold text-slate-900">admin / <span className="text-indigo-600">admin123</span></p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                            <LogIn size={20} />
                        </div>
                    </div>
                </div>
            </div>

            <style jsx="true">{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default Login;
