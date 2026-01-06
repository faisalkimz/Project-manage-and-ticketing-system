import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { LogIn, AlertCircle, Loader } from 'lucide-react';

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
            setError('Invalid username or password. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0079BF] to-[#026AA7] p-6">
            {/* Logo & Brand */}
            <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white rounded flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-black text-[#0079BF]">M</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white">Mbabali</h1>
                </div>
                <p className="text-white/90 text-sm">Project Management System</p>
            </div>

            {/* Login Card */}
            <div className="trello-modal w-full max-w-md animate-scale-in">
                <div className="p-8">
                    <h2 className="text-xl font-semibold text-[#172B4D] mb-2 text-center">
                        Log in to Mbabali
                    </h2>
                    <p className="text-sm text-[#5E6C84] mb-6 text-center">
                        Continue to your workspace
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#5E6C84] mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                className="trello-input"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#5E6C84] mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                className="trello-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-3 bg-[#FFEBE6] border border-[#EB5A46] rounded-sm">
                                <AlertCircle size={16} className="text-[#EB5A46] shrink-0 mt-0.5" />
                                <p className="text-sm text-[#EB5A46]">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full trello-btn trello-btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader size={18} className="animate-spin" />
                                    <span>Logging in...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <LogIn size={18} />
                                    <span>Log In</span>
                                </div>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-[#DFE1E6] text-center">
                        <a href="#" className="text-sm text-[#0079BF] hover:underline">
                            Can't log in? Contact support
                        </a>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
                <p className="text-xs text-white/70">
                    © {new Date().getFullYear()} Mbabali. All rights reserved.
                </p>
            </div>

            <style jsx="true">{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Login;
