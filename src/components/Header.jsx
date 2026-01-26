import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthProvider';

const Header = ({ toggleMobileMenu }) => {
    const location = useLocation();
    const { user } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
    const [showDropdown, setShowDropdown] = useState(false);

    // Helper to format page title
    const getPageTitle = (pathname) => {
        if (pathname === '/') return 'Dashboard';
        return pathname.replace('/', '').charAt(0).toUpperCase() + pathname.slice(2);
    };

    return (
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
            {/* Left Section: Hamburger + Title */}
            <div className="flex items-center gap-3">
                {/* Hamburger Menu - Mobile Only */}
                <button
                    onClick={toggleMobileMenu}
                    className="lg:hidden p-2 -ml-2 rounded-md text-foreground hover:bg-secondary transition-colors"
                    aria-label="Toggle menu"
                >
                    <Menu size={24} />
                </button>

                {/* Page Title */}
                <h2 className="text-lg font-semibold text-foreground">
                    {getPageTitle(location.pathname)}
                </h2>
            </div>

            {/* Actions Area */}
            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-80 bg-popover rounded-md shadow-md border border-border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-3 border-b border-border flex justify-between items-center bg-muted/50">
                                <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`p-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-muted/30' : ''}`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1.5 w-2 h-2 rounded-full ${!notification.read ? 'bg-primary' : 'bg-transparent'}`}></div>
                                                <div>
                                                    <h4 className={`text-sm ${!notification.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground mt-1.5 block">
                                                        {notification.timestamp.toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-2 border-t border-border bg-muted/50 text-center">
                                    <button
                                        onClick={clearNotifications}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-1.5"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-border">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-foreground leading-none">{user?.user_metadata?.full_name || 'Admin User'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{user?.email || 'admin@dhanya.com'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow ring-offset-background hover:opacity-90 transition-opacity cursor-pointer">
                        {user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : 'A'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
