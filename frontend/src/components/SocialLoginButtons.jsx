import { Chrome, Command, Slack, Apple } from 'lucide-react'; // Proxies for logos

const SocialButton = ({ icon: Icon, label, onClick, className = "" }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center justify-center gap-2 py-2 px-3 border-2 border-[#DFE1E6] rounded-[3px] font-bold text-[#172B4D] text-sm hover:bg-[#F9FAFB] hover:border-[#DFE1E6] transition-colors bg-white shadow-sm ${className}`}
    >
        {Icon && <Icon size={18} />}
        <span>{label}</span>
    </button>
);

const SocialLoginButtons = () => {
    return (
        <div className="space-y-3 mt-4">
            <SocialButton
                icon={Chrome}
                label="Continue with Google"
                onClick={() => alert('Google login coming soon')}
            />
            <SocialButton
                icon={Command}
                label="Continue with Microsoft"
                onClick={() => alert('Microsoft login coming soon')}
            />
            <SocialButton
                icon={Apple}
                label="Continue with Apple"
                onClick={() => alert('Apple login coming soon')}
                className="bg-black text-white hover:bg-gray-800 border-black hover:border-black"
            />
            <SocialButton
                icon={Slack}
                label="Continue with Slack"
                onClick={() => alert('Slack login coming soon')}
            />
        </div>
    );
};

export default SocialLoginButtons;
