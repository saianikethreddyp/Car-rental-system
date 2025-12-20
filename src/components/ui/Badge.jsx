import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25",
        warning: "border-transparent bg-amber-500/15 text-amber-700 hover:bg-amber-500/25",
        info: "border-transparent bg-blue-500/15 text-blue-700 hover:bg-blue-500/25",
    };

    // Mapping old variants to new ones if needed, or keeping them as custom
    // For now, I'm keeping 'success', 'warning', 'info' as they are likely used for statuses.
    // 'default' maps to primary-like pill.

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
