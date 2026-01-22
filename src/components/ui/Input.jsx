import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', type, name, ...props }, ref) => {
    // Determine the best inputMode for mobile keyboards
    const getInputMode = () => {
        if (type === 'tel' || name?.includes('phone')) return 'tel';
        if (type === 'email' || name?.includes('email')) return 'email';
        if (type === 'number') return 'numeric';
        if (type === 'url') return 'url';
        return 'text';
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                type={type}
                name={name}
                inputMode={getInputMode()}
                lang={type === 'date' ? 'en-GB' : undefined}
                className={`flex h-11 md:h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 md:focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive focus-visible:ring-destructive' : ''
                    } ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-xs text-destructive">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
