import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';

const GanttChart = ({ tasks, onTaskClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get date range for the current view
    const getStartDate = () => {
        const date = new Date(currentDate);
        date.setDate(1); // Start of month
        return date;
    };

    const getEndDate = () => {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() + 1);
        date.setDate(0); // End of month
        return date;
    };

    const startDate = getStartDate();
    const endDate = getEndDate();
    const daysInView = endDate.getDate();

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    // Calculate position and width for a task bar
    const getTaskStyle = (task) => {
        let taskStart = task.created_at ? new Date(task.created_at) : new Date();
        const taskEnd = task.due_date ? new Date(task.due_date) : new Date(taskStart.getTime() + 86400000 * 3);

        // Check intersection with current view
        if (taskEnd < startDate || taskStart > endDate) return null;

        const effectiveStart = taskStart < startDate ? startDate : taskStart;
        const effectiveEnd = taskEnd > endDate ? endDate : taskEnd;

        // Calculate percentages
        const totalDuration = endDate.getTime() - startDate.getTime();
        const startOffset = effectiveStart.getTime() - startDate.getTime();
        const duration = effectiveEnd.getTime() - effectiveStart.getTime();

        const left = (startOffset / totalDuration) * 100;
        const width = Math.max((duration / totalDuration) * 100, 2); // Minimum 2% width

        return {
            left: `${left}%`,
            width: `${width}%`
        };
    };

    // Generate days for header
    const daysHeader = Array.from({ length: daysInView }, (_, i) => i + 1);

    return (
        <div className="bg-white border border-[#DFE1E6] flex flex-col h-full rounded-sm overflow-hidden">
            <header className="px-6 py-4 flex items-center justify-between border-b border-[#DFE1E6] bg-white">
                <div className="flex items-center gap-6">
                    <h2 className="text-lg font-bold text-[#172B4D]">Timeline</h2>
                    <div className="flex items-center bg-[#EBECF0] h-8 rounded-sm p-0.5">
                        <button onClick={handlePrev} className="px-2 h-full hover:bg-white rounded-sm text-[#42526E] transition-colors"><ChevronLeft size={16} /></button>
                        <span className="px-4 text-xs font-bold text-[#172B4D] min-w-[140px] text-center">
                            {startDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={handleNext} className="px-2 h-full hover:bg-white rounded-sm text-[#42526E] transition-colors"><ChevronRight size={16} /></button>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">
                    <Info size={14} className="text-[#0052CC]" />
                    View by Day
                </div>
            </header>

            <div className="flex-1 overflow-auto relative custom-scrollbar flex flex-col min-h-0 bg-[#FAFBFC]">
                {/* Timeline Header */}
                <div className="flex bg-[#F4F5F7] sticky top-0 z-20 min-w-max border-b border-[#DFE1E6]">
                    <div className="w-[300px] p-3 border-r border-[#DFE1E6] font-bold text-[11px] text-[#5E6C84] uppercase tracking-widest bg-[#F4F5F7] sticky left-0 z-30">Issue</div>
                    <div className="flex-1 flex min-w-[1200px]">
                        {daysHeader.map(day => (
                            <div key={day} className="flex-1 min-w-[40px] border-r border-[#DFE1E6]/50 text-center py-2 text-[10px] font-bold text-[#5E6C84]">
                                {day}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows */}
                <div className="min-w-max divide-y divide-[#DFE1E6]">
                    {tasks.map(task => {
                        const style = getTaskStyle(task);
                        return (
                            <div key={task.id} className="flex hover:bg-[#F4F5F7] transition-colors group">
                                <div className="w-[300px] p-3 border-r border-[#DFE1E6] text-sm font-medium text-[#172B4D] truncate sticky left-0 bg-white group-hover:bg-[#F4F5F7] z-10 flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-[2px] shrink-0 ${task.priority === 'HIGH' ? 'bg-[#E54937]' : task.priority === 'MEDIUM' ? 'bg-[#FF9F1A]' : 'bg-[#0052CC]'}`} />
                                    <span className="truncate cursor-pointer hover:text-[#0052CC] font-bold" onClick={() => onTaskClick(task)}>
                                        <span className="text-[#5E6C84] mr-2 text-xs">MB-{task.id}</span>
                                        {task.title}
                                    </span>
                                </div>
                                <div className="flex-1 relative min-w-[1200px] h-12">
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {daysHeader.map(day => (
                                            <div key={day} className="flex-1 border-r border-[#DFE1E6]/30"></div>
                                        ))}
                                    </div>

                                    {/* Task Bar */}
                                    {style && (
                                        <div
                                            onClick={() => onTaskClick(task)}
                                            className={`absolute top-3 bottom-3 rounded-[3px] shadow-sm border cursor-pointer hover:brightness-95 transition-all text-[10px] font-bold text-white flex items-center px-3 truncate
                                                ${task.status === 'DONE' ? 'bg-[#00875A] border-[#006644]' :
                                                    task.priority === 'CRITICAL' || task.priority === 'HIGH' ? 'bg-[#E54937] border-[#BF2600]' :
                                                        'bg-[#0052CC] border-[#0747A6]'}`}
                                            style={style}
                                            title={`${task.title} (${task.status})`}
                                        >
                                            {style.width !== '2%' && task.title}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {tasks.length === 0 && (
                        <div className="p-12 text-center text-[#5E6C84] italic bg-white w-full min-w-max">
                            No issues to display in timeline.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
