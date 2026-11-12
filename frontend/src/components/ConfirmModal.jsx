import React, { createContext, useContext, useState, useRef } from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
    const [dialogState, setDialogState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        isDanger: false,
    });

    const resolverRef = useRef(null);

    const confirm = ({
        title = 'Are you sure?',
        message = 'Please confirm this action to proceed.',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        isDanger = false,
    }) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setDialogState({
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                isDanger,
            });
        });
    };

    const handleConfirm = () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }));
        if (resolverRef.current) resolverRef.current(true);
    };

    const handleCancel = () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }));
        if (resolverRef.current) resolverRef.current(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {dialogState.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div
                        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full p-6 space-y-4 animate-scale-in"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={`p-3 rounded-xl shrink-0 ${
                                    dialogState.isDanger
                                        ? 'bg-rose-50 text-rose-600'
                                        : 'bg-indigo-50 text-indigo-600'
                                }`}
                            >
                                {dialogState.isDanger ? (
                                    <Trash2 className="w-6 h-6" />
                                ) : (
                                    <AlertTriangle className="w-6 h-6" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                                    {dialogState.title}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                                    {dialogState.message}
                                </p>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
                            >
                                {dialogState.cancelText}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                autoFocus
                                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition ${
                                    dialogState.isDanger
                                        ? 'bg-rose-600 hover:bg-rose-700'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {dialogState.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        // Fallback to window.confirm if used outside provider
        return {
            confirm: async ({ message, title }) =>
                window.confirm(title ? `${title}\n\n${message}` : message),
        };
    }
    return context;
};
