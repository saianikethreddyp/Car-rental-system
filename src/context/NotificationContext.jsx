import React, { createContext, useContext, useEffect, useState } from 'react';

import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addNotification = (title, message, type = 'info') => {
        const newNotification = {
            id: Date.now(),
            title,
            message,
            type,
            read: false,
            timestamp: new Date()
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Trigger Toast
        if (type === 'success') toast.success(`${title}: ${message}`);
        else if (type === 'error') toast.error(`${title}: ${message}`);
        else toast(`${title}: ${message}`, { icon: '🔔' });
    };

    useEffect(() => {
        // Only subscribe when user is authenticated
        if (!user) {
            return;
        }

        // Socket.IO impl pending
    }, [user]);

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
