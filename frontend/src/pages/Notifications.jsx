import { useState, useEffect } from 'react';
import { Bell, Check, Clock, Info, AlertTriangle, CheckCircle, Settings, Trash2 } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Notifications = () => {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [rules, setRules] = useState([]);
    const [activeTab, setActiveTab] = useState('alerts'); // alerts, rules
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
        fetchRules();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/alerts/');
            setNotifications(res.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            setIsLoading(false);
        }
    };

    const fetchRules = async () => {
        try {
            const res = await api.get('/notifications/rules/');
            setRules(res.data);
        } catch (error) {
            console.error('Failed to fetch rules', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/alerts/${id}/mark_read/`);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            console.error(error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/alerts/mark_all_read/');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error(error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'ASSIGNMENT': return <Info size={18} className="text-blue-500" />;
            case 'STATUS_CHANGE': return <Clock size={18} className="text-amber-500" />;
            case 'SLA_BREACH': return <AlertTriangle size={18} className="text-red-500" />;
            case 'PROJECT_UPDATE': return <CheckCircle size={18} className="text-green-500" />;
            default: return <Bell size={18} className="text-gray-500" />;
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#172B4D]">Notifications</h1>
                    <p className="text-[#5E6C84] mt-1">Manage your alerts and preferences</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-[#DFE1E6]">
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'alerts' ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                    >
                        Alerts
                    </button>
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'rules' ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#42526E] hover:bg-[#F4F5F7]'}`}
                    >
                        Preferences
                    </button>
                </div>
            </div>

            {activeTab === 'alerts' && (
                <div className="bg-white rounded-lg border border-[#DFE1E6] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#DFE1E6] flex justify-between items-center bg-[#FAFBFC]">
                        <h3 className="font-bold text-[#172B4D]">Recent Activity</h3>
                        <button onClick={markAllRead} className="text-sm text-[#0052CC] font-medium hover:underline">
                            Mark all as read
                        </button>
                    </div>
                    {isLoading ? (
                        <div className="p-8 text-center text-[#5E6C84]">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center text-[#5E6C84] italic">
                            No notifications yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-[#DFE1E6]">
                            {notifications.map(n => (
                                <div key={n.id} className={`p-4 flex gap-4 hover:bg-[#FAFBFC] transition-colors ${!n.is_read ? 'bg-[#E6EFFC]/30' : ''}`}>
                                    <div className="mt-1 shrink-0">
                                        {getIcon(n.activity_type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold text-[#172B4D]">{n.title}</p>
                                            <span className="text-xs text-[#5E6C84] whitespace-nowrap">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#42526E]">{n.message}</p>
                                        {!n.is_read && (
                                            <button
                                                onClick={() => markAsRead(n.id)}
                                                className="mt-2 text-xs text-[#0052CC] font-medium flex items-center gap-1 hover:underline"
                                            >
                                                <Check size={12} /> Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="bg-white rounded-lg border border-[#DFE1E6] shadow-sm">
                    <div className="p-6 text-center text-[#5E6C84]">
                        <Settings size={48} className="mx-auto text-[#DFE1E6] mb-4" />
                        <h3 className="text-lg font-bold text-[#172B4D]">Notification Rules</h3>
                        <p className="max-w-md mx-auto mt-2">
                            Configure how and when you want to be notified.
                            (Implementation of rule creation form pending)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;
