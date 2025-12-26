import axios from 'axios';
import { supabase } from '../supabaseClient';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://backend-car-rental-production-a9db.up.railway.app/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
    async (config) => {
        try {
            // Get the current session from Supabase
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.access_token) {
                config.headers.Authorization = `Bearer ${session.access_token}`;
            }
        } catch (error) {
            console.error('Error getting auth token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // Handle 401 Unauthorized - redirect to login
        if (error.response?.status === 401) {
            console.error('Unauthorized - redirecting to login');
            // Clear any stale auth state
            supabase.auth.signOut();
            window.location.href = '/login';
            return Promise.reject(new Error('Session expired. Please login again.'));
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            console.error('Forbidden:', error.response?.data?.message);
            return Promise.reject(new Error(error.response?.data?.message || 'Access denied'));
        }

        // Handle validation errors (400)
        if (error.response?.status === 400 && error.response?.data?.details) {
            const validationErrors = error.response.data.details
                .map(e => e.message)
                .join(', ');
            return Promise.reject(new Error(validationErrors));
        }

        // Handle rate limiting (429)
        if (error.response?.status === 429) {
            console.error('Rate limited:', error.response?.data?.message);
            return Promise.reject(new Error('Too many requests. Please slow down.'));
        }

        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const dashboardApi = {
    getStats: (date) => api.get(`/dashboard/stats?date=${date}`),
    getActivity: () => api.get('/dashboard/activity'),
    getFleet: (date) => api.get(`/dashboard/fleet?date=${date}`),
    getReturns: (date) => api.get(`/dashboard/returns?date=${date}`),
    getAlerts: () => api.get('/dashboard/alerts'),
    getSchedule: (date) => api.get(`/dashboard/schedule?date=${date}`),
};

export const rentalsApi = {
    getAll: (filters) => api.get('/rentals', { params: filters }),
    getById: (id) => api.get(`/rentals/${id}`),
    create: (data) => api.post('/rentals', data),
    update: (id, data) => api.put(`/rentals/${id}`, data),
    delete: (id) => api.delete(`/rentals/${id}`),
};

export const carsApi = {
    getAll: (status) => api.get('/cars', { params: { status } }),
    getById: (id) => api.get(`/cars/${id}`),
    create: (data) => api.post('/cars', data),
    update: (id, data) => api.put(`/cars/${id}`, data),
    delete: (id) => api.delete(`/cars/${id}`),
    checkDeletedByPlate: (licensePlate) => api.get(`/cars/check-deleted/${encodeURIComponent(licensePlate)}`),
    restore: (id) => api.post(`/cars/${id}/restore`),
};

export default api;
