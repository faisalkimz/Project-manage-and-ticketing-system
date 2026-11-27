import { useState, useEffect, useRef } from 'react';
import { Send, Users, Hash, MessageSquare } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Messages = () => {
    const { user } = useAuthStore();
    const [mode, setMode] = useState('workspace'); // 'workspace' | 'dm'
    const [users, setUsers] = useState([]);
    const [selectedPeer, setSelectedPeer] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        api.get('/users/list/')
            .then(res => {
                const list = (Array.isArray(res.data) ? res.data : (res.data?.results || []))
                    .filter(u => u.id !== user?.id);
                setUsers(list);
            })
            .catch(() => setUsers([]));
    }, [user]);

    const fetchMessages = async () => {
        try {
            if (mode === 'workspace') {
                const res = await api.get('/collaboration/chat/', {
                    params: { content_type: 'team', object_id: 1 }
                });
                setMessages(Array.isArray(res.data) ? res.data : []);
            } else if (selectedPeer) {
                const res = await api.get('/collaboration/dms/', {
                    params: { peer_id: selectedPeer.id }
                });
                setMessages(Array.isArray(res.data) ? res.data : []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 8000);
        return () => clearInterval(interval);
    }, [mode, selectedPeer]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        try {
            if (mode === 'workspace') {
                await api.post('/collaboration/chat/', {
                    content_type: 'team',
                    object_id: 1,
                    text: text.trim(),
                });
            } else if (selectedPeer) {
                await api.post('/collaboration/dms/', {
                    recipient: selectedPeer.id,
                    text: text.trim(),
                });
            }
            setText('');
            fetchMessages();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="h-[calc(100vh-2rem)] m-4 bg-white border border-[#DFE1E6] rounded-lg flex overflow-hidden font-sans text-[#172B4D]">
            {/* Left Sidebar */}
            <div className="w-64 border-r border-[#DFE1E6] bg-[#F4F5F7] flex flex-col">
                <div className="p-4 border-b border-[#DFE1E6]">
                    <h2 className="font-bold text-sm uppercase tracking-wider text-[#5E6C84]">Channels & DMs</h2>
                </div>
                <div className="p-2 space-y-1">
                    <button
                        onClick={() => { setMode('workspace'); setSelectedPeer(null); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${mode === 'workspace' ? 'bg-[#0079BF] text-white' : 'hover:bg-[#EBECF0] text-[#172B4D]'}`}
                    >
                        <Hash size={15} /> # general-workspace
                    </button>
                </div>
                <div className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase text-[#5E6C84] flex items-center gap-1">
                    <Users size={12} /> Direct Messages
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {users.map(u => (
                        <button
                            key={u.id}
                            onClick={() => { setMode('dm'); setSelectedPeer(u); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm ${mode === 'dm' && selectedPeer?.id === u.id ? 'bg-[#0079BF] text-white font-semibold' : 'hover:bg-[#EBECF0] text-[#172B4D]'}`}
                        >
                            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">
                                {u.username?.[0]?.toUpperCase()}
                            </div>
                            <span className="truncate">{u.username}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Panel */}
            <div className="flex-1 flex flex-col">
                <div className="px-6 py-4 border-b border-[#DFE1E6] flex items-center gap-2">
                    <MessageSquare size={18} className="text-[#0079BF]" />
                    <h3 className="font-bold text-base">
                        {mode === 'workspace' ? '# general-workspace (Org Chat)' : (selectedPeer ? `Direct Message with ${selectedPeer.username}` : 'Select a teammate')}
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#FAFBFC]">
                    {messages.length === 0 ? (
                        <p className="text-center text-sm text-[#5E6C84] py-12">No messages yet. Start the conversation!</p>
                    ) : (
                        messages.map(m => {
                            const isMe = m.sender === user?.id || m.sender_details?.id === user?.id;
                            return (
                                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[11px] text-[#5E6C84] mb-0.5">
                                        {m.sender_details?.username || 'User'} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div className={`px-3.5 py-2 rounded-lg text-sm max-w-md ${isMe ? 'bg-[#0079BF] text-white' : 'bg-white border border-[#DFE1E6] text-[#172B4D]'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} className="p-4 border-t border-[#DFE1E6] bg-white flex gap-2">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={mode === 'workspace' ? 'Message #general-workspace...' : `Message ${selectedPeer?.username || ''}...`}
                        disabled={mode === 'dm' && !selectedPeer}
                        className="flex-1 px-3 py-2 border border-[#DFE1E6] rounded text-sm focus:border-[#0079BF] outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!text.trim() || (mode === 'dm' && !selectedPeer)}
                        className="px-4 py-2 bg-[#0079BF] hover:bg-[#026AA7] text-white rounded text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <Send size={14} /> Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Messages;
