import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

const OAuthCallback = () => {
    const { provider } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { checkAuth } = useAuthStore();
    const [status, setStatus] = useState('processing');

    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) {
            setStatus('error');
            return;
        }

        api.post(`/users/auth/${provider}/callback/`, { code })
            .then((res) => {
                localStorage.setItem('token', res.data.access);
                localStorage.setItem('refresh', res.data.refresh);
                setStatus('success');
                checkAuth();
                setTimeout(() => navigate('/'), 1500);
            })
            .catch(() => setStatus('error'));
    }, [provider, searchParams, navigate, checkAuth]);

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
            <div className="bg-white p-8 rounded-[3px] shadow-md text-center max-w-md">
                {status === 'processing' && (
                    <>
                        <Loader size={40} className="animate-spin mx-auto text-[#0079BF] mb-4" />
                        <p className="text-[#172B4D]">Signing in with {provider}...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle size={40} className="mx-auto text-[#5AAC44] mb-4" />
                        <h2 className="text-xl font-bold text-[#172B4D] mb-2">Signed In!</h2>
                        <p className="text-sm text-[#5E6C84]">Redirecting...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle size={40} className="mx-auto text-[#EB5A46] mb-4" />
                        <h2 className="text-xl font-bold text-[#172B4D] mb-2">Sign In Failed</h2>
                        <p className="text-sm text-[#5E6C84] mb-4">Could not authenticate with {provider}.</p>
                        <button onClick={() => navigate('/login')} className="text-[#0052CC] hover:underline text-sm font-semibold">Go to Login</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default OAuthCallback;
