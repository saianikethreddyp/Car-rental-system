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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Invoice Preview</h3>
                        <p className="text-sm text-gray-500">{invoiceNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="gap-2"
                        >
                            <Printer size={16} />
                            Print
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleDownload}
                            className="gap-2"
                        >
                            <Download size={16} />
                            Download PDF
                        </Button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-md hover:bg-gray-200 ml-2"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Invoice Content */}
                <div className="p-6 overflow-y-auto bg-gray-100" ref={invoiceRef}>
                    <div className="shadow-lg rounded-lg overflow-hidden">
                        <InvoiceTemplate rental={rental} invoiceNumber={invoiceNumber} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
