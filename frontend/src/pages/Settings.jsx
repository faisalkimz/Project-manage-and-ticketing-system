import { useState, useEffect, useRef } from 'react';
import {
    User, Bell, Shield, Lock, Save, CheckCircle, CheckCircle2, Mail, Smartphone,
    AlertTriangle, Edit2, Key, CreditCard, Activity, Zap, ExternalLink,
    ChevronRight, ZapOff, Info, Settings as SettingsIcon, X
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { useToast } from '../components/Toast';

const Settings = () => {
    const { user, updateProfile } = useAuthStore();
    const { showToast } = useToast();
    const fileInputRef = useRef(null);
    const apiKeyRef = useRef(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [recentActivity, setRecentActivity] = useState([]);
    const [configPowerUp, setConfigPowerUp] = useState(null);

    // Profile State
    const [profileData, setProfileData] = useState({
        job_title: '',
        bio: '',
        department: 'GENERAL'
    });

    // Notifications State
    const [notifData, setNotifData] = useState({
        email_notifications: true,
        push_notifications: true,
        task_updates_only: false
    });

    // Password State
    const [passwords, setPasswords] = useState({ old_password: '', new_password: '' });

    useEffect(() => {
        if (user) {
            setProfileData({
                job_title: user.job_title || '',
                bio: user.bio || '',
                department: user.department || 'GENERAL'
            });
            setNotifData({
                email_notifications: user.email_notifications ?? true,
                push_notifications: user.push_notifications ?? true,
                task_updates_only: user.task_updates_only ?? false
            });
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivity();
        }
    }, [activeTab]);

    const fetchActivity = async () => {
        try {
            const res = await api.get('/activity/audit-logs/');
            setRecentActivity(res.data.slice(0, 15));
        } catch (e) {
            console.error('Failed to fetch activity', e);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await updateProfile(profileData);
        setLoading(false);
        if (success) {
            showToast('Profile updated successfully!', 'success');
        } else {
            showToast('Failed to update profile.', 'error');
        }
    };

    const handleSaveNotifs = async () => {
        setLoading(true);
        const success = await updateProfile(notifData);
        setLoading(false);
        if (success) {
            showToast('Preferences saved!', 'success');
        }
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/users/change-password/', passwords);
            showToast('Password updated successfully!', 'success');
            setPasswords({ old_password: '', new_password: '' });
        } catch (error) {
            showToast('Failed to update password. Check your current password.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('profile_image', file);

        const success = await updateProfile(formData);
        setLoading(false);

        if (success) {
            showToast('Avatar updated!', 'success');
        } else {
            showToast('Failed to upload avatar.', 'error');
        }
    };

    // Power-Ups State
    const [powerups, setPowerups] = useState(() => {
        const saved = localStorage.getItem('mbabali_powerups');
        return saved ? JSON.parse(saved) : [
            { id: 'slack', name: 'Slack', desc: 'Send alerts to channels.', icon: Zap, active: true },
            { id: 'github', name: 'GitHub', desc: 'Link pull requests.', icon: Zap, active: false },
            { id: 'gdrive', name: 'Google Drive', desc: 'Attach files easily.', icon: Zap, active: false },
            { id: 'butler', name: 'Butler', desc: 'Automate repetitive tasks.', icon: Zap, active: true },
            { id: 'calendar', name: 'CalendarView', desc: 'Visualize by date.', icon: Zap, active: false },
            { id: 'jira', name: 'Jira Integration', desc: 'Sync with Jira...', icon: Zap, active: false },
        ];
    });

    useEffect(() => {
        localStorage.setItem('mbabali_powerups', JSON.stringify(powerups));
    }, [powerups]);

    const togglePowerUp = (id) => {
        setPowerups(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
        const pu = powerups.find(p => p.id === id);
        showToast(`${pu.name} ${!pu.active ? 'enabled' : 'disabled'}!`, 'info');
    };

    const handleSaveConfig = () => {
        if (apiKeyRef.current && configPowerUp) {
            const key = apiKeyRef.current.value;
            setPowerups(prev => prev.map(p => p.id === configPowerUp.id ? { ...p, config: { apiKey: key } } : p));
            showToast(`${configPowerUp.name} settings saved!`, 'success');
            setConfigPowerUp(null);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile & Visibility', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'powerups', label: 'Power-Ups', icon: Zap },
        { id: 'billing', label: 'Billing', icon: CreditCard },
        { id: 'security', label: 'Security & Privacy', icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-[#FAFBFC] p-4 md:p-6 pb-24 md:pb-6 font-sans">
            <header className="max-w-6xl mx-auto mb-10">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-2 text-center sm:text-left">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-md border border-[#DFE1E6] flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-white">
                        {user?.profile_image ? (
                            <img
                                src={user.profile_image.startsWith('http') ? user.profile_image : `http://localhost:8000${user.profile_image}`}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#0052CC] to-[#0747A6] flex items-center justify-center text-white font-bold text-2xl">
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#172B4D] tracking-tight">{user?.username}</h1>
                        <p className="text-[#5E6C84] flex items-center gap-2 mt-1">
                            <span className="font-medium">{user?.email}</span>
                            <span className="w-1 h-1 rounded-full bg-[#DFE1E6]"></span>
                            <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-[#E3FCEF] text-[#006644] rounded-full">Pro Account</span>
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 flex flex-row md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0 gap-1.5 custom-scrollbar shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex md:w-full items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-all shrink-0 ${activeTab === tab.id
                                ? 'bg-[#E4F0F6] text-[#0052CC] border-l-4 border-[#0052CC] shadow-sm'
                                : 'text-[#5E6C84] hover:bg-[#EBECF0] hover:text-[#172B4D]'
                                }`}
                        >
                            <div className="flex items-center gap-3 whitespace-nowrap">
                                <tab.icon size={20} className={activeTab === tab.id ? 'text-[#0052CC]' : ''} />
                                {tab.label}
                            </div>
                            {activeTab === tab.id && <ChevronRight size={14} className="hidden md:block opacity-50" />}
                        </button>
                    ))}
                </aside>

                {/* Content Area */}
                <div className="flex-1 bg-white border border-[#DFE1E6] rounded-xl shadow-xl overflow-hidden min-h-[700px]">
                    <div className="p-10">

                        {activeTab === 'profile' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section className="mb-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-[#172B4D]">Profile & Visibility</h2>
                                            <p className="text-[#5E6C84] text-sm mt-1">Manage who can see your profile and company information.</p>
                                        </div>
                                        <button className="text-xs font-bold text-[#0052CC] px-3 py-1 bg-[#DEEBFF] rounded-full hover:bg-[#B3D4FF] transition-colors">
                                            View Public Profile
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-6 mb-8 p-6 bg-white rounded border border-[#DFE1E6]">
                                        <div className="relative cursor-pointer" onClick={handleAvatarClick}>
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#DFE1E6] hover:border-[#0052CC] transition-colors">
                                                {user?.profile_image ? (
                                                    <img
                                                        src={user.profile_image.startsWith('http') ? user.profile_image : `http://localhost:8000${user.profile_image}`}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-[#0052CC] flex items-center justify-center text-2xl font-bold text-white">
                                                        {user?.username?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full border border-[#DFE1E6] text-[#5E6C84] hover:text-[#0052CC]">
                                                <Edit2 size={16} />
                                            </div>
                                        </div>
                                        <div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-[#172B4D] mb-1">{user?.username}</h3>
                                                <p className="text-sm text-[#5E6C84] mb-3">{user?.email}</p>
                                                <div className="flex gap-3 text-xs">
                                                    <span className="text-[#5E6C84]">Role: <strong className="text-[#172B4D]">{user?.role?.replace('_', ' ')}</strong></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSaveProfile} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Job Title</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:border-[#0052CC] outline-none"
                                                    value={profileData.job_title}
                                                    onChange={e => setProfileData({ ...profileData, job_title: e.target.value })}
                                                    placeholder="e.g. Project Manager"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-semibold text-[#172B4D] mb-1">Department</label>
                                                <select
                                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:border-[#0052CC] outline-none cursor-pointer"
                                                    value={profileData.department}
                                                    onChange={e => setProfileData({ ...profileData, department: e.target.value })}
                                                >
                                                    <option value="GENERAL">General</option>
                                                    <option value="CORE_ENGINEERING">Engineering</option>
                                                    <option value="PRODUCT_DESIGN">Design</option>
                                                    <option value="CUSTOMER_SUCCESS">Customer Success</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-semibold text-[#172B4D] mb-1">Bio</label>
                                            <textarea
                                                className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:border-[#0052CC] outline-none min-h-[100px] resize-none"
                                                value={profileData.bio}
                                                onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>

                                        <div className="p-4 bg-[#F4F5F7] rounded border border-[#DFE1E6] flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Shield size={18} className="text-[#5E6C84]" />
                                                <div>
                                                    <h4 className="font-semibold text-[#172B4D] text-sm">Public Profile</h4>
                                                    <p className="text-xs text-[#5E6C84]">Make your profile visible to team members</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052CC]"></div>
                                            </label>
                                        </div>

                                        <div className="pt-4 border-t border-[#DFE1E6] flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-6 py-2 bg-[#0052CC] text-white font-semibold rounded hover:bg-[#0747A6] transition-colors disabled:opacity-50"
                                            >
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                </section>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6 max-w-2xl">
                                <h2 className="text-lg font-bold text-[#172B4D] mb-4">Notification Preferences</h2>

                                <div className="bg-white border border-[#DFE1E6] rounded p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-[#172B4D]">Email Notifications</h4>
                                            <p className="text-xs text-[#5E6C84]">Receive digests and important updates via email.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notifData.email_notifications}
                                                onChange={() => setNotifData({ ...notifData, email_notifications: !notifData.email_notifications })}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0052CC]"></div>
                                        </label>
                                    </div>

                                    <div className="w-full h-px bg-[#DFE1E6]"></div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-[#172B4D]">Push Notifications</h4>
                                            <p className="text-xs text-[#5E6C84]">Get real-time alerts in your browser.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notifData.push_notifications}
                                                onChange={() => setNotifData({ ...notifData, push_notifications: !notifData.push_notifications })}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0052CC]"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSaveNotifs}
                                        disabled={loading}
                                        className="px-4 py-2 bg-[#0052CC] text-white text-sm font-medium rounded hover:bg-[#0065FF] transition-colors shadow-sm"
                                    >
                                        {loading ? 'Saving...' : 'Save Preferences'}
                                    </button>
                                </div>
                            </div>

                        )}

                        {activeTab === 'activity' && (
                            <div className="animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-[#172B4D]">Activity Log</h2>
                                    <button onClick={fetchActivity} className="text-sm text-[#0052CC] hover:underline font-medium">Refresh</button>
                                </div>

                                <div className="bg-white rounded border border-[#DFE1E6]">
                                    {recentActivity.length > 0 ? (
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-[#F4F5F7] text-[#5E6C84] font-semibold border-b border-[#DFE1E6]">
                                                <tr>
                                                    <th className="px-4 py-3">Action</th>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#DFE1E6]">
                                                {recentActivity.map((log, i) => {
                                                    const formatDetails = (d) => {
                                                        if (!d) return '-';
                                                        if (typeof d === 'string') return d;
                                                        if (d.changes) {
                                                            return Object.entries(d.changes).map(([k, v]) => {
                                                                const field = k.replace(/_/g, ' ');
                                                                const oldVal = v.old === null || v.old === undefined || v.old === 'Unassigned' ? 'None' : v.old;
                                                                const newVal = v.new === null || v.new === undefined ? 'None' : v.new;
                                                                return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${oldVal} → ${newVal}`;
                                                            }).join(', ');
                                                        }
                                                        return JSON.stringify(d);
                                                    };
                                                    const displayDetails = formatDetails(log.details);

                                                    return (
                                                        <tr key={i} className="hover:bg-[#FAFBFC]">
                                                            <td className="px-4 py-3 font-medium text-[#172B4D]">{log.action}</td>
                                                            <td className="px-4 py-3 text-[#5E6C84] whitespace-nowrap">
                                                                {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </td>
                                                            <td className="px-4 py-3 text-[#172B4D] max-w-md truncate" title={displayDetails}>
                                                                {displayDetails}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-[#5E6C84]">
                                            No recent activity found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div className="animate-in fade-in duration-300">
                                <h2 className="text-lg font-bold text-[#172B4D] mb-6">Plan & Billing</h2>

                                <div className="bg-white border border-[#DFE1E6] rounded p-6 mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-base font-bold text-[#172B4D]">Premium Plan</h3>
                                            <p className="text-sm text-[#5E6C84]">$12.50/user/month</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => showToast('Plan comparison sheet opening...', 'info')} className="px-3 py-1.5 text-sm font-medium text-[#172B4D] hover:bg-[#F4F5F7] rounded">Compare Plans</button>
                                            <button onClick={() => showToast('Manage subscription portal opening...', 'info')} className="px-3 py-1.5 text-sm font-medium bg-[#0052CC] text-white hover:bg-[#0065FF] rounded">Manage Subscription</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[#006644] bg-[#E3FCEF] px-3 py-2 rounded inline-block">
                                        <CheckCircle2 size={16} /> Active since Oct 2025
                                    </div>
                                </div>

                                <div className="bg-white border border-[#DFE1E6] rounded p-6">
                                    <h3 className="text-sm font-bold text-[#172B4D] mb-4">Payment Method</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#F4F5F7] rounded border border-[#DFE1E6]">
                                                <CreditCard size={20} className="text-[#172B4D]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#172B4D]">Visa ending in 4242</p>
                                                <p className="text-xs text-[#5E6C84]">Expires 12/28</p>
                                            </div>
                                        </div>
                                        <button onClick={() => showToast('Update payment method modal coming soon', 'info')} className="text-sm text-[#0052CC] font-medium hover:underline">Edit</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'powerups' && (
                            <div className="animate-in fade-in duration-300">
                                <h2 className="text-lg font-bold text-[#172B4D] mb-6">Integrations & Power-Ups</h2>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {powerups.map((pu) => (
                                        <div
                                            key={pu.id}
                                            className="flex items-start gap-4 p-4 border border-[#DFE1E6] rounded-lg hover:bg-[#FAFBFC] transition-colors bg-white"
                                        >
                                            <div className={`p-2 rounded ${pu.active ? 'bg-[#E9F2FF] text-[#0052CC]' : 'bg-[#F4F5F7] text-[#5E6C84]'}`}>
                                                <Zap size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-semibold text-[#172B4D] text-sm">{pu.name}</h4>
                                                    <button
                                                        onClick={() => togglePowerUp(pu.id)}
                                                        className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${pu.active ? 'bg-[#E3FCEF] text-[#006644] hover:bg-[#D3F1DF]' : 'bg-[#F4F5F7] text-[#42526E] hover:bg-[#EBECF0]'}`}
                                                    >
                                                        {pu.active ? 'Enabled' : 'Enable'}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-[#5E6C84] leading-relaxed mb-2">{pu.desc}</p>
                                                {pu.active && (
                                                    <button onClick={() => setConfigPowerUp(pu)} className="text-[10px] font-bold text-[#0052CC] hover:underline flex items-center gap-1">
                                                        Configure <SettingsIcon size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="animate-in fade-in duration-300">
                                <h2 className="text-lg font-bold text-[#172B4D] mb-6">Security Settings</h2>

                                <div className="space-y-6 max-w-2xl">
                                    <div className="bg-white border border-[#DFE1E6] rounded p-6">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="mt-1 text-[#0052CC]">
                                                <Lock size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-bold text-[#172B4D] mb-1">Change Password</h3>
                                                <p className="text-xs text-[#5E6C84] mb-4">Ensure you use a strong password (min 8 chars, mixed case, symbols).</p>

                                                <form className="space-y-4" onSubmit={handleSavePassword}>
                                                    <div className="space-y-1">
                                                        <label className="block text-xs font-semibold text-[#172B4D]">Current Password</label>
                                                        <input
                                                            type="password"
                                                            className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
                                                            value={passwords.old_password}
                                                            onChange={e => setPasswords({ ...passwords, old_password: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="block text-xs font-semibold text-[#172B4D]">New Password</label>
                                                        <input
                                                            type="password"
                                                            className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
                                                            value={passwords.new_password}
                                                            onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="pt-2">
                                                        <button type="submit" disabled={loading} className="px-4 py-2 bg-[#0052CC] text-white text-sm font-bold rounded hover:bg-[#0065FF] transition-colors shadow-sm">
                                                            {loading ? 'Updating...' : 'Update Password'}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-[#DFE1E6] rounded p-6 flex items-start gap-4">
                                        <div className="mt-1 text-[#0052CC]">
                                            <Shield size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-bold text-[#172B4D]">Two-Factor Authentication (2FA)</h3>
                                                <span className="px-2 py-0.5 bg-[#EBECF0] text-[#5E6C84] text-[10px] font-bold uppercase rounded">Enterprise</span>
                                            </div>
                                            <p className="text-xs text-[#5E6C84] mb-4">Add an extra layer of security to your account. Requires an authenticator app.</p>
                                            <button
                                                className="px-4 py-2 border border-[#DFE1E6] text-[#172B4D] text-sm font-medium rounded bg-[#F4F5F7] cursor-not-allowed"
                                                onClick={() => showToast('Two-factor authentication is currently an Enterprise feature.', 'info')}
                                            >
                                                Enable 2FA
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {configPowerUp && (
                <div className="fixed inset-0 z-50 bg-[#091E42]/50 flex items-center justify-center p-4" onClick={() => setConfigPowerUp(null)}>
                    <div className="bg-white w-full max-w-lg rounded shadow-lg animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-[#DFE1E6] flex justify-between items-center bg-[#F4F5F7]">
                            <h3 className="text-sm font-bold text-[#172B4D]">Configure {configPowerUp.name}</h3>
                            <button onClick={() => setConfigPowerUp(null)} className="text-[#5E6C84] hover:text-[#172B4D]"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-[#5E6C84] mb-4">
                                Configure settings for the <strong>{configPowerUp.name}</strong> integration.
                            </p>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">API Key / Webhook URL</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        defaultValue={configPowerUp.config?.apiKey || ''}
                                        ref={apiKeyRef}
                                        placeholder="Enter API Key"
                                        className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:border-[#0052CC] outline-none font-mono text-[#172B4D]"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#5E6C84]">
                                        <Lock size={12} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-[#5E6C84] mt-1">Enter the API key provided by {configPowerUp.name}.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setConfigPowerUp(null)} className="px-4 py-2 border border-[#DFE1E6] rounded text-sm font-medium text-[#172B4D] hover:bg-[#F4F5F7]">Cancel</button>
                                <button onClick={handleSaveConfig} className="px-4 py-2 bg-[#0052CC] text-white rounded text-sm font-bold hover:bg-[#0065FF]">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
