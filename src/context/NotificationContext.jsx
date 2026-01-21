import React, { createContext, useContext, useEffect, useState } from 'react';
// import { supabase } from '../supabaseClient'; // Removed Supabase
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

        console.info('[Notifications] Realtime subscriptions disabled (Supabase removed)');

        // TODO: Implement Socket.IO or Polling for Realtime Updates
        /*
        // Subscribe to Rentals with unique channel name per user session
        const rentalSubscription = supabase
            .channel(`rentals-${user.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rentals' }, payload => {
                addNotification(
                    'New Booking',
                    `New rental created for ${payload.new.customer_name}`,
                    'success'
                );
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rentals' }, payload => {
                if (payload.old.status !== payload.new.status) {
                    addNotification(
                        'Rental Update',
                        `Rental status updated to ${payload.new.status}`,
                        'info'
                    );
                }
            })
            .subscribe();

        // Subscribe to Cars with unique channel name per user session
        const carSubscription = supabase
            .channel(`cars-${user.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cars' }, payload => {
                if (payload.old.status !== payload.new.status) {
                    addNotification(
                        'Vehicle Status',
                        `Car ${payload.new.make} ${payload.new.model} is now ${payload.new.status}`,
                        'info'
                    );
                }
            })
            .subscribe();

        return () => {
            console.info('[Notifications] Cleaning up realtime subscriptions');
            supabase.removeChannel(rentalSubscription);
            supabase.removeChannel(carSubscription);
        };
        */
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
            markAsRead,
            markAllAsRead,
            clearNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
