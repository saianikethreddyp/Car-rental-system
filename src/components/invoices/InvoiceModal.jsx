import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Printer, CheckCircle, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import InvoiceTemplate from './InvoiceTemplate';
import { useSettings } from '../../context/SettingsContext';
import { invoicesApi } from '../../api/client';
import toast from 'react-hot-toast';

const InvoiceModal = ({ isOpen, onClose, rental }) => {
    const invoiceRef = useRef(null);
    const { settings } = useSettings();
    const prefix = settings?.invoice?.prefix || 'INV-';

    const [backendInvoice, setBackendInvoice] = useState(null);
    const [saving, setSaving] = useState(false);

    if (!isOpen || !rental) return null;

    // Fallback invoice number (used if backend hasn't generated one yet)
    const invoiceNumber = backendInvoice?.invoice_number || `${prefix}${String(rental._id || rental.id).slice(0, 8).toUpperCase()}`;

    // Auto-generate invoice in backend when modal opens
    useEffect(() => {
        const generateBackendInvoice = async () => {
            if (!rental?._id && !rental?.id) return;
            setSaving(true);
            try {
                const rentalId = rental._id || rental.id;
                const invoice = await invoicesApi.generate(rentalId);
                setBackendInvoice(invoice);
            } catch (error) {
                console.error('Failed to generate backend invoice:', error);
                // Still allow viewing — the frontend template works without a backend record
            } finally {
                setSaving(false);
            }
        };

        if (isOpen && rental) {
            generateBackendInvoice();
        }
    }, [isOpen, rental]);

    const handlePrint = () => {
        const printContent = document.getElementById('invoice-content');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoiceNumber}</title>
                <script src="https://cdn.tailwindcss.com"><\/script>
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
                <\/script>
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
                <title>Invoice ${invoiceNumber} - Download</title>
                <script src="https://cdn.tailwindcss.com"><\/script>
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
                <\/script>
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

            {/* Modal Content */}
            <div className="relative w-full md:max-w-3xl bg-white rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh] animate-slide-up md:animate-scale-in">
                {/* Mobile Drag Handle */}
                <div className="md:hidden flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 bg-gray-50 md:rounded-t-xl gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Invoice Preview</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            {invoiceNumber}
                            {saving && <Loader2 size={14} className="animate-spin text-gray-400" />}
                            {backendInvoice && !saving && <CheckCircle size={14} className="text-green-500" />}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="gap-2 flex-1 sm:flex-none touch-manipulation"
                        >
                            <Printer size={16} />
                            <span>Print</span>
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
