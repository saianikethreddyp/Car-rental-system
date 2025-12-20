import React, { createContext, useContext, useEffect, useState } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    // Initialize state from local storage or defaults
    const defaultSettings = {
        currency: 'INR',
        taxRate: 18,
        theme: 'dark',
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

    useEffect(() => {
        localStorage.setItem('crm_system_settings', JSON.stringify(settings));

        // Apply theme (basic implementation)
        if (settings.theme === 'light') {
            document.documentElement.classList.add('light-mode');
        } else {
            document.documentElement.classList.remove('light-mode');
        }
    }, [settings]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const formatCurrency = (amount) => {
        const value = Number(amount) || 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: settings.currency,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, formatCurrency }}>
            {children}
        </SettingsContext.Provider>
    );
};
