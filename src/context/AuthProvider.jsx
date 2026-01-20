import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const data = await api.get('/auth/me');
            setUser(data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUser();
    }, []);

    const login = async (email, password) => {
        try {
            const data = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            setUser(data);
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const signup = async (name, email, password) => {
        try {
            const data = await api.post('/auth/signup', { name, email, password });
            localStorage.setItem('token', data.token);
            setUser(data);
            return { success: true };
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Signup failed'
            };
        }
    };

    const signOut = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        login,
        signup,
        signOut,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
