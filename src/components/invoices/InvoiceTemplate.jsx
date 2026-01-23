import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { formatDate } from '../../utils/date';

const InvoiceTemplate = ({ rental, invoiceNumber }) => {
    const { formatCurrency, settings } = useSettings();

    const invoiceDate = formatDate(new Date());

    const startDate = formatDate(rental.start_date);

    const endDate = formatDate(rental.end_date);

    // Calculate rental days
    const start = new Date(rental.start_date);
    const end = new Date(rental.end_date);
    const diffTime = Math.abs(end - start);
    const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Calculate amounts
    // Logic update: User requests no tax breakdown and clear listing of extra charges

    // 1. Base Rental Cost
    const dailyRate = Number(rental.car_id?.daily_rate) || 0; // Use populated car rate if stored rate not available, but ideally rental should store its own rate snapshot.
    // However, looking at previous code, it derived baseAmount from total.
    // Let's assume rental.total_amount IS the final amount.
    // But we need to reconstruct the breakdown.

    // Let's assume:
    // Rental Cost = Daily Rate * Days
    // Extra Charges = Sum(rental.charges)
    // Total = Rental Cost + Extra Charges

    // If total_amount disagrees, we should prioritize showing what makes up the total.

    // NOTE: rental object might not have daily_rate snapshot. We might need to rely on car_id.daily_rate.
    // Or if total_amount was manually entered, we might need to back-calculate, but simplest is:

    const charges = rental.charges || [];
    const chargesTotal = charges.reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);

    // We try to derive rental cost from remaining amount if total_amount is fixed
    // OR we use the car's daily rate if available.
    // Given the previous code just took total_amount, let's try to respect the total_amount source of truth.

    const finalTotal = Number(rental.total_amount) || 0;

    // If we have charges, the base rental cost is roughly (Total - Charges)
    // But sometimes Total is manually set.

    // Let's calculate what the rental *should* be based on rate
    const carRate = Number(rental.cars?.daily_rate) || 0;
    const calculatedRentalCost = carRate * rentalDays;

    // If (calculated + charges) != total, we might have a discount or manual adjustment.
    // But for the invoice to "look right", let's list the known items.

    // Option A: Base Rental line item is just (Total - Charges). 
    // This ensures Math checks out.
    const rentalLineItemAmount = Math.max(0, finalTotal - chargesTotal);
    const rentalRatePerDay = rentalLineItemAmount / rentalDays;

    return (
        <div className="bg-white p-8 max-w-2xl mx-auto font-sans text-gray-800" id="invoice-content">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">D</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Dhanya CRM</h1>
                    </div>
                    <p className="text-sm text-gray-500">Car Rental Services</p>
                    <p className="text-sm text-gray-500">Hyderabad, Telangana, India</p>
                    <p className="text-sm text-gray-500">contact@dhanyacrm.com</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Invoice #:</span> {invoiceNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Date:</span> {invoiceDate}
                    </p>
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Status:</span>{' '}
                        <span className={`font-semibold ${rental.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                            {rental.status === 'completed' ? 'PAID' : 'PENDING'}
                        </span>
                    </p>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Bill To</h3>
                <p className="text-lg font-semibold text-gray-900">{rental.customer_name}</p>
                <p className="text-sm text-gray-600">{rental.customer_phone}</p>
            </div>

            {/* Rental Details */}
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Rental Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Vehicle</p>
                            <p className="font-semibold text-gray-900">
                                {rental.cars?.make} {rental.cars?.model}
                            </p>
                            <p className="text-sm text-gray-500">{rental.cars?.license_plate}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Rental Period</p>
                            <p className="font-semibold text-gray-900">{startDate} - {endDate}</p>
                            <p className="text-sm text-gray-500">{rentalDays} day(s)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 text-sm font-semibold text-gray-600 uppercase">Description</th>
                            <th className="text-center py-3 text-sm font-semibold text-gray-600 uppercase">Qty/Days</th>
                            <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase">Rate</th>
                            <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Base Rental Item */}
                        <tr className="border-b border-gray-100">
                            <td className="py-4">
                                <p className="font-medium text-gray-900">
                                    {rental.cars?.make} {rental.cars?.model} Rental
                                </p>
                                <p className="text-sm text-gray-500">
                                    License: {rental.cars?.license_plate}
                                </p>
                            </td>
                            <td className="py-4 text-center text-gray-700">{rentalDays}</td>
                            <td className="py-4 text-right text-gray-700">
                                {formatCurrency(rentalRatePerDay)}
                            </td>
                            <td className="py-4 text-right font-medium text-gray-900">
                                {formatCurrency(rentalLineItemAmount)}
                            </td>
                        </tr>

                        {/* Extra Charges Items */}
                        {charges.map((charge, index) => (
                            <tr key={index} className="border-b border-gray-100 bg-gray-50/50">
                                <td className="py-4 pl-2">
                                    <p className="font-medium text-gray-900 capitalize">
                                        {charge.type.replace(/_/g, ' ')}
                                    </p>
                                    {charge.note && (
                                        <p className="text-sm text-gray-500">
                                            {charge.note}
                                        </p>
                                    )}
                                </td>
                                <td className="py-4 text-center text-gray-700">1</td>
                                <td className="py-4 text-right text-gray-700">
                                    {formatCurrency(charge.amount)}
                                </td>
                                <td className="py-4 text-right font-medium text-gray-900">
                                    {formatCurrency(charge.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
                <div className="w-64">
                    <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">{formatCurrency(finalTotal)}</span>
                    </div>
                    {/* Tax Breakdown REMOVED as per user request */}

                    <div className="flex justify-between py-3 text-lg font-bold">
                        <span className="text-gray-900">Total</span>
                        <span className="text-zinc-900">{formatCurrency(finalTotal)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 text-center">
                <p className="text-sm text-gray-500 mb-2">Thank you for choosing Dhanya CRM!</p>
                <p className="text-xs text-gray-400">
                    For questions about this invoice, please contact us at contact@dhanyacrm.com
                </p>
            </div>
        </div>
    );
};

export default InvoiceTemplate;
