import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { PlusCircle, DollarSign } from 'lucide-react';

const CHARGE_TYPES = [
    { value: 'extension', label: '📅 Extension - Extra days' },
    { value: 'damage', label: '🔧 Damage - Repair costs' },
    { value: 'fuel', label: '⛽ Fuel - Fuel charges' },
    { value: 'fine', label: '📋 Fine - Traffic/Late fees' },
    { value: 'discount', label: '💸 Discount - Price reduction' },
    { value: 'other', label: '📝 Other - Miscellaneous' },
];

const PAYMENT_METHODS = [
    { value: 'cash', label: '💵 Cash' },
    { value: 'upi', label: '📱 UPI' },
    { value: 'card', label: '💳 Card' },
    { value: 'bank_transfer', label: '🏦 Bank Transfer' },
    { value: 'pending', label: '⏳ Pending' },
];

/**
 * AddChargeModal - Modal for adding additional charges to an active rental
 */
const AddChargeModal = ({ isOpen, onClose, onAdd, rental, isLoading }) => {
    const [chargeData, setChargeData] = useState({
        type: 'extension',
        amount: '',
        payment_method: 'cash',
        note: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!chargeData.amount || parseFloat(chargeData.amount) === 0) {
            alert('Please enter an amount');
            return;
        }

        // For discount, make amount negative
        let amount = parseFloat(chargeData.amount);
        if (chargeData.type === 'discount' && amount > 0) {
            amount = -amount;
        }

        await onAdd({
            type: chargeData.type,
            amount: amount,
            payment_method: chargeData.payment_method,
            note: chargeData.note
        });

        // Reset form
        setChargeData({
            type: 'extension',
            amount: '',
            payment_method: 'cash',
            note: ''
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setChargeData(prev => ({ ...prev, [name]: value }));
    };

    if (!rental) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Charge">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current rental info */}
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="font-medium">{rental.customer_name}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-muted-foreground">Current Total:</span>
                        <span className="font-bold text-lg text-emerald-600">₹{rental.total_amount?.toLocaleString()}</span>
                    </div>
                </div>

                {/* Charge Type */}
                <Select
                    label="Charge Type"
                    name="type"
                    value={chargeData.type}
                    onChange={handleChange}
                    options={CHARGE_TYPES}
                    required
                />

                {/* Amount & Payment Method */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Input
                            label={chargeData.type === 'discount' ? 'Discount (₹)' : 'Amount (₹)'}
                            name="amount"
                            type="number"
                            value={chargeData.amount}
                            onChange={handleChange}
                            placeholder="Enter amount"
                            required
                        />
                    </div>
                    <Select
                        label="Payment"
                        name="payment_method"
                        value={chargeData.payment_method}
                        onChange={handleChange}
                        options={PAYMENT_METHODS}
                        required
                    />
                </div>
                {chargeData.type === 'discount' && (
                    <p className="text-xs text-muted-foreground">
                        💡 Amount will be deducted from total
                    </p>
                )}

                {/* Note */}
                <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                        Note (optional)
                    </label>
                    <textarea
                        name="note"
                        value={chargeData.note}
                        onChange={handleChange}
                        placeholder="e.g., 2 extra days extension, Bumper scratch repair..."
                        className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        maxLength={200}
                    />
                </div>

                {/* Preview */}
                {chargeData.amount && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span>New Total:</span>
                            <span className="font-bold text-lg">
                                ₹{(
                                    (rental.total_amount || 0) +
                                    (chargeData.type === 'discount'
                                        ? -Math.abs(parseFloat(chargeData.amount) || 0)
                                        : parseFloat(chargeData.amount) || 0)
                                ).toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={isLoading}
                        isLoading={isLoading}
                        icon={PlusCircle}
                    >
                        Add Charge
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddChargeModal;
