import { useEffect, useState } from 'react';
import { Bell, AlertCircle, Calendar, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const RemindersCard = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const [ticketsRes, tasksRes] = await Promise.all([
                    api.get('/tickets/tickets/'),
                    api.get('/projects/tasks/')
                ]);

                const tickets = (ticketsRes.data || [])
                    .filter(t => t.priority === 'CRITICAL' || (t.sla_due_date && new Date(t.sla_due_date) < new Date()))
                    .map(t => ({ id: t.id, title: t.title, type: 'ticket', priority: t.priority, extra: t, link: `/tickets/${t.id}` }));

                const now = new Date();
                const soon = new Date();
                soon.setDate(now.getDate() + 3);

                const tasks = (tasksRes.data || [])
                    .filter(t => t.priority === 'CRITICAL' || (t.due_date && new Date(t.due_date) <= soon))
                    .map(t => ({ id: t.id, title: t.title, type: 'task', priority: t.priority, extra: t, link: `/projects/${t.project || ''}` }));

                const combined = [...tickets, ...tasks].slice(0, 6);
                setItems(combined);
            } catch (error) {
                console.error('Failed to fetch reminders', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReminders();
    }, []);

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
                            <div className="shrink-0">
                                <Link to={item.link} className="text-[var(--trello-primary)] text-sm font-medium hover:underline">View</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default RemindersCard;
