import React from 'react';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
