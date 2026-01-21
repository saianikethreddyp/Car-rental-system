
import React, { useState, useEffect } from 'react';
import {
    User, Bell, Lock, Save, Mail, Shield,
    DollarSign, CheckCircle, Building, FileText,
    Download, Database, Car, Users, Calendar,
    CreditCard, Clock, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthProvider';
import { useSettings } from '../context/SettingsContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { rentalsApi, customersApi, carsApi } from '../api/client';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const Settings = () => {
    const { user } = useAuth();
    const settingsContext = useSettings();
    const settings = settingsContext?.settings || {};
    const updateSettings = settingsContext?.updateSettings || (() => { });
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [exportLoading, setExportLoading] = useState(null);

    // Profile State
    const [profile, setProfile] = useState({
        name: '',
        email: ''
    });

    // Password State
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    // Business Profile State
    const [businessProfile, setBusinessProfile] = useState({
        companyName: settings.business?.companyName || 'Dhanya CRM',
        address: settings.business?.address || '',
        phone: settings.business?.phone || '',
        email: settings.business?.email || ''
    });

    // Rental Defaults State
    const [rentalDefaults, setRentalDefaults] = useState({
        defaultDailyRate: settings.rentalDefaults?.defaultDailyRate || 2000,
        securityDeposit: settings.rentalDefaults?.securityDeposit || 5000,
        lateFeePercent: settings.rentalDefaults?.lateFeePercent || 10,
        minRentalDays: settings.rentalDefaults?.minRentalDays || 1
    });

    // Invoice Settings State
    const [invoiceSettings, setInvoiceSettings] = useState({
        invoicePrefix: settings.invoice?.prefix || 'INV-',
        paymentTerms: settings.invoice?.paymentTerms || 'Due on delivery',
        footerNotes: settings.invoice?.footerNotes || 'Thank you for your business!',
        showTaxBreakdown: settings.invoice?.showTaxBreakdown ?? true
    });

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.user_metadata?.full_name || '',
                email: user.email || ''
            });
        }
    }, [user]);

    // Tabs configuration
    const tabs = [
        { id: 'general', label: 'General', icon: User },
        { id: 'business', label: 'Business', icon: Building },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'data', label: 'Data', icon: Database }
    ];

    // Handle Profile Update
    const handleSaveProfile = async () => {
        try {
            setLoading(true);
            // Backend profile update API
            await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
            toast.success('Profile updated successfully! (Mock)');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Password Update
    const handleUpdatePassword = async () => {
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (passwords.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setPasswordLoading(true);
            // Backend password update API
            await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
            toast.success('Password updated successfully! (Mock)');
            setPasswords({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    // Save Business Profile
    const handleSaveBusinessProfile = () => {
        updateSettings({ business: businessProfile });
        toast.success('Business profile saved!');
    };

    // Save Rental Defaults
    const handleSaveRentalDefaults = () => {
        updateSettings({ rentalDefaults });
        toast.success('Rental defaults saved!');
    };

    // Save Invoice Settings
    const handleSaveInvoiceSettings = () => {
        updateSettings({ invoice: invoiceSettings });
        toast.success('Invoice settings saved!');
    };

    // Export Data Functions
    const exportToCSV = async (type) => {
        setExportLoading(type);
        try {
            let data = [];
            let filename = '';
            let headers = [];

            if (type === 'rentals') {
                const rentalsData = await rentalsApi.getAll();
                const rentals = rentalsData.rentals || rentalsData;

                data = rentals?.map(r => ({
                    'Customer Name': r.customer_name,
                    'Phone': r.customer_phone,
                    'Car': r.cars ? `${r.cars?.make} ${r.cars?.model}` : 'N/A',
                    'License Plate': r.cars?.license_plate || 'N/A',
                    'Start Date': r.start_date,
                    'End Date': r.end_date,
                    'Total Amount': r.total_amount,
                    'Status': r.status,
                    'Created At': r.created_at
                })) || [];
                filename = 'rentals_export.csv';
            } else if (type === 'customers') {
                const customers = await customersApi.getAll();

                data = customers?.map(c => ({
                    'Name': c.name,
                    'Phone': c.phone,
                    'Created At': c.created_at
                })) || [];
                filename = 'customers_export.csv';
            } else if (type === 'cars') {
                const cars = await carsApi.getAll();

                data = cars?.map(c => ({
                    'Make': c.make,
                    'Model': c.model,
                    'License Plate': c.license_plate,
                    'Daily Rate': c.daily_rate,
                    'Status': c.status,
                    'Insurance Expiry': c.insurance_expiry_date || 'Not Set'
                })) || [];
                filename = 'cars_export.csv';
            }

            if (data.length === 0) {
                toast.error('No data to export');
                return;
            }

            // Convert to CSV
            headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
            ].join('\n');

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            toast.success(`${type} exported successfully!`);
        } catch (error) {
            toast.error('Export failed');
            console.error(error);
        } finally {
            setExportLoading(null);
        }
    };

    const currencyOptions = [
        { value: 'INR', label: 'INR', symbol: '₹' },
        { value: 'USD', label: 'USD', symbol: '$' },
        { value: 'EUR', label: 'EUR', symbol: '€' }
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account and business preferences</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* GENERAL TAB */}
            {activeTab === 'general' && (
                <div className="space-y-8">
                    {/* Profile Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <User className="text-primary" size={20} />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Profile</h2>
                        </div>

                        <Card className="p-6">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <Badge variant="secondary">
                                        <Shield size={12} className="mr-1" /> Administrator
                                    </Badge>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Full Name"
                                            value={profile.name}
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            placeholder="Enter your name"
                                        />
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button onClick={handleSaveProfile} isLoading={loading}>
                                            <Save size={16} className="mr-2" /> Save Profile
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </section>
                </div>
            )}

            {/* BUSINESS TAB */}
            {activeTab === 'business' && (
                <div className="space-y-8">
                    {/* Business Profile */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Building className="text-blue-500" size={20} />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Business Profile</h2>
                        </div>

                        <Card className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Company Name"
                                    value={businessProfile.companyName}
                                    onChange={(e) => setBusinessProfile({ ...businessProfile, companyName: e.target.value })}
                                    placeholder="Your Company Name"
                                />
                                <Input
                                    label="Business Phone"
                                    value={businessProfile.phone}
                                    onChange={(e) => setBusinessProfile({ ...businessProfile, phone: e.target.value })}
                                    placeholder="+91 9876543210"
                                />
                                <Input
                                    label="Business Email"
                                    type="email"
                                    value={businessProfile.email}
                                    onChange={(e) => setBusinessProfile({ ...businessProfile, email: e.target.value })}
                                    placeholder="contact@company.com"
                                />
                                <Input
                                    label="Business Address"
                                    value={businessProfile.address}
                                    onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                                    placeholder="123 Main Street, City"
                                />
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button onClick={handleSaveBusinessProfile}>
                                    <Save size={16} className="mr-2" /> Save Business Profile
                                </Button>
                            </div>
                        </Card>
                    </section>

                    {/* Invoice Settings */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                                <FileText className="text-orange-500" size={20} />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Invoice Settings</h2>
                        </div>

                        <Card className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Invoice Prefix"
                                    value={invoiceSettings.invoicePrefix}
                                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoicePrefix: e.target.value })}
                                    placeholder="INV-"
                                />
                                <Input
                                    label="Payment Terms"
                                    value={invoiceSettings.paymentTerms}
                                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, paymentTerms: e.target.value })}
                                    placeholder="Due on delivery"
                                />
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium">Footer Notes</label>
                                    <textarea
                                        value={invoiceSettings.footerNotes}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerNotes: e.target.value })}
                                        className="w-full h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                                        placeholder="Thank you for your business!"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={invoiceSettings.showTaxBreakdown}
                                            onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showTaxBreakdown: e.target.checked })}
                                            className="w-4 h-4 rounded border-border"
                                        />
                                        <span className="text-sm font-medium">Show tax breakdown on invoices</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button onClick={handleSaveInvoiceSettings}>
                                    <Save size={16} className="mr-2" /> Save Invoice Settings
                                </Button>
                            </div>
                        </Card>
                    </section>
                </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {
                activeTab === 'notifications' && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Bell className="text-amber-500" size={20} />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
                        </div>

                        <Card className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <NotificationToggle
                                    icon={Mail}
                                    title="Email Notifications"
                                    description="Receive daily summaries via email"
                                    checked={settings.notifications?.email}
                                    onChange={() => updateSettings({
                                        notifications: { ...settings.notifications, email: !settings.notifications?.email }
                                    })}
                                />
                                <NotificationToggle
                                    icon={Bell}
                                    title="Push Notifications"
                                    description="Get real-time browser alerts"
                                    checked={settings.notifications?.push}
                                    onChange={() => updateSettings({
                                        notifications: { ...settings.notifications, push: !settings.notifications?.push }
                                    })}
                                />
                                <NotificationToggle
                                    icon={Calendar}
                                    title="Rental Updates"
                                    description="Booking created or completed"
                                    checked={settings.notifications?.rentals}
                                    onChange={() => updateSettings({
                                        notifications: { ...settings.notifications, rentals: !settings.notifications?.rentals }
                                    })}
                                />
                                <NotificationToggle
                                    icon={Car}
                                    title="Fleet Status"
                                    description="Car maintenance & insurance alerts"
                                    checked={settings.notifications?.cars}
                                    onChange={() => updateSettings({
                                        notifications: { ...settings.notifications, cars: !settings.notifications?.cars }
                                    })}
                                />
                            </div>
                        </Card>
                    </section>
                )
            }

            {/* SECURITY TAB */}
            {
                activeTab === 'security' && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <Lock className="text-red-500" size={20} />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Security</h2>
                        </div>

                        <Card className="p-6">
                            <div className="max-w-lg space-y-4">
                                <p className="text-muted-foreground text-sm">Update your password to keep your account secure.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="New Password"
                                        type="password"
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                    <Input
                                        label="Confirm Password"
                                        type="password"
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleUpdatePassword}
                                    isLoading={passwordLoading}
                                    className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                                >
                                    <Lock size={16} className="mr-2" /> Update Password
                                </Button>
                            </div>
                        </Card>
                    </section>
                )
            }

            {/* DATA TAB */}
            {
                activeTab === 'data' && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <Database className="text-purple-500" size={20} />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Data Management</h2>
                        </div>

                        <Card className="p-6">
                            <p className="text-muted-foreground text-sm mb-6">Export your data as CSV files for backup or analysis.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => exportToCSV('rentals')}
                                    disabled={exportLoading === 'rentals'}
                                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                                >
                                    <div className="p-3 rounded-lg bg-emerald-500/10">
                                        <Calendar size={20} className="text-emerald-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">Export Rentals</p>
                                        <p className="text-xs text-muted-foreground">All booking records</p>
                                    </div>
                                    <Download size={18} className="text-muted-foreground" />
                                </button>
                                <button
                                    onClick={() => exportToCSV('customers')}
                                    disabled={exportLoading === 'customers'}
                                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                                >
                                    <div className="p-3 rounded-lg bg-blue-500/10">
                                        <Users size={20} className="text-blue-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">Export Customers</p>
                                        <p className="text-xs text-muted-foreground">Customer database</p>
                                    </div>
                                    <Download size={18} className="text-muted-foreground" />
                                </button>
                                <button
                                    onClick={() => exportToCSV('cars')}
                                    disabled={exportLoading === 'cars'}
                                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                                >
                                    <div className="p-3 rounded-lg bg-orange-500/10">
                                        <Car size={20} className="text-orange-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">Export Fleet</p>
                                        <p className="text-xs text-muted-foreground">Vehicle inventory</p>
                                    </div>
                                    <Download size={18} className="text-muted-foreground" />
                                </button>
                            </div>
                        </Card>
                    </section>
                )
            }
        </div >
    );
};

// Notification Toggle Component
const NotificationToggle = ({ icon, title, description, checked, onChange }) => {
    const Icon = icon;
    return (
        <button
            onClick={onChange}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${checked ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                }`}
        >
            <div className={`p-2.5 rounded-lg ${checked ? 'bg-primary/20' : 'bg-muted'}`}>
                <Icon size={20} className={checked ? 'text-primary' : 'text-muted-foreground'} />
            </div>
            <div className="flex-1">
                <p className="font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
        </button>
    );
};

export default Settings;
