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
        {
            name: 'Google',
            icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z" />
                    <path fill="#34A853" d="M16.04 18.013c-1.09.618-2.346.963-3.692.963-3.178 0-5.87-2.115-6.852-5l-4.04 3.126C3.412 21.041 7.445 24 12 24c3.15 0 6.04-1.1 8.214-2.943l-4.173-3.044z" />
                    <path fill="#4285F4" d="M23.778 12.273c0-.796-.069-1.565-.198-2.31h-11.58v4.368h6.602c-.285 1.529-1.145 2.827-2.438 3.682l4.173 3.044c2.443-2.251 3.841-5.564 3.841-9.42s-.1-1.364-.4-1.364z" />
                    <path fill="#FBBC05" d="M5.496 13.977A7.081 7.081 0 0 1 5.496 10.023L1.47 6.908a11.996 11.996 0 0 0 0 10.184l4.026-3.115z" />
                </svg>
            ),
            color: '#FFFFFF'
        },
        {
            name: 'Microsoft',
            icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="#F25022" d="M1 1h10v10H1z" />
                    <path fill="#7FBA00" d="M13 1h10v10H13z" />
                    <path fill="#00A4EF" d="M1 13h10v10H1z" />
                    <path fill="#FFB900" d="M13 13h10v10H13z" />
                </svg>
            ),
            color: '#FFFFFF'
        },
        {
            name: 'Apple',
            icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#000000">
                    <path d="M17.057 12.783c.026 2.704 2.221 3.606 2.248 3.621-.02.05-.353 1.201-1.162 2.381-.7.986-1.428 1.97-2.528 1.989-1.08.02-1.428-.638-2.67-.638-1.24 0-1.628.62-2.651.658-1.062.038-1.92-.1-2.731-1.26-1.666-2.382-2.935-6.726-1.212-9.713.855-1.485 2.38-2.428 4.053-2.453 1.278-.02 2.482.862 3.26.862.778 0 2.222-1.053 3.738-.898 1.26.05 3.391.476 4.391 2.344-.08.05-1.87 1.053-1.85 3.107zM14.515 5.253c.666-.807 1.112-1.931.986-3.053-1.01.04-2.228.67-2.956 1.517-.654.743-1.231 1.884-1.076 2.981 1.121.087 2.26-.543 3.046-1.445z" />
                </svg>
            ),
            color: '#FFFFFF'
        },
        {
            name: 'Slack',
            icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.26 0a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v6.31a2.528 2.528 0 0 1-2.522 2.52 2.528 2.528 0 0 1-2.52-2.52v-6.31zM8.835 5.042a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.835 0a2.528 2.528 0 0 1 2.52 2.522v2.52h-2.52zm0 1.26a2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.522H2.522A2.528 2.528 0 0 1 0 8.822a2.528 2.528 0 0 1 2.522-2.52h6.313zm10.123 3.793a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52V10.095zm-1.26 0a2.528 2.528 0 0 1-2.522 2.52 2.528 2.528 0 0 1-2.52-2.52V3.785a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v6.31zM15.165 18.958a2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.522zm0-1.26a2.528 2.528 0 0 1-2.522-2.52 2.528 2.528 0 0 1 2.522-2.52h6.31a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52 2.52h-6.31z" fill="#000000" />
                </svg>
            ),
            color: '#FFFFFF'
        }
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
                        <div className="w-5 h-5 border-2 border-[var(--trello-primary)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <div className="w-5 h-5 group-hover:scale-110 transition-transform flex items-center justify-center">
                            {provider.icon}
                        </div>
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
