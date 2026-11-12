import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Loader, AlertCircle, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import SocialLoginButtons from '../components/SocialLoginButtons';

const Signup = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', token: '' });
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { register, login, loading } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        if (token) {
            setFormData(prev => ({ ...prev, token }));
        }
    }, [location]);

    // Password strength calculation
    const getPasswordStrength = (pass) => {
        if (!pass) return { score: 0, text: '', color: 'bg-slate-200' };
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-rose-500' };
        if (score === 2) return { score: 2, text: 'Fair', color: 'bg-amber-500' };
        if (score === 3) return { score: 3, text: 'Good', color: 'bg-blue-500' };
        return { score: 4, text: 'Strong', color: 'bg-emerald-500' };
    };

    const strength = getPasswordStrength(formData.password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!termsAccepted) {
            setError('Please accept the Terms of Service and Privacy Policy to continue.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        // 1. Register
        const success = await register(formData);
        if (success) {
            // 2. Auto-login
            const loginSuccess = await login(formData.username, formData.password);
            if (loginSuccess) {
                // 3. Go to Onboarding
                navigate('/onboarding');
            } else {
                navigate('/login');
            }
        } else {
            setError('Registration failed. Username or Email may already be taken.');
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

            <div className="relative z-10 w-full flex flex-col items-center">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-[#0079BF] rounded-[3px] flex items-center justify-center font-bold text-white text-xl shadow-sm">M</div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#172B4D]">Omni-PMS</h1>
                </div>

                <div className="w-full max-w-[420px] bg-white rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.08)] border border-[#DFE1E6] overflow-hidden">
                    <div className="p-8 pb-6">
                        <h2 className="text-lg font-bold text-[#172B4D] text-center mb-1">Create your account</h2>
                        <p className="text-xs text-[#5E6C84] text-center mb-6">Get started with free unlimited boards & ticketing</p>

                        {error && (
                            <div className="mb-4 p-3 bg-[#FFEBE6] border border-[#EB5A46] rounded-lg flex items-start gap-2">
                                <AlertCircle size={16} className="text-[#EB5A46] mt-0.5 shrink-0" />
                                <p className="text-xs font-medium text-[#BF2600]">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Work Email</label>
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg text-sm focus:border-[#0079BF] focus:bg-white outline-none transition"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Username</label>
                                <input
                                    type="text"
                                    placeholder="Choose username"
                                    className="w-full px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg text-sm focus:border-[#0079BF] focus:bg-white outline-none transition"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-[#5E6C84] uppercase">Password</label>
                                    {strength.text && (
                                        <span className={`text-[10px] font-bold ${
                                            strength.score >= 3 ? 'text-emerald-600' : strength.score === 2 ? 'text-amber-600' : 'text-rose-600'
                                        }`}>
                                            {strength.text}
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min 6 characters"
                                        className="w-full px-3 py-2 pr-10 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg text-sm focus:border-[#0079BF] focus:bg-white outline-none transition"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                {/* Password Strength Bar */}
                                {formData.password && (
                                    <div className="grid grid-cols-4 gap-1 mt-1.5">
                                        {[1, 2, 3, 4].map(idx => (
                                            <div
                                                key={idx}
                                                className={`h-1 rounded-full transition-colors ${
                                                    idx <= strength.score ? strength.color : 'bg-slate-200'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Terms Checkbox */}
                            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-0.5 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]"
                                />
                                <span className="text-xs text-[#5E6C84] leading-relaxed">
                                    I agree to the <a href="#" className="text-[#0052CC] hover:underline">Terms of Service</a> and <a href="#" className="text-[#0052CC] hover:underline">Privacy Policy</a>
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-[#0052CC] hover:bg-[#0065FF] text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 text-sm mt-2"
                            >
                                {loading ? <Loader size={18} className="animate-spin mx-auto" /> : 'Create Free Account'}
                            </button>
                        </form>

                        <div className="my-5 text-center text-xs font-semibold text-[#5E6C84] relative">
                            <span className="bg-white px-2 relative z-10 text-[11px] uppercase tracking-wider">or continue with</span>
                            <div className="absolute top-1/2 left-0 w-full border-t border-[#DFE1E6] -z-0"></div>
                        </div>

                        <SocialLoginButtons />

                        <div className="mt-6 border-t border-[#DFE1E6] pt-4 text-center">
                            <Link to="/login" className="text-xs font-semibold text-[#0052CC] hover:underline">
                                Already have an account? Log In
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-4 text-xs text-[#5E6C84]">
                    <a href="#" className="hover:underline">Privacy Policy</a>
                    <span>•</span>
                    <a href="#" className="hover:underline">Terms of Service</a>
                </div>
            </div>

            <style jsx="true">{`
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

export default Signup;
