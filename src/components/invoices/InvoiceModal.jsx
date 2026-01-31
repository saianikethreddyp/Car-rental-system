import React, { useRef } from 'react';
import { X, Download, Printer } from 'lucide-react';
import Button from '../ui/Button';
import InvoiceTemplate from './InvoiceTemplate';
import { useSettings } from '../../context/SettingsContext';

const InvoiceModal = ({ isOpen, onClose, rental }) => {
    const invoiceRef = useRef(null);

    const { settings } = useSettings();
    const prefix = settings?.invoice?.prefix || 'INV-';

    if (!isOpen || !rental) return null;

    // Generate invoice number from rental id and date
    const invoiceNumber = `${prefix}${String(rental.id).slice(0, 8).toUpperCase()}`;

    const handlePrint = () => {
        const printContent = document.getElementById('invoice-content');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoiceNumber}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                    body { font-family: 'Inter', system-ui, sans-serif; }
                </style>
            </head>
            <body>
                ${printContent.outerHTML}
                <script>
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 500);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownload = () => {
        const printContent = document.getElementById('invoice-content');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoiceNumber} - Dhanya CRM</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                    body { font-family: 'Inter', system-ui, sans-serif; }
                </style>
            </head>
            <body class="p-4">
                ${printContent.outerHTML}
                <script>
                    setTimeout(() => {
                        window.print();
                    }, 500);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content - slides up on mobile, scales in on desktop */}
            <div className="relative w-full md:max-w-3xl bg-white rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh] animate-slide-up md:animate-scale-in">
                {/* Mobile Drag Handle */}
                <div className="md:hidden flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {/* Header - responsive layout */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 bg-gray-50 md:rounded-t-xl gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Invoice Preview</h3>
                        <p className="text-sm text-gray-500">{invoiceNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="gap-2 flex-1 sm:flex-none touch-manipulation"
                        >
                            <Printer size={16} />
                            <span className="hidden sm:inline">Print</span>
                            <span className="sm:hidden">Print</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleDownload}
                            className="gap-2 flex-1 sm:flex-none touch-manipulation"
                        >
                            <Download size={16} />
                            <span className="hidden sm:inline">Download PDF</span>
                            <span className="sm:hidden">PDF</span>
                        </Button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-md hover:bg-gray-200 touch-manipulation"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Invoice Content - scrollable */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto overscroll-contain bg-gray-100" ref={invoiceRef}>
                    <div className="shadow-lg rounded-lg overflow-hidden">
                        <InvoiceTemplate rental={rental} invoiceNumber={invoiceNumber} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
