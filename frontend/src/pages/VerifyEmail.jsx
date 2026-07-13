import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('no-token');
            return;
        }
        api.get(`/users/verify-email/?token=${token}`)
            .then(() => setStatus('success'))
            .catch(() => setStatus('error'));
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
            <div className="bg-white p-8 rounded-[3px] shadow-md text-center max-w-md">
                {status === 'loading' && (
                    <>
                        <Loader size={40} className="animate-spin mx-auto text-[#0079BF] mb-4" />
                        <p className="text-[#172B4D]">Verifying your email...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle size={40} className="mx-auto text-[#5AAC44] mb-4" />
                        <h2 className="text-xl font-bold text-[#172B4D] mb-2">Email Verified!</h2>
                        <p className="text-sm text-[#5E6C84] mb-4">Your email has been successfully verified.</p>
                        <Link to="/login" className="text-[#0052CC] hover:underline text-sm font-semibold">Go to Login</Link>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle size={40} className="mx-auto text-[#EB5A46] mb-4" />
                        <h2 className="text-xl font-bold text-[#172B4D] mb-2">Verification Failed</h2>
                        <p className="text-sm text-[#5E6C84] mb-4">The link is invalid or expired.</p>
                        <Link to="/login" className="text-[#0052CC] hover:underline text-sm font-semibold">Go to Login</Link>
                    </>
                )}
                {status === 'no-token' && (
                    <>
                        <XCircle size={40} className="mx-auto text-[#EB5A46] mb-4" />
                        <h2 className="text-xl font-bold text-[#172B4D] mb-2">No Token</h2>
                        <p className="text-sm text-[#5E6C84] mb-4">No verification token provided.</p>
                        <Link to="/login" className="text-[#0052CC] hover:underline text-sm font-semibold">Go to Login</Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
