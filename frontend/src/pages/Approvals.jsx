import { useState, useEffect } from 'react';
import { Check, X, Clock, Edit2 } from 'lucide-react';
import api from '../services/api';
import EditTimeEntryModal from '../components/EditTimeEntryModal';

const Approvals = () => {
    const [entries, setEntries] = useState([]);
    const [filter, setFilter] = useState('PENDING');
    const [editingEntry, setEditingEntry] = useState(null);

    const fetchEntries = async () => {
        try {
            const res = await api.get('/timetracking/entries/');
            setEntries(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleAction = async (id, action) => {
        try {
            await api.post(`/timetracking/entries/${id}/${action}/`, {});
            fetchEntries();
        } catch (err) {
            alert(err.response?.data?.error || `Failed to ${action} entry`);
        }
    };

    const filtered = entries.filter(e => filter === 'ALL' || (e.approval_status || 'PENDING') === filter);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans text-[#172B4D]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Clock className="text-[#0079BF]" /> Timesheet Approvals
                    </h1>
                    <p className="text-sm text-[#5E6C84]">Review and approve team time entries</p>
                </div>
                <div className="flex gap-2">
                    {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(st => (
                        <button
                            key={st}
                            onClick={() => setFilter(st)}
                            className={`px-3 py-1.5 rounded text-xs font-bold ${filter === st ? 'bg-[#0079BF] text-white' : 'bg-white border border-[#DFE1E6] text-[#5E6C84]'}`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-[#DFE1E6] rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#F4F5F7] border-b border-[#DFE1E6] text-xs uppercase text-[#5E6C84]">
                        <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Duration</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFE1E6]">
                        {filtered.map(entry => (
                            <tr key={entry.id}>
                                <td className="px-4 py-3 font-medium">{entry.user_name || entry.user}</td>
                                <td className="px-4 py-3 text-[#5E6C84]">{entry.description || '—'}</td>
                                <td className="px-4 py-3 font-semibold">{entry.duration_minutes}m</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        entry.approval_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                        entry.approval_status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {entry.approval_status || 'PENDING'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <button
                                        onClick={() => setEditingEntry(entry)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F4F5F7] border border-[#DFE1E6] text-[#42526E] rounded text-xs font-semibold transition"
                                        title="Edit Entry"
                                    >
                                        <Edit2 size={12} /> Edit
                                    </button>
                                    {(entry.approval_status || 'PENDING') === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(entry.id, 'approve')}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                                            >
                                                <Check size={12} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(entry.id, 'reject')}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
                                            >
                                                <X size={12} /> Reject
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-[#5E6C84]">
                                    No time entries in this status.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <EditTimeEntryModal
                isOpen={Boolean(editingEntry)}
                onClose={() => setEditingEntry(null)}
                entry={editingEntry}
                onSaved={fetchEntries}
            />
        </div>
    );
};

export default Approvals;
