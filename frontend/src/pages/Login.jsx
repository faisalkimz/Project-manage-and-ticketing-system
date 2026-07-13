import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Loader, AlertCircle } from 'lucide-react';
import SocialLoginButtons from '../components/SocialLoginButtons';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return;

        setError('');
        const success = await login(username, password);
        if (success) {
            navigate('/');
        } else {
            setError('Account not found (Invalid username or password).');
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center py-12 px-4 font-sans text-[#172B4D] relative overflow-hidden">
            {/* Background Art */}
            <img
                src="/auth-art/left.png"
                alt=""
                className="fixed bottom-0 left-0 w-[350px] lg:w-[450px] max-w-[30vw] hidden md:block z-0 pointer-events-none animate-fade-in-up"
            />
            <img
                src="/auth-art/right.png"
                alt=""
                className="fixed bottom-0 right-0 w-[350px] lg:w-[450px] max-w-[30vw] hidden md:block z-0 pointer-events-none animate-fade-in-up"
            />

            {/* Content Container */}
            <div className="relative z-10 w-full flex flex-col items-center">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-[#0079BF] rounded-[3px] flex items-center justify-center font-bold text-white text-xl">M</div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#172B4D]">Mbabali</h1>
                </div>

                {/* Login Card */}
                <div className="w-full max-w-[400px] bg-white rounded-[3px] shadow-[0_0_15px_rgba(0,0,0,0.1)] overflow-hidden">
                    <div className="p-8 pb-6">
                        <h2 className="text-base font-semibold text-[#5E6C84] text-center mb-6">Log in to continue</h2>

                        {error && (
                            <div className="mb-4 p-3 bg-[#FFEBE6] border border-[#EB5A46] rounded-[3px] flex items-start gap-2">
                                <AlertCircle size={16} className="text-[#EB5A46] mt-0.5 shrink-0" />
                                <p className="text-sm text-[#172B4D]">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Enter your username"
                                className="w-full px-3 py-2 bg-[#FAFBFC] border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#0079BF] focus:bg-white outline-none transition-colors"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                            />
                            <input
                                type="password"
                                placeholder="Enter password"
                                className="w-full px-3 py-2 bg-[#FAFBFC] border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#0079BF] focus:bg-white outline-none transition-colors"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2 bg-[#5AAC44] hover:bg-[#61BD4F] text-white font-bold rounded-[3px] transition-colors shadow-sm disabled:opacity-50"
                            >
                                {loading ? <Loader size={18} className="animate-spin mx-auto" /> : 'Log in'}
                            </button>
                        </form>

                        <div className="my-4 text-center text-xs font-semibold text-[#5E6C84] relative">
                            <span className="bg-white px-2 relative z-10">OR</span>
                            <div className="absolute top-1/2 left-0 w-full border-t border-[#DFE1E6] -z-0"></div>
                        </div>

                        <SocialLoginButtons />

                        <div className="mt-6 border-t border-[#DFE1E6] pt-4 text-center">
                            <Link to="/signup" className="text-sm text-[#0052CC] hover:underline">Sign up for an account</Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-4 text-xs text-[#5E6C84]">
                    <a href="#" className="hover:underline">Privacy Policy</a>
                    <span>•</span>
                    <a href="#" className="hover:underline">Terms of Service</a>
                </div>
            </div>

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Login;
