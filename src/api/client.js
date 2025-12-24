import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://backend-car-rental-production-a9db.up.railway.app/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
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
};

export default api;
