import { useState, useEffect } from 'react';
import { X, Clock, Save, AlertCircle } from 'lucide-react';
import api from '../services/api';

const EditTimeEntryModal = ({ isOpen, onClose, entry, onSaved }) => {
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [isBillable, setIsBillable] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (entry) {
            setDuration(entry.duration_minutes || '');
            setDescription(entry.description || '');
            setIsBillable(entry.is_billable ?? true);
            setError('');
        }
    }, [entry, isOpen]);

    if (!isOpen || !entry) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const durationNum = parseInt(duration, 10);
        if (isNaN(durationNum) || durationNum <= 0) {
            setError('Please enter a valid duration in minutes (> 0).');
            return;
        }

        setSaving(true);
        try {
            const res = await api.patch(`/timetracking/entries/${entry.id}/`, {
                duration_minutes: durationNum,
                description: description.trim(),
                is_billable: isBillable,
            });
            if (onSaved) onSaved(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update time entry.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[#DFE1E6] flex items-center justify-between bg-[#FAFBFC]">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-[#0052CC]" />
                        <h3 className="font-bold text-[#172B4D] text-sm">Edit Time Entry</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-[#EBECF0] rounded text-[#5E6C84]">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">
                            Duration (Minutes) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                required
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:border-[#0052CC] outline-none"
                                placeholder="e.g. 60"
                            />
                            <span className="text-xs text-[#5E6C84] shrink-0 font-medium">
                                {duration ? `(${Math.floor(duration / 60)}h ${duration % 60}m)` : ''}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">
                            Description / Notes
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:border-[#0052CC] outline-none resize-none"
                            placeholder="What did you work on?"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <div>
                            <span className="text-xs font-bold text-[#172B4D] block">Billable Hours</span>
                            <span className="text-[11px] text-[#5E6C84]">Mark whether this entry is billable to clients</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isBillable}
                                onChange={() => setIsBillable(!isBillable)}
                            />
                            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0052CC]"></div>
                        </label>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-[#DFE1E6] text-[#42526E] rounded text-xs font-bold hover:bg-[#F4F5F7] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            <Save size={13} /> {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTimeEntryModal;
