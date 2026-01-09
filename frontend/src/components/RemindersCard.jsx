import { useEffect, useState } from 'react';
import { Bell, AlertCircle, Calendar, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const RemindersCard = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const { showToast } = useToast();

    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const res = await api.get('/projects/reminders/');
                const data = res.data || [];
                const mapped = data.map(d => ({
                    id: d.id,
                    type: d.type,
                    title: d.title,
                    priority: d.priority,
                    due_date: d.due_date,
                    link: d.link,
                    assigned_to: d.assigned_to_details,
                    raw: d
                }));
                setItems(mapped.slice(0, 6));
            } catch (error) {
                console.error('Failed to fetch reminders', error);
                showToast('Failed to load reminders', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchReminders();
    }, []);

    const handleAcknowledge = async (item) => {
        try {
            await api.post(`/projects/tasks/${item.id}/acknowledge/`);
            setItems(prev => prev.filter(i => !(i.type === item.type && i.id === item.id)));
            showToast('Acknowledged', 'success');
        } catch (error) {
            console.error('Acknowledge failed', error);
            showToast('Failed to acknowledge', 'error');
        }
    };

    const handleSnooze = async (item) => {
        try {
            const duration = 1; // default 1 day
            await api.post(`/projects/tasks/${item.id}/snooze/`, { duration, unit: 'days' });
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, due_date: new Date(new Date(i.due_date).getTime() + duration * 24 * 60 * 60 * 1000).toISOString() } : i));
            showToast('Snoozed for 1 day', 'success');
        } catch (error) {
            console.error('Snooze failed', error);
            showToast('Failed to snooze', 'error');
        }
    };

    const handleMarkDone = async (item) => {
        try {
            await api.post(`/projects/tasks/${item.id}/mark_done/`);
            setItems(prev => prev.filter(i => !(i.type === item.type && i.id === item.id)));
            showToast('Marked done', 'success');
        } catch (error) {
            console.error('Mark done failed', error);
            showToast('Failed to mark done', 'error');
        }
    };

    return (
        <section className="bg-white border border-[#DFE1E6] rounded-sm p-4">
            <div className="flex items-center gap-2 mb-3">
                <Bell size={16} className="text-[var(--trello-primary)]" />
                <h3 className="text-xs font-semibold text-[#5E6C84] uppercase">Reminders</h3>
            </div>

            {loading ? (
                <div className="text-xs text-[#5E6C84]">Loading reminders…</div>
            ) : items.length === 0 ? (
                <div className="text-sm text-[#5E6C84]">No critical reminders — great job! ✅</div>
            ) : (
                <div className="space-y-2">
                    {items.map(item => (
                        <div key={`${item.type}-${item.id}`} className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-[#F8FAFC] flex items-center justify-center text-[12px] font-semibold text-[#172B4D]">
                                        {item.type === 'ticket' ? <Ticket size={14} /> : <AlertCircle size={14} />}
                                    </div>
                                    <div className="flex-1">
                                        <Link to={item.link} className="text-sm font-medium text-[#172B4D] hover:text-[var(--trello-primary)] transition-colors">
                                            {item.title}
                                        </Link>
                                        <div className="text-xs text-[#5E6C84]">{item.type.toUpperCase()} • {item.priority}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                                <Link to={item.link} className="text-[var(--trello-primary)] text-sm font-medium hover:underline">View</Link>
                                {item.type === 'task' && (
                                    <div className="flex gap-1">
                                        <button onClick={() => handleAcknowledge(item)} className="text-xs px-2 py-1 bg-[#F3F4F6] rounded text-[#172B4D]">Ack</button>
                                        <button onClick={() => handleSnooze(item)} className="text-xs px-2 py-1 bg-[#F3F4F6] rounded text-[#172B4D]">Snooze</button>
                                        <button onClick={() => handleMarkDone(item)} className="text-xs px-2 py-1 bg-[var(--trello-primary)] text-white rounded">Done</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default RemindersCard;
