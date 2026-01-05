import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,

    login: async (username, password) => {
        set({ loading: true });
        try {
            const response = await api.post('/users/login/', { username, password });
            localStorage.setItem('token', response.data.access);
            localStorage.setItem('refresh', response.data.refresh);

            const profile = await api.get('/users/profile/');
            set({ user: profile.data, isAuthenticated: true, loading: false });
            return true;
        } catch (error) {
            set({ loading: false });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const profile = await api.get('/users/profile/');
                set({ user: profile.data, isAuthenticated: true });
            } catch (error) {
                localStorage.removeItem('token');
                set({ user: null, isAuthenticated: false });
            }
        }
    }
}));

export default useAuthStore;
