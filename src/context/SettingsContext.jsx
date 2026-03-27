import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsApi } from '../api/client';
import { useAuth } from './AuthProvider';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const { user } = useAuth(); // Ensures we re-fetch if user login status changes

    const defaultSettings = {
        currency: 'INR',
        taxRate: 18,
        theme: 'dark',
        business: {
            companyName: 'Car Rental Setup',
            address: '',
            phone: '',
            email: '',
            logo: null,
            terms: ''
        },
        invoice: {
            prefix: 'INV-',
            paymentTerms: 'Due on receipt',
            footerNotes: 'Thank you for your business!',
            signature: null
        },
        notifications: {
            email: true,
            push: true,
            rentals: true,
            cars: false
        }
    };

    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('crm_system_settings');
            return saved ? JSON.parse(saved) : defaultSettings;
        } catch (error) {
            console.error('Failed to parse settings from localStorage:', error);
            return defaultSettings;
        }
    });

    // Fetch live settings from the database on load or login
    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return; // Only fetch if logged in
            try {
                const dbSettings = await settingsApi.get();
                if (dbSettings && Object.keys(dbSettings).length > 0) {
                    const mergedSettings = { ...defaultSettings, ...dbSettings };
                    setSettings(mergedSettings);
                    localStorage.setItem('crm_system_settings', JSON.stringify(mergedSettings));
                }
            } catch (error) {
                console.error("Failed to fetch settings from backend:", error);
            }
        };

        fetchSettings();
    }, [user]);

    // Apply specific UI side effects based on settings changes
    useEffect(() => {
        localStorage.setItem('crm_system_settings', JSON.stringify(settings));

        if (settings.theme === 'light') {
            document.documentElement.classList.add('light-mode');
        } else {
            document.documentElement.classList.remove('light-mode');
        }
    }, [settings]);

    const updateSettings = async (newSettingsPartial) => {
        const updatedLocal = { ...settings, ...newSettingsPartial };
        
        // Optimistic UI update
        setSettings(updatedLocal);
        
        // Sync to backend
        if (user) {
            try {
                await settingsApi.update(newSettingsPartial);
            } catch (error) {
                console.error("Failed to save settings to backend:", error);
                // Depending on requirements, we could roll back optimistic updates here,
                // but for a beginner app simply logging the failure is safer.
            }
        }
    };

    const formatCurrency = (amount) => {
        const value = Number(amount) || 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: settings.currency || 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, formatCurrency }}>
            {children}
        </SettingsContext.Provider>
    );
};
