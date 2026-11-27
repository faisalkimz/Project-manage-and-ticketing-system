import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, CheckCircle2, AlertCircle, Send, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const PublicPortal = () => {
    const [form, setForm] = useState({
        guest_name: '',
        guest_email: '',
        title: '',
        description: '',
        category: 'OTHER',
        priority: 'MEDIUM',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submittedTicket, setSubmittedTicket] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const res = await api.post('/tickets/tickets/public-submit/', form);
            setSubmittedTicket(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit ticket. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-4 font-sans text-[#172B4D]">
            <div className="w-full max-w-xl bg-white border border-[#DFE1E6] rounded-lg shadow-sm overflow-hidden">
                <div className="bg-[#172B4D] text-white px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-[#0079BF] flex items-center justify-center font-bold text-lg">M</div>
                        <div>
                            <h1 className="text-lg font-bold">Omni-PMS Support Portal</h1>
                            <p className="text-xs text-slate-300">Submit a support request without signing in</p>
                        </div>
                    </div>
                    <Link to="/login" className="text-xs text-slate-200 hover:text-white flex items-center gap-1">
                        <ArrowLeft size={14} /> Sign In
                    </Link>
                </div>

                {submittedTicket ? (
                    <div className="p-8 text-center space-y-4">
                        <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
                        <h2 className="text-xl font-bold">Request Submitted!</h2>
                        <p className="text-sm text-[#5E6C84]">
                            Your ticket <span className="font-bold text-[#0079BF]">{submittedTicket.ticket_number}</span> has been created and routed to our support team.
                        </p>
                        <button
                            onClick={() => {
                                setSubmittedTicket(null);
                                setForm({ guest_name: '', guest_email: '', title: '', description: '', category: 'OTHER', priority: 'MEDIUM' });
                            }}
                            className="px-4 py-2 bg-[#0079BF] text-white rounded text-sm font-semibold hover:bg-[#026AA7]"
                        >
                            Submit Another Request
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                                <AlertCircle size={15} /> {error}
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Your Name</label>
                                <input
                                    type="text"
                                    required
                                    value={form.guest_name}
                                    onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:border-[#0079BF] outline-none"
                                    placeholder="Jane Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={form.guest_email}
                                    onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:border-[#0079BF] outline-none"
                                    placeholder="jane@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Subject</label>
                            <input
                                type="text"
                                required
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:border-[#0079BF] outline-none"
                                placeholder="Brief summary of the issue"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Category</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm bg-white"
                                >
                                    <option value="BUG">Bug</option>
                                    <option value="FEATURE">Feature Request</option>
                                    <option value="IT_SUPPORT">IT Support</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Priority</label>
                                <select
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm bg-white"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                            <textarea
                                rows={4}
                                required
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:border-[#0079BF] outline-none"
                                placeholder="Describe your issue or request in detail..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 bg-[#0079BF] hover:bg-[#026AA7] text-white font-bold rounded text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Send size={15} />
                            {submitting ? 'Submitting...' : 'Submit Ticket'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PublicPortal;
