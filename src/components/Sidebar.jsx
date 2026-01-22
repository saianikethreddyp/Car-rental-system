import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, CalendarDays, Users, LogOut, Settings, Shield, CreditCard, X } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import Button from './ui/Button';

const Sidebar = ({ isMobileMenuOpen, closeMobileMenu }) => {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
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
        <>
            {/* Mobile Backdrop Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 bg-background border-r border-border flex flex-col h-screen fixed left-0 top-0 z-50
                transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:z-20
            `}>
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xs">D</span>
                        </div>
                        <h1 className="text-sm font-semibold text-foreground tracking-tight">
                            Dhanya CRM
                        </h1>
                    </div>

                    {/* Close button - Mobile only */}
                    <button
                        onClick={closeMobileMenu}
                        className="lg:hidden p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                    <div className="px-3 mb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Main</p>
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={closeMobileMenu}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors duration-200 group text-sm ${isActive
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
                        <NavLink to="/help" onClick={closeMobileMenu}>
                            <Button variant="outline" size="sm" className="w-full h-8 text-xs bg-background">
                                Documentation
                            </Button>
                        </NavLink>
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
        </>
    );
};

export default Sidebar;
