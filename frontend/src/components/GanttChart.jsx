import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Info, AlertCircle } from 'lucide-react';
import api from '../services/api';

const GanttChart = ({ tasks, onTaskClick, onUpdateTask }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month'
    const [draggedTask, setDraggedTask] = useState(null);
    const [dragOffset, setDragOffset] = useState(0);
    const containerRef = useRef(null);

    // Get date range based on view mode
    const getStartDate = () => {
        const date = new Date(currentDate);
        if (viewMode === 'month') {
            date.setDate(1);
        } else if (viewMode === 'week') {
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            date.setDate(diff);
        }
        date.setHours(0, 0, 0, 0);
        return date;
    };

    const getEndDate = () => {
        const date = getStartDate();
        const end = new Date(date);
        if (viewMode === 'month') {
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
        } else if (viewMode === 'week') {
            end.setDate(end.getDate() + 6);
        } else if (viewMode === 'day') {
            end.setDate(end.getDate() + 1);
        }
        end.setHours(23, 59, 59, 999);
        return end;
    };

    const startDate = getStartDate();
    const endDate = getEndDate();
    const totalDuration = endDate.getTime() - startDate.getTime();

    // Calculate visible tasks and their positions
    const getTaskPos = (task) => {
        const taskStart = task.start_date ? new Date(task.start_date) : (task.created_at ? new Date(task.created_at) : new Date());
        const taskEnd = task.due_date ? new Date(task.due_date) : new Date(taskStart.getTime() + 86400000 * 3);

        // Check if task is at least partially in view
        if (taskEnd < startDate || taskStart > endDate) return null;

        const effectiveStart = taskStart < startDate ? startDate : taskStart;
        const effectiveEnd = taskEnd > endDate ? endDate : taskEnd;

        const startOffset = effectiveStart.getTime() - startDate.getTime();
        const duration = effectiveEnd.getTime() - effectiveStart.getTime();

        const left = (startOffset / totalDuration) * 100;
        const width = Math.max((duration / totalDuration) * 100, 1);

        return { left, width, taskStart, taskEnd };
    };

    const visibleTasks = tasks.map(t => ({ ...t, pos: getTaskPos(t) })).filter(t => t.pos !== null);

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
        else newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
        else newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    // Dependency Lines Logic
    const renderDependencies = () => {
        const lines = [];
        const taskPositions = {};
        const timelineElement = containerRef.current?.querySelector('.timeline-grid');
        const svgWidth = timelineElement?.offsetWidth || 0;
        const ROW_HEIGHT = 48;

        // Prepare percent-based positions (left/width are percent values)
        visibleTasks.forEach((task, index) => {
            taskPositions[task.id] = {
                x: task.pos.left + task.pos.width, // percent
                y: index * ROW_HEIGHT + ROW_HEIGHT / 2, // px
                start_x: task.pos.left // percent
            };
        });

        // If layout isn't measured yet, skip rendering lines
        if (!svgWidth) return null;

        visibleTasks.forEach((task) => {
            if (task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach(depId => {
                    const depPos = taskPositions[depId];
                    const currentPos = taskPositions[task.id];

                    if (depPos && currentPos) {
                        // Convert percent-based X coords to pixel positions relative to the measured svg width
                        const startXpx = (depPos.x / 100) * svgWidth;
                        const endXpx = (currentPos.start_x / 100) * svgWidth;
                        const midXpx = startXpx + (endXpx - startXpx) / 2;
                        const startY = depPos.y;
                        const endY = currentPos.y;

                        lines.push(
                            <path
                                key={`${depId}-${task.id}`}
                                d={`M ${startXpx.toFixed(2)} ${startY} L ${midXpx.toFixed(2)} ${startY} L ${midXpx.toFixed(2)} ${endY} L ${endXpx.toFixed(2)} ${endY}`}
                                fill="none"
                                stroke="#A5ADBA"
                                strokeWidth="1.5"
                                markerEnd="url(#arrowhead)"
                                className="opacity-40"
                            />
                        );
                    }
                });
            }
        });

        return (
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-15">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#A5ADBA" />
                    </marker>
                </defs>
                {lines}
            </svg>
        );
    };

    // Drag handlers
    const onBarMouseDown = (e, task) => {
        if (e.button !== 0) return;
        setDraggedTask({
            ...task,
            initialX: e.clientX,
        });
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!draggedTask) return;
            const deltaX = e.clientX - draggedTask.initialX;
            const containerWidth = containerRef.current?.querySelector('.timeline-grid')?.offsetWidth || 1000;
            const deltaPercent = (deltaX / containerWidth) * 100;
            setDragOffset(deltaPercent);
        };

        const handleMouseUp = async (e) => {
            if (!draggedTask) return;

            const finalDeltaX = e.clientX - draggedTask.initialX;
            const timelineElement = containerRef.current?.querySelector('.timeline-grid');
            const containerWidth = timelineElement?.offsetWidth || 1000;
            const deltaMs = (finalDeltaX / containerWidth) * totalDuration;

            const newStart = new Date(new Date(draggedTask.start_date || draggedTask.created_at || new Date()).getTime() + deltaMs);
            const newEnd = new Date(new Date(draggedTask.due_date || newStart.getTime() + 86400000 * 3).getTime() + deltaMs);

            try {
                if (onUpdateTask) {
                    await onUpdateTask(draggedTask.id, {
                        start_date: newStart.toISOString(),
                        due_date: newEnd.toISOString()
                    });
                }
            } catch (err) {
                console.error("Failed to update task via Gantt", err);
            }

            setDraggedTask(null);
            setDragOffset(0);
        };

        if (draggedTask) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggedTask, totalDuration, onUpdateTask]);

    const getDaysHeader = () => {
        const days = [];
        const curr = new Date(startDate);
        while (curr <= endDate) {
            days.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
        return days;
    };

    const daysHeader = getDaysHeader();

    return (
        <div className="bg-white border border-[#DFE1E6] flex flex-col h-full rounded-sm overflow-hidden select-none" ref={containerRef}>
            <header className="px-6 py-4 flex items-center justify-between border-b border-[#DFE1E6] bg-white z-40">
                <div className="flex items-center gap-6">
                    <h2 className="text-lg font-bold text-[#172B4D]">Timeline</h2>
                    <div className="flex items-center bg-[#EBECF0] h-8 rounded-sm p-0.5">
                        <button onClick={handlePrev} className="px-2 h-full hover:bg-white rounded-sm text-[#42526E] transition-colors"><ChevronLeft size={16} /></button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 h-full hover:bg-white rounded-sm text-[10px] font-bold text-[#42526E] transition-colors border-x border-[#DFE1E6]/50"
                        >
                            TODAY
                        </button>
                        <span className="px-4 text-xs font-bold text-[#172B4D] min-w-[140px] text-center">
                            {viewMode === 'month' ? startDate.toLocaleDateString('default', { month: 'long', year: 'numeric' }) :
                                viewMode === 'week' ? `Week of ${startDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}` :
                                    startDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button onClick={handleNext} className="px-2 h-full hover:bg-white rounded-sm text-[#42526E] transition-colors"><ChevronRight size={16} /></button>
                    </div>
                    <div className="flex items-center bg-[#EBECF0] h-8 rounded-sm p-0.5">
                        {['day', 'week', 'month'].map(m => (
                            <button
                                key={m}
                                onClick={() => setViewMode(m)}
                                className={`px-3 h-full rounded-sm text-[10px] font-bold uppercase transition-all ${viewMode === m ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#42526E] hover:bg-white/50'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-[#5E6C84] uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#A5ADBA]" /> Dependencies</div>
                    <div className="flex items-center gap-1.5"><AlertCircle size={14} className="text-[#0052CC]" /> Drag bars to reschedule</div>
                </div>
            </header>

            <div className="flex-1 overflow-auto relative custom-scrollbar flex flex-col min-h-0 bg-[#FAFBFC]">
                {/* Timeline Header */}
                <div className="flex bg-[#F4F5F7] sticky top-0 z-40 min-w-max border-b border-[#DFE1E6]">
                    <div className="w-[300px] p-3 border-r border-[#DFE1E6] font-bold text-[11px] text-[#5E6C84] uppercase tracking-widest bg-[#F4F5F7] sticky left-0 z-50">Issue</div>
                    <div className="flex-1 flex min-w-[1200px]">
                        {daysHeader.map((date, i) => (
                            <div key={i} className={`flex-1 min-w-[40px] border-r border-[#DFE1E6]/50 text-center py-2 text-[10px] font-bold ${[0, 6].includes(date.getDay()) ? 'bg-[#EBECF0] text-[#5E6C84]' : 'text-[#5E6C84]'}`}>
                                {viewMode === 'month' ? date.getDate() : date.toLocaleDateString('default', { weekday: 'short', day: 'numeric' })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows & Lines */}
                <div className="min-w-max relative flex-1">
                    <div className="absolute inset-0 pointer-events-none timeline-grid min-w-[1200px] ml-[300px]">
                        {daysHeader.map((date, i) => (
                            <div key={i} className={`absolute top-0 bottom-0 border-r border-[#DFE1E6]/30 ${[0, 6].includes(date.getDay()) ? 'bg-[#EBECF0]/20' : ''}`} style={{ left: `${(i / daysHeader.length) * 100}%`, width: `${(1 / daysHeader.length) * 100}%` }} />
                        ))}
                    </div>

                    <div className="relative z-10 min-w-max">
                        {renderDependencies()}
                        <div className="divide-y divide-[#DFE1E6]">
                            {visibleTasks.map((task) => {
                                const isDragged = draggedTask?.id === task.id;
                                return (
                                    <div key={task.id} className="flex hover:bg-[#F4F5F7]/50 transition-colors group h-12">
                                        <div className="w-[300px] p-3 border-r border-[#DFE1E6] text-sm font-medium text-[#172B4D] truncate sticky left-0 bg-white group-hover:bg-[#F4F5F7] z-30 flex items-center gap-3 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                            <div className={`w-3 h-3 rounded-[2px] shrink-0 ${task.priority === 'HIGH' ? 'bg-[#E54937]' : task.priority === 'MEDIUM' ? 'bg-[#FF9F1A]' : 'bg-[#0052CC]'}`} />
                                            <span className="truncate cursor-pointer hover:text-[#0052CC] font-bold" onClick={() => onTaskClick?.(task)}>
                                                <span className="text-[#5E6C84] mr-2 text-xs">TASK-{task.id}</span>
                                                {task.title}
                                            </span>
                                        </div>
                                        <div className="flex-1 relative min-w-[1200px]">
                                            <div
                                                onMouseDown={(e) => onBarMouseDown(e, task)}
                                                onClick={(e) => {
                                                    if (!draggedTask) onTaskClick?.(task);
                                                }}
                                                className={`absolute top-2 bottom-2 rounded-[3px] shadow-sm border cursor-move hover:brightness-110 transition-shadow text-[10px] font-bold text-white flex items-center px-3 truncate z-20
                                                    ${task.status === 'DONE' ? 'bg-[#00875A] border-[#006644]' :
                                                        task.priority === 'CRITICAL' || task.priority === 'HIGH' ? 'bg-[#E54937] border-[#BF2600]' :
                                                            'bg-[#0052CC] border-[#0747A6]'}
                                                    ${isDragged ? 'opacity-50 scale-[1.02] shadow-xl z-50 transition-none' : 'transition-all'}`}
                                                style={{
                                                    left: `${task.pos.left + (isDragged ? dragOffset : 0)}%`,
                                                    width: `${task.pos.width}%`
                                                }}
                                                title={`${task.title} (${task.status}) - Drag to reschedule`}
                                            >
                                                {task.pos.width > 5 && task.title}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {visibleTasks.length === 0 && (
                        <div className="p-20 text-center flex flex-col items-center justify-center bg-white">
                            <Info size={48} className="text-[#DFE1E6] mb-4" />
                            <p className="text-[#5E6C84] font-medium">No active tasks in this time period.</p>
                            <button onClick={() => setViewMode('month')} className="mt-4 text-xs font-bold text-[#0052CC] hover:underline">Reset to Month View</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
