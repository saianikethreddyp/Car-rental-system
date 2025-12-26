import { useState } from 'react';
import { MessageCircle, X, Phone } from 'lucide-react';

/**
 * Floating WhatsApp Support Button
 * Shows a WhatsApp icon that expands to show support contact options
 */
export default function SupportButton() {
    const [isOpen, setIsOpen] = useState(false);

    const contacts = [
        {
            name: 'Primary Support',
            number: '918328417230',
            displayNumber: '+91 832 841 7230'
        },
        {
            name: 'Secondary Support',
            number: '919398840252',
            displayNumber: '+91 939 884 0252'
        }
    ];

    const openWhatsApp = (number) => {
        const message = encodeURIComponent('Hi, I need help with the Dhanya Car Rentals system.');
        window.open(`https://wa.me/${number}?text=${message}`, '_blank');
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Contact Options Panel */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 mb-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
                    <div className="bg-green-500 text-white px-4 py-3">
                        <h3 className="font-semibold">Need Help?</h3>
                        <p className="text-sm text-green-100">Contact our support team</p>
                    </div>
                    <div className="p-2">
                        {contacts.map((contact, index) => (
                            <button
                                key={index}
                                onClick={() => openWhatsApp(contact.number)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                            >
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{contact.name}</p>
                                    <p className="text-sm text-gray-500">{contact.displayNumber}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="px-4 py-2 bg-gray-50 border-t">
                        <p className="text-xs text-gray-500 text-center">
                            Click to open WhatsApp
                        </p>
                    </div>
                </div>
            )}

            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 ${isOpen
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                aria-label={isOpen ? 'Close support menu' : 'Open support menu'}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Pulse animation when closed */}
            {!isOpen && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
        </div>
    );
}
