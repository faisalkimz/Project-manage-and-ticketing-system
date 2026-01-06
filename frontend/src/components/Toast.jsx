import { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border min-w-[300px] animate-in slide-in-from-right-full duration-300 ${toast.type === 'success' ? 'bg-[#E3FCEF] border-[#4C9AFF] text-[#006644]' :
                                toast.type === 'error' ? 'bg-[#FFEBE6] border-[#FF5630] text-[#BF2600]' :
                                    'bg-white border-[#DFE1E6] text-[#172B4D]'
                            }`}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} className="text-[#36B37E]" />}
                        {toast.type === 'error' && <AlertCircle size={20} className="text-[#FF5630]" />}
                        {toast.type === 'info' && <Info size={20} className="text-[#0052CC]" />}

                        <p className="text-sm font-semibold flex-1">{toast.message}</p>

                        <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                            <X size={16} className="opacity-50" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
