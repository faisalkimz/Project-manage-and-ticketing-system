import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import api from '../services/api';

const TimerWidget = () => {
    const [currentEntry, setCurrentEntry] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const [loading, setLoading] = useState(false);
    const [recentTasks, setRecentTasks] = useState([]);

    useEffect(() => {
        fetchCurrentTimer();
        fetchRecentTasks();
    }, []);

    useEffect(() => {
        let interval;
        if (currentEntry && currentEntry.is_running) {
            interval = setInterval(() => {
                const start = new Date(currentEntry.start_time).getTime();
                const now = new Date().getTime();
                setElapsed(Math.floor((now - start) / 1000));
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [currentEntry]);

    const fetchCurrentTimer = async () => {
        try {
            const res = await api.get('/timetracking/entries/current/');
            if (res.data) setCurrentEntry(res.data);
            else setCurrentEntry(null);
        } catch (error) { }
    };

    const fetchRecentTasks = async () => {
        try {
            const res = await api.get('/projects/tasks/');
            const tasks = res.data.filter(t => t.status !== 'DONE').slice(0, 5);
            setRecentTasks(tasks);
        } catch (error) { }
    };

    const startTimer = async (taskId) => {
        setLoading(true);
        try {
            const res = await api.post('/timetracking/entries/start_timer/', { task_id: taskId });
            setCurrentEntry(res.data);
        } catch (error) { } finally { setLoading(false); }
    };

    const stopTimer = async () => {
        setLoading(true);
        try {
            await api.post('/timetracking/entries/stop_timer/');
            setCurrentEntry(null);
            setElapsed(0);
        } catch (error) { } finally { setLoading(false); }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-3">
            {currentEntry ? (
                <div className="bg-white border border-[#DFE1E6] rounded-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#61BD4F] animate-pulse" />
                            <span className="text-xs font-semibold text-[#5E6C84] uppercase">Active</span>
                        </div>
                    </div>
                    <div className="text-3xl font-mono font-semibold text-[#172B4D] mb-3 tabular-nums">
                        {formatTime(elapsed)}
                    </div>
                    <p className="text-sm text-[#172B4D] font-medium mb-3 truncate">
                        {currentEntry.task_details?.title || 'Untitled Task'}
                    </p>
                    <button
                        onClick={stopTimer}
                        disabled={loading}
                        className="w-full trello-btn bg-[#EB5A46] text-white hover:bg-[#CF513D] disabled:opacity-50"
                    >
                        <Square size={14} />
                        <span>Stop</span>
                    </button>
                </div>
            ) : (
                <div>
                    <div className="bg-[#F4F5F7] border border-[#DFE1E6] rounded-sm p-4 mb-3">
                        <div className="text-3xl font-mono font-semibold text-[#DFE1E6] mb-2 tabular-nums">
                            00:00:00
                        </div>
                        <p className="text-xs text-[#5E6C84]">No active timer</p>
                    </div>

                    {recentTasks.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-[#5E6C84] uppercase mb-2">Quick Start</p>
                            {recentTasks.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => startTimer(task.id)}
                                    disabled={loading}
                                    className="w-full text-left p-2 bg-white border border-[#DFE1E6] rounded-sm hover:bg-[#F4F5F7] transition-colors disabled:opacity-50 group"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm text-[#172B4D] truncate">{task.title}</span>
                                        <Play size={12} className="text-[#0079BF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TimerWidget;
