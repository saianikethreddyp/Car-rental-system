import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, CalendarDays, Users, LogOut, Settings, Shield, CreditCard } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Button from './ui/Button';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/cars', label: 'Fleet', icon: Car },
        { path: '/rentals', label: 'Rentals', icon: CalendarDays },
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/insurance', label: 'Insurance', icon: Shield },
        { path: '/payments', label: 'Payments', icon: CreditCard },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-background border-r border-border flex flex-col h-screen fixed left-0 top-0 z-20">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-xs">D</span>
                    </div>
                    <h1 className="text-sm font-semibold text-foreground tracking-tight">
                        Dhanya CRM
                    </h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1">
                <div className="px-3 mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Main</p>
                </div>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors duration-200 group text-sm ${isActive
                                ? 'bg-secondary text-foreground font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                            }`
                        }
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer / Actions */}
            <div className="p-4 border-t border-border mt-auto">
                <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-foreground">Need Help?</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Check our docs</p>
                    <Button variant="outline" size="sm" className="w-full h-8 text-xs bg-background">
                        Documentation
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9"
                    onClick={handleLogout}
                >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar;
