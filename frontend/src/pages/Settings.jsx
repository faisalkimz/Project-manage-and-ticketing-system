import { useState } from 'react';
import { User, Bell, Shield, Lock, Save } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Settings = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="min-h-screen bg-[#FAFBFC] p-6">
            <header className="max-w-4xl mx-auto mb-8">
                <h1 className="text-2xl font-semibold text-[#172B4D] mb-1">Account Settings</h1>
                <p className="text-sm text-[#5E6C84]">Manage your personal profile and preferences</p>
            </header>

            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <aside className="w-full md:w-64 space-y-1">
                    {[
                        { id: 'profile', label: 'Profile & Visibility', icon: User },
                        { id: 'notifications', label: 'Notifications', icon: Bell },
                        { id: 'security', label: 'Security', icon: Shield },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-[#E4F0F6] text-[#0079BF]'
                                    : 'text-[#172B4D] hover:bg-[#EBECF0]'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </aside>

                {/* Content */}
                <div className="flex-1 bg-white border border-[#DFE1E6] rounded-sm p-6 shadow-sm">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-[#172B4D] border-b border-[#DFE1E6] pb-2">Public Profile</h2>

                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-[#EBECF0] rounded-full flex items-center justify-center text-2xl font-bold text-[#172B4D] border-2 border-white shadow-sm">
                                    {user?.username?.[0]?.toUpperCase()}
                                </div>
                                <button className="trello-btn trello-btn-secondary">Change Avatar</button>
                            </div>

                            <form className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Username</label>
                                    <input
                                        type="text"
                                        className="trello-input bg-[#FAFBFC]"
                                        value={user?.username}
                                        disabled
                                    />
                                    <p className="text-xs text-[#8993A4] mt-1">Usernames cannot be changed at this time.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="trello-input"
                                        value={user?.email}
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Job Title</label>
                                    <input
                                        type="text"
                                        className="trello-input"
                                        placeholder="e.g. Senior Developer"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Bio</label>
                                    <textarea
                                        className="trello-input min-h-[100px]"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>

                                <div className="pt-2">
                                    <button type="button" className="trello-btn trello-btn-primary" onClick={() => alert('Profile updates coming soon!')}>
                                        <Save size={16} />
                                        <span>Save Changes</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="text-center py-12">
                            <Bell size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                            <h3 className="text-lg font-semibold text-[#172B4D]">Notifications</h3>
                            <p className="text-[#5E6C84]">Preferences for email and push notifications are coming soon.</p>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="text-center py-12">
                            <Lock size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                            <h3 className="text-lg font-semibold text-[#172B4D]">Security</h3>
                            <p className="text-[#5E6C84]">Two-factor authentication and password monitoring are on the roadmap.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
