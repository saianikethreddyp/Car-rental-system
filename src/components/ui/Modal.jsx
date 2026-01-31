import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'md:max-w-sm',
        md: 'md:max-w-md',
        lg: 'md:max-w-xl',
        xl: 'md:max-w-2xl',
        full: 'md:max-w-full md:m-4'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div
                ref={modalRef}
                className={`
                    relative w-full ${sizes[size]} 
                    bg-card rounded-t-2xl md:rounded-lg 
                    shadow-lg border-t border-l border-r md:border border-border 
                    flex flex-col 
                    max-h-[95vh] md:max-h-[90vh] 
                    animate-slide-up md:animate-scale-in
                `}
                role="dialog"
                aria-modal="true"
            >
                {/* Mobile Drag Handle - Visual indicator that modal can be swiped */}
                <div className="md:hidden flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 bg-muted-foreground/30 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 md:p-6 border-b border-border shrink-0">
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground active:bg-secondary transition-colors p-2 rounded-md hover:bg-secondary touch-manipulation"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - simple scrollable container */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
