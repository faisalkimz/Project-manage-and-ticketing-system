import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';

const CalendarView = ({ tasks, onTaskClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
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
            return isSameDay(target, taskDate);
        });
    };

    const renderCalendar = () => {
        const blanks = Array(firstDay).fill(null);
        const daysArray = Array.from({ length: days }, (_, i) => i + 1);
        const allSlots = [...blanks, ...daysArray];

        return (
            <div className="grid grid-cols-7 gap-px bg-[#DFE1E6] border border-[#DFE1E6]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-[#F4F5F7] py-2 text-center text-[10px] font-bold text-[#5E6C84] uppercase tracking-widest border-b border-[#DFE1E6]">
                        {day}
                    </div>
                ))}
                {allSlots.map((day, index) => {
                    const dayTasks = day ? getTasksForDay(day) : [];
                    const isToday = day && isSameDay(new Date(), new Date(currentDate.getFullYear(), currentDate.getMonth(), day));

                    return (
                        <div key={index} className={`min-h-[140px] bg-white p-2 relative group transition-colors ${!day ? 'bg-[#FAFBFC]' : 'hover:bg-[#F4F5F7]'}`}>
                            {day && (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-bold leading-none ${isToday ? 'bg-[#0052CC] text-white w-6 h-6 flex items-center justify-center rounded-sm' : 'text-[#172B4D]'}`}>
                                            {day}
                                        </span>
                                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#EBECF0] rounded-sm text-[#5E6C84] transition-opacity">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        {dayTasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => onTaskClick(task)}
                                                className={`px-2 py-1.5 rounded-[3px] border text-[10px] font-bold cursor-pointer truncate transition-all
                                                    ${task.priority === 'CRITICAL' || task.priority === 'HIGH' ? 'bg-[#FFEBE6] border-[#FFBDAD] text-[#BF2600]' :
                                                        task.status === 'DONE' ? 'bg-[#E3FCEF] border-[#ABF5D1] text-[#006644] line-through opacity-70' :
                                                            'bg-[#DEEBFF] border-[#B3D4FF] text-[#0747A6]'}`}
                                            >
                                                MB-{task.id} {task.title}
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
        <div className="bg-white border border-[#DFE1E6] flex flex-col h-full rounded-sm overflow-hidden">
            <header className="px-6 py-4 flex items-center justify-between border-b border-[#DFE1E6] bg-white">
                <div className="flex items-center gap-6">
                    <h2 className="text-lg font-bold text-[#172B4D]">
                        {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex items-center bg-[#EBECF0] h-8 rounded-sm p-0.5">
                        <button onClick={prevMonth} className="px-2 h-full hover:bg-white rounded-sm text-[#42526E] transition-colors"><ChevronLeft size={16} /></button>
                        <button onClick={goToToday} className="px-3 h-full hover:bg-white rounded-sm text-xs font-bold text-[#42526E] transition-colors mx-0.5">Today</button>
                        <button onClick={nextMonth} className="px-2 h-full hover:bg-white rounded-sm text-[#42526E] transition-colors"><ChevronRight size={16} /></button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px] bg-[#DEEBFF] border border-[#B3D4FF]"></span> Todo</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px] bg-[#FFEBE6] border border-[#FFBDAD]"></span> Priority</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px] bg-[#E3FCEF] border border-[#ABF5D1]"></span> Done</div>
                    </div>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {renderCalendar()}
            </div>
        </div>
    );
};

export default CalendarView;
