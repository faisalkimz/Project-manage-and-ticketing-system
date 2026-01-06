import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const GanttChart = ({ tasks, onTaskClick }) => {
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
    const [currentDate, setCurrentDate] = useState(new Date());
    const containerRef = useRef(null);

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
        // Fallback: if no date, don't show or show at start?
        // Let's assume tasks usually have a due_date.
        // If we have created_at as start, use that.

        let taskStart = task.created_at ? new Date(task.created_at) : new Date();
        // If start is before view start, clip it visually?
        // Simpler for v1: use due_date as end, and (due_date - 2 days) as start if no strict start date
        // Actually this API might not have explicit start_dates for tasks yet, only due_dates.
        // Let's fake a "start date" or assume 3 days duration for visualization if missing.

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
        <div className="bg-white rounded-lg shadow-sm border border-zinc-200 h-full flex flex-col overflow-hidden">
            {/* Controls */}
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Calendar size={12} />
                        </span>
                        Gantt Timeline
                    </h2>
                    <div className="flex items-center rounded-md border border-zinc-200 bg-white shadow-sm">
                        <button onClick={handlePrev} className="p-1 px-2 hover:bg-zinc-50 text-zinc-500 border-r border-zinc-200"><ChevronLeft size={14} /></button>
                        <span className="px-3 py-1 text-xs font-semibold text-zinc-700 min-w-[120px] text-center">
                            {startDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={handleNext} className="p-1 px-2 hover:bg-zinc-50 text-zinc-500 border-l border-zinc-200"><ChevronRight size={14} /></button>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 overflow-auto relative custom-scrollbar flex flex-col">
                {/* Timeline Header */}
                <div className="flex border-b border-zinc-200 bg-zinc-50 sticky top-0 z-10 min-w-max">
                    <div className="w-64 p-3 border-r border-zinc-200 font-semibold text-xs text-zinc-500 bg-zinc-50 sticky left-0 z-20">Task Name</div>
                    <div className="flex-1 flex min-w-[800px]">
                        {daysHeader.map(day => (
                            <div key={day} className="flex-1 min-w-[30px] border-r border-zinc-200/50 text-center py-2 text-[10px] text-zinc-400">
                                {day}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows */}
                <div className="min-w-max pb-10">
                    {tasks.map(task => {
                        const style = getTaskStyle(task);
                        return (
                            <div key={task.id} className="flex border-b border-zinc-100 hover:bg-zinc-50 transition-colors group">
                                <div className="w-64 p-3 border-r border-zinc-200 text-sm font-medium text-zinc-700 truncate sticky left-0 bg-white group-hover:bg-zinc-50 z-10 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${task.status === 'DONE' ? 'bg-emerald-500' : task.priority === 'HIGH' ? 'bg-orange-500' : 'bg-zinc-300'}`}></div>
                                    <span className="truncate" onClick={() => onTaskClick(task)} role="button">{task.title}</span>
                                </div>
                                <div className="flex-1 relative min-w-[800px] h-10">
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {daysHeader.map(day => (
                                            <div key={day} className="flex-1 border-r border-zinc-50"></div>
                                        ))}
                                    </div>

                                    {/* Task Bar */}
                                    {style && (
                                        <div
                                            onClick={() => onTaskClick(task)}
                                            className={`absolute top-2 bottom-2 rounded-md shadow-sm border cursor-pointer hover:brightness-95 transition-all text-[10px] font-medium text-white flex items-center px-2 truncate
                                                ${task.status === 'DONE' ? 'bg-emerald-500 border-emerald-600' :
                                                    task.priority === 'CRITICAL' ? 'bg-red-500 border-red-600' :
                                                        'bg-indigo-500 border-indigo-600'}`}
                                            style={style}
                                        >
                                            {style.width !== '2%' && task.title}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
