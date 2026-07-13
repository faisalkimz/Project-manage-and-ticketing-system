import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    twoFactorTempToken: null,
    twoFactorUser: null,

    login: async (username, password) => {
        set({ loading: true });
        try {
            const response = await api.post('/users/login/', { username, password });
            if (response.data['2fa_required']) {
                set({
                    twoFactorTempToken: response.data.temp_token,
                    twoFactorUser: username,
                    loading: false,
                });
                return { twoFactorRequired: true };
            }
            localStorage.setItem('token', response.data.access);
            localStorage.setItem('refresh', response.data.refresh);
            const profile = await api.get('/users/profile/');
            set({ user: profile.data, isAuthenticated: true, loading: false, twoFactorTempToken: null, twoFactorUser: null });
            return { success: true };
        } catch (error) {
            set({ loading: false });
            return { error: true };
        }
    },

    verifyTwoFactor: async (code) => {
        const { twoFactorTempToken, twoFactorUser } = get();
        if (!twoFactorTempToken) return { error: true };
        set({ loading: true });
        try {
            const response = await api.post('/users/2fa/login/', {
                temp_token: twoFactorTempToken,
                code,
            });
            localStorage.setItem('token', response.data.access);
            localStorage.setItem('refresh', response.data.refresh);
            const profile = await api.get('/users/profile/');
            set({ user: profile.data, isAuthenticated: true, loading: false, twoFactorTempToken: null, twoFactorUser: null });
            return { success: true };
        } catch (error) {
            set({ loading: false });
            return { error: true, message: error.response?.data?.code || 'Invalid code.' };
        }
    },

    cancelTwoFactor: () => {
        set({ twoFactorTempToken: null, twoFactorUser: null });
    },

    register: async (userData) => {
        set({ loading: true });
        try {
            const res = await api.post('/users/register/', userData);
            set({ loading: false });
            return { success: true, email_verified: res.data.email_verified, verify_email_sent: res.data.verify_email_sent };
        } catch (error) {
            set({ loading: false });
            const data = error?.response?.data || error?.response || error;
            const msgs = [];
            if (typeof data === 'string') {
                msgs.push(data);
            } else if (data && typeof data === 'object') {
                for (const [k, v] of Object.entries(data)) {
                    if (Array.isArray(v)) msgs.push(`${k}: ${v.join(', ')}`);
                    else if (typeof v === 'string') msgs.push(`${k}: ${v}`);
                    else msgs.push(`${k}: ${JSON.stringify(v)}`);
                }
            }
            if (!msgs.length && error?.message) msgs.push(error.message);
            return { error: true, message: msgs.length ? msgs.join('; ') : 'Registration failed.' };
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        set({ user: null, isAuthenticated: false, twoFactorTempToken: null, twoFactorUser: null });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (token) {
            set({ loading: true });
            try {
                const profile = await api.get('/users/profile/');
                set({ user: profile.data, isAuthenticated: true, loading: false });
            } catch (error) {
                const refreshToken = localStorage.getItem('refresh');
                if (refreshToken) {
                    try {
                        const refreshRes = await api.post('/users/token/refresh/', { refresh: refreshToken });
                        localStorage.setItem('token', refreshRes.data.access);
                        const profile = await api.get('/users/profile/');
                        set({ user: profile.data, isAuthenticated: true, loading: false });
                        return;
                    } catch (refreshError) {
                    }
                }
                localStorage.removeItem('token');
                localStorage.removeItem('refresh');
                set({ user: null, isAuthenticated: false, loading: false });
            }
        }
    },

    updateProfile: async (data) => {
        try {
            const response = await api.patch('/users/profile/', data);
            set({ user: response.data });
            return true;
        } catch (error) {
            return false;
        }
    },

    sendVerificationEmail: async () => {
        try {
            await api.post('/users/send-verification/');
            return true;
        } catch (error) {
            return false;
        }
    },
}));

export default useAuthStore;
