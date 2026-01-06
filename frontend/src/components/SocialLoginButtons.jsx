import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const SocialLoginButtons = () => {
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const [loadingProvider, setLoadingProvider] = useState(null);

    const handleSocialLogin = async (provider) => {
        setLoadingProvider(provider);
        // Simulate social OAuth flow
        setTimeout(async () => {
            try {
                // For demonstration, we'll log in with a demo account
                // In production, this would redirect to provider's OAuth URL
                const success = await login('admin', 'admin123');
                if (success) {
                    navigate('/');
                }
            } catch (error) {
                console.error('Social login failed', error);
            } finally {
                setLoadingProvider(null);
            }
        }, 1200);
    };

    const providers = [
        { name: 'Google', icon: 'https://cdn.worldvectorlogo.com/logos/google-icon.svg', color: '#FFFFFF' },
        { name: 'Microsoft', icon: 'https://cdn.worldvectorlogo.com/logos/microsoft-5.svg', color: '#FFFFFF' },
        { name: 'Apple', icon: 'https://cdn.worldvectorlogo.com/logos/apple-11.svg', color: '#FFFFFF' },
        { name: 'Slack', icon: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg', color: '#FFFFFF' }
    ];

    return (
        <div className="space-y-3">
            {providers.map((provider) => (
                <button
                    key={provider.name}
                    onClick={() => handleSocialLogin(provider.name)}
                    disabled={loadingProvider !== null}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2 border-2 border-[#DFE1E6] rounded-[3px] bg-white hover:bg-[#F4F5F7] transition-all group shadow-sm hover:shadow-md disabled:opacity-50"
                >
                    {loadingProvider === provider.name ? (
                        <div className="w-5 h-5 border-2 border-[#0079BF] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <img src={provider.icon} alt={provider.name} className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-[#172B4D] font-bold text-sm">
                        {loadingProvider === provider.name ? `Connecting to ${provider.name}...` : `Continue with ${provider.name}`}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default SocialLoginButtons;
