import React, { useState } from 'react';
import {
    Search, Download, Plus, ArrowUpDown, Copy, Trash2,
    Check, Star, AlertCircle, FileSpreadsheet, Filter, CheckSquare
} from 'lucide-react';

const TaskTableView = ({
    tasks = [],
    project = {},
    statuses = [],
    allUsers = [],
    onSelectTask,
    onUpdateTask,
    onDuplicateTask,
    onDeleteTask,
    onOpenCreateModal,
    showToast
}) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [sortField, setSortField] = useState('id');
    const [sortAsc, setSortAsc] = useState(true);

    const getIssueTypeIcon = (type) => {
        switch (type) {
            case 'EPIC': return <div className="w-3.5 h-3.5 bg-[#904EE2] rounded-[2px] flex items-center justify-center text-white text-[8px] font-bold">E</div>;
            case 'BUG': return <div className="w-3.5 h-3.5 bg-[#E5493A] rounded-[2px] flex items-center justify-center text-white"><AlertCircle size={9} /></div>;
            case 'STORY': return <div className="w-3.5 h-3.5 bg-[#0052CC] rounded-[2px] flex items-center justify-center text-white"><CheckSquare size={9} /></div>;
            case 'FEATURE': return <div className="w-3.5 h-3.5 bg-[#00A3BF] rounded-[2px] flex items-center justify-center text-white"><Star size={9} /></div>;
            default: return <div className="w-3.5 h-3.5 bg-[#4C9AFF] rounded-[2px] flex items-center justify-center text-white"><Check size={9} /></div>;
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(true);
        }
    };

    const filteredTasks = tasks.filter(t => {
        const key = `${project?.key || 'TASK'}-${t.id}`;
        const matchesSearch = !search ||
            t.title?.toLowerCase().includes(search.toLowerCase()) ||
            key.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    }).sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = (bVal || '').toLowerCase();
        }
        if (aVal < bVal) return sortAsc ? -1 : 1;
        if (aVal > bVal) return sortAsc ? 1 : -1;
        return 0;
    });

    const exportCSV = () => {
        const headers = ['Key', 'Title', 'Status', 'Priority', 'Type', 'Story Points', 'Assignee', 'Due Date'];
        const rows = filteredTasks.map(t => [
            `${project?.key || 'TASK'}-${t.id}`,
            `"${(t.title || '').replace(/"/g, '""')}"`,
            t.status,
            t.priority,
            t.issue_type,
            t.story_points || 0,
            t.assigned_to_details?.username || 'Unassigned',
            t.due_date ? new Date(t.due_date).toLocaleDateString() : ''
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${project?.name || 'project'}_tasks_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (showToast) showToast('Exported tasks to CSV', 'success');
    };

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Table Controls */}
            <div className="p-3.5 border-b border-[#DFE1E6] bg-[#FAFBFC] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={14} />
                        <input
                            type="text"
                            placeholder="Filter tasks in table..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 bg-white border border-[#DFE1E6] rounded text-xs outline-none focus:border-[#0052CC] w-64 shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-[#DFE1E6] rounded px-2 py-1 shadow-sm">
                        <span className="text-[10px] font-bold text-[#5E6C84] uppercase">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-[#172B4D] outline-none cursor-pointer"
                        >
                            <option value="ALL">All Statuses</option>
                            {statuses.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-[#DFE1E6] rounded px-2 py-1 shadow-sm">
                        <span className="text-[10px] font-bold text-[#5E6C84] uppercase">Priority:</span>
                        <select
                            value={priorityFilter}
                            onChange={e => setPriorityFilter(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-[#172B4D] outline-none cursor-pointer"
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#5E6C84] font-medium mr-2">
                        {filteredTasks.length} of {tasks.length} tasks
                    </span>
                    <button
                        onClick={exportCSV}
                        className="px-3 py-1.5 bg-white border border-[#DFE1E6] hover:bg-[#F4F5F7] text-[#172B4D] rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        title="Download CSV spreadsheet"
                    >
                        <Download size={13} /> Export CSV
                    </button>
                    <button
                        onClick={onOpenCreateModal}
                        className="px-3 py-1.5 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus size={13} /> Add Task
                    </button>
                </div>
            </div>

            {/* Spreadsheet Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[950px]">
                    <thead className="bg-[#F4F5F7] border-b border-[#DFE1E6] sticky top-0 z-10 text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider select-none">
                        <tr>
                            <th className="py-2.5 px-3 border-r border-[#DFE1E6] w-24 cursor-pointer hover:bg-[#EBECF0]" onClick={() => handleSort('id')}>
                                <div className="flex items-center justify-between">Key <ArrowUpDown size={11} /></div>
                            </th>
                            <th className="py-2.5 px-3 border-r border-[#DFE1E6] min-w-[280px] cursor-pointer hover:bg-[#EBECF0]" onClick={() => handleSort('title')}>
                                <div className="flex items-center justify-between">Title <ArrowUpDown size={11} /></div>
                            </th>
                            <th className="py-2.5 px-3 border-r border-[#DFE1E6] w-36 cursor-pointer hover:bg-[#EBECF0]" onClick={() => handleSort('status')}>
                                <div className="flex items-center justify-between">Status <ArrowUpDown size={11} /></div>
                            </th>
                            <th className="py-2.5 px-3 border-r border-[#DFE1E6] w-32 cursor-pointer hover:bg-[#EBECF0]" onClick={() => handleSort('priority')}>
                                <div className="flex items-center justify-between">Priority <ArrowUpDown size={11} /></div>
                            </th>
                            <th className="py-2.5 px-3 border-r border-[#DFE1E6] w-28">Type</th>
                            <th className="py-2.5 px-3 border-r border-[#DFE1E6] w-20 cursor-pointer hover:bg-[#EBECF0]" onClick={() => handleSort('story_points')}>
                                <div className="flex items-center justify-between">Pts <ArrowUpDown size={11} /></div>
                            </th>
                            <th className="py-2.5 px-3 border-r border-[#DFE1E6] w-36">Assignee</th>
                            <th className="py-2.5 px-3 border-r border-[#DFE1E6] w-32 cursor-pointer hover:bg-[#EBECF0]" onClick={() => handleSort('due_date')}>
                                <div className="flex items-center justify-between">Due Date <ArrowUpDown size={11} /></div>
                            </th>
                            <th className="py-2.5 px-3 w-20 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFE1E6] text-xs">
                        {filteredTasks.map(task => (
                            <tr key={task.id} className="hover:bg-[#F4F5F7] group transition-colors">
                                <td className="py-2 px-3 border-r border-[#DFE1E6] font-mono font-bold text-[#0052CC] whitespace-nowrap">
                                    {project?.key || 'TASK'}-{task.id}
                                </td>
                                <td
                                    className="py-2 px-3 border-r border-[#DFE1E6] font-medium text-[#172B4D] cursor-pointer hover:text-[#0052CC]"
                                    onClick={() => onSelectTask(task)}
                                >
                                    {task.title}
                                </td>
                                <td className="py-1.5 px-2 border-r border-[#DFE1E6]">
                                    <select
                                        value={task.status}
                                        onChange={e => onUpdateTask(task.id, { status: e.target.value })}
                                        className="w-full px-2 py-1 rounded text-xs font-bold border border-transparent hover:border-[#DFE1E6] bg-transparent focus:bg-white focus:border-[#0052CC] outline-none cursor-pointer"
                                    >
                                        {statuses.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                    </select>
                                </td>
                                <td className="py-1.5 px-2 border-r border-[#DFE1E6]">
                                    <select
                                        value={task.priority}
                                        onChange={e => onUpdateTask(task.id, { priority: e.target.value })}
                                        className={`w-full px-2 py-1 rounded text-xs font-bold border border-transparent hover:border-[#DFE1E6] outline-none cursor-pointer ${
                                            task.priority === 'CRITICAL' ? 'text-red-600' :
                                            task.priority === 'HIGH' ? 'text-orange-600' :
                                            task.priority === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                                        }`}
                                    >
                                        <option value="CRITICAL">Critical</option>
                                        <option value="HIGH">High</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="LOW">Low</option>
                                    </select>
                                </td>
                                <td className="py-2 px-3 border-r border-[#DFE1E6]">
                                    <div className="flex items-center gap-1.5">
                                        {getIssueTypeIcon(task.issue_type)}
                                        <span className="text-[11px] font-semibold text-[#5E6C84]">{task.issue_type}</span>
                                    </div>
                                </td>
                                <td className="py-2 px-3 border-r border-[#DFE1E6]">
                                    <span className="px-2 py-0.5 rounded bg-[#EBECF0] text-[#172B4D] font-mono font-bold text-[11px]">
                                        {task.story_points || 0}
                                    </span>
                                </td>
                                <td className="py-1.5 px-2 border-r border-[#DFE1E6]">
                                    <select
                                        value={task.assigned_to || ''}
                                        onChange={e => onUpdateTask(task.id, { assigned_to: e.target.value ? parseInt(e.target.value) : null })}
                                        className="w-full px-2 py-1 rounded text-xs border border-transparent hover:border-[#DFE1E6] bg-transparent focus:bg-white outline-none cursor-pointer"
                                    >
                                        <option value="">Unassigned</option>
                                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                    </select>
                                </td>
                                <td className="py-2 px-3 border-r border-[#DFE1E6] text-[#5E6C84] whitespace-nowrap">
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                                </td>
                                <td className="py-2 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => onDuplicateTask(task.id)}
                                            className="p-1 text-[#5E6C84] hover:text-[#0052CC] hover:bg-[#EBECF0] rounded"
                                            title="Duplicate task"
                                        >
                                            <Copy size={13} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteTask(task.id)}
                                            className="p-1 text-[#5E6C84] hover:text-red-600 hover:bg-red-50 rounded"
                                            title="Delete task"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredTasks.length === 0 && (
                    <div className="py-16 text-center text-[#5E6C84]">
                        <FileSpreadsheet size={40} className="mx-auto mb-2 opacity-40 text-[#0052CC]" />
                        <p className="font-semibold text-[#172B4D]">No tasks match the filter criteria</p>
                        <p className="text-xs text-[#5E6C84] mt-1">Try resetting search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskTableView;

