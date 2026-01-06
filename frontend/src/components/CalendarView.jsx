import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

const CalendarView = ({ tasks, onTaskClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const getTasksForDay = (day) => {
        const target = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = new Date(task.due_date);
            // Fix timezone offset issues by comparing simply YYYY-MM-DD strings or using UTC logic if needed
            // For now, simple local comparison
            return isSameDay(target, taskDate); // Note: this assumes due_date is stored/parsed correctly
        });
    };

    const renderCalendar = () => {
        const blanks = Array(firstDay).fill(null);
        const daysArray = Array.from({ length: days }, (_, i) => i + 1);
        const allSlots = [...blanks, ...daysArray];

        return (
            <div className="grid grid-cols-7 gap-px bg-zinc-200 border border-zinc-200 rounded-b-lg overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-zinc-50 py-2 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
                {allSlots.map((day, index) => {
                    const dayTasks = day ? getTasksForDay(day) : [];
                    const isToday = day && isSameDay(new Date(), new Date(currentDate.getFullYear(), currentDate.getMonth(), day));

                    return (
                        <div key={index} className={`min-h-[120px] bg-white p-2 relative group hover:bg-zinc-50/50 transition-colors ${!day ? 'bg-zinc-50/30' : ''}`}>
                            {day && (
                                <>
                                    <div className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-zinc-900 text-white' : 'text-zinc-500'}`}>
                                        {day}
                                    </div>
                                    <div className="space-y-1">
                                        {dayTasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => onTaskClick(task)}
                                                className={`px-2 py-1 rounded border text-[10px] font-medium cursor-pointer truncate transition-all shadow-sm hover:shadow hover:scale-[1.02]
                                                    ${task.priority === 'CRITICAL' ? 'bg-red-50 border-red-100 text-red-700' :
                                                        task.status === 'DONE' ? 'bg-zinc-100 border-zinc-200 text-zinc-400 line-through' :
                                                            'bg-indigo-50 border-indigo-100 text-indigo-700'}`}
                                            >
                                                {task.title}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden h-full flex flex-col">
            <header className="p-4 border-b border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                        <CalendarIcon size={20} className="text-zinc-400" />
                        {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex items-center rounded-md border border-zinc-200 bg-white">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-zinc-50 text-zinc-500 border-r border-zinc-200"><ChevronLeft size={16} /></button>
                        <button onClick={goToToday} className="px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 text-zinc-600">Today</button>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-zinc-50 text-zinc-500 border-l border-zinc-200"><ChevronRight size={16} /></button>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Due</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-300"></span> Done</div>
                </div>
            </header>
            <div className="flex-1 overflow-auto">
                {renderCalendar()}
            </div>
        </div>
    );
};

export default CalendarView;
