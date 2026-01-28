import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/date';

import { rentalsApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import {
    CreditCard, Search, Filter, DollarSign, Clock, CheckCircle,
    AlertCircle, Phone, Car, Calendar, X, Save, TrendingUp
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const Payments = () => {
    const settingsContext = useSettings();
    // Default formatter if context is missing
    const defaultFormatter = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Number(amount) || 0);
    };

    const formatCurrency = settingsContext?.formatCurrency || defaultFormatter;
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedRental, setSelectedRental] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({
        payment_status: '',
        amount_paid: 0
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRentals();
    }, []);

    const fetchRentals = async () => {
        try {
            setLoading(true);
            // Request larger limit for payments view
            const response = await rentalsApi.getAll({ limit: 100 });
            setRentals(response.rentals || (Array.isArray(response) ? response : []));
        } catch (error) {
            console.error('Error fetching rentals:', error);
            toast.error('Failed to load rentals');
        } finally {
            setLoading(false);
        }
    };

    const getPaymentStatus = (rental) => {
        if (!rental.payment_status || rental.payment_status === 'pending') {
            return { status: 'pending', label: 'Pending', variant: 'warning' };
        } else if (rental.payment_status === 'partial') {
            return { status: 'partial', label: 'Partial', variant: 'secondary' };
        } else if (rental.payment_status === 'paid') {
            return { status: 'paid', label: 'Paid', variant: 'success' };
        }
        return { status: 'pending', label: 'Pending', variant: 'warning' };
    };

    const openPaymentModal = (rental) => {
        setSelectedRental(rental);
        setPaymentData({
            payment_status: rental.payment_status || 'pending',
            amount_paid: rental.amount_paid || 0
        });
        setIsModalOpen(true);
    };

    const handleSavePayment = async () => {
        if (!selectedRental) return;
        setSaving(true);

        try {
            await rentalsApi.update(selectedRental._id, {
                payment_status: paymentData.payment_status,
                amount_paid: paymentData.amount_paid
            });

            toast.success('Payment updated!');
            setIsModalOpen(false);
            fetchRentals();
        } catch (error) {
            toast.error('Failed to update payment');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    // Filter rentals
    const filteredRentals = rentals.filter(rental => {
        const matchesSearch =
            rental.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rental.customer_phone?.includes(searchQuery) ||
            rental.car_id?.license_plate?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filterStatus === 'all') {
            return rental.status !== 'cancelled';
        }

        const status = rental.payment_status || 'pending';
        // Also exclude cancelled from specific filters unless we have a 'cancelled' filter (which we don't)
        if (rental.status === 'cancelled') return false;

        return status === filterStatus;
    });

    // Calculate stats
    const stats = {
        totalDue: rentals.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0),
        totalCollected: rentals.reduce((sum, r) => sum + (Number(r.amount_paid) || 0), 0),
        pendingCount: rentals.filter(r => !r.payment_status || r.payment_status === 'pending').length,
        paidCount: rentals.filter(r => r.payment_status === 'paid').length
    };
    stats.outstanding = stats.totalDue - stats.totalCollected;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Payments</h1>
                <p className="text-muted-foreground mt-1">Track and manage rental payments</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <DollarSign size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalDue)}</p>
                            <p className="text-xs text-muted-foreground">Total Billed</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalCollected)}</p>
                            <p className="text-xs text-muted-foreground">Collected</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.outstanding)}</p>
                            <p className="text-xs text-muted-foreground">Outstanding</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <TrendingUp size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{stats.paidCount}/{rentals.length}</p>
                            <p className="text-xs text-muted-foreground">Paid Rentals</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search & Filter */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search by customer, phone, or plate..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'pending', 'partial', 'paid'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${filterStatus === status
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background border border-input text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Payments - Mobile Card View */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <Card className="p-8 text-center">
                        <div className="flex justify-center mb-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        <p className="text-muted-foreground">Loading payments...</p>
                    </Card>
                ) : filteredRentals.length === 0 ? (
                    <Card className="p-12 text-center">
                        <CreditCard size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-muted-foreground">No payments found</p>
                    </Card>
                ) : (
                    filteredRentals.map((rental) => {
                        const paymentStatus = getPaymentStatus(rental);
                        const totalAmount = Number(rental.total_amount) || 0;
                        const amountPaid = Number(rental.amount_paid) || 0;
                        const balance = totalAmount - amountPaid;

                        return (
                            <Card key={rental._id} className="p-4 space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-foreground">{rental.customer_name}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Phone size={10} /> {rental.customer_phone}
                                        </p>
                                    </div>
                                    <Badge variant={paymentStatus.variant}>{paymentStatus.label}</Badge>
                                </div>

                                {/* Car Info */}
                                <div className="pt-2 border-t border-border">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Car size={14} className="text-muted-foreground" />
                                        <span className="font-medium">{rental.car_id?.make} {rental.car_id?.model}</span>
                                        <span className="text-muted-foreground">• {rental.car_id?.license_plate}</span>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="text-xs text-muted-foreground">
                                    {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                                </div>

                                {/* Financial Summary */}
                                <div className="pt-2 border-t border-border space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Total Amount</span>
                                        <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Paid</span>
                                        <span className="font-semibold text-emerald-600">{formatCurrency(amountPaid)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-border">
                                        <span className="text-sm font-medium text-foreground">Balance</span>
                                        <span className={`text-lg font-bold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {formatCurrency(balance)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="pt-2">
                                    <button
                                        onClick={() => openPaymentModal(rental)}
                                        className="w-full px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors"
                                    >
                                        Update Payment
                                    </button>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Table - Desktop View */}
            <Card className="hidden md:block">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">CUSTOMER</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">VEHICLE</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">DATES</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">TOTAL</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">PAID</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">BALANCE</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">STATUS</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-muted-foreground">Loading...</td>
                                </tr>
                            ) : filteredRentals.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center">
                                        <CreditCard size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                                        <p className="text-muted-foreground">No payments found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRentals.map((rental) => {
                                    const paymentStatus = getPaymentStatus(rental);
                                    const totalAmount = Number(rental.total_amount) || 0;
                                    const amountPaid = Number(rental.amount_paid) || 0;
                                    const balance = totalAmount - amountPaid;

                                    return (
                                        <tr key={rental._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium text-foreground">{rental.customer_name}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Phone size={10} /> {rental.customer_phone}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Car size={14} className="text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm text-foreground">{rental.car_id?.make} {rental.car_id?.model}</p>
                                                        <p className="text-xs text-muted-foreground">{rental.car_id?.license_plate}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-foreground">
                                                    {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-foreground">{formatCurrency(totalAmount)}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-emerald-600 font-medium">{formatCurrency(amountPaid)}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-medium ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {formatCurrency(balance)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={paymentStatus.variant}>
                                                    {paymentStatus.label}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openPaymentModal(rental)}
                                                >
                                                    Update
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Payment Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Update Payment - ${selectedRental?.customer_name}`}
            >
                {selectedRental && (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted-foreground">Total Amount</span>
                                <span className="font-bold text-lg">{formatCurrency(selectedRental.total_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>{selectedRental.car_id?.make} {selectedRental.car_id?.model}</span>
                                <span>{formatDate(selectedRental.start_date)} - {formatDate(selectedRental.end_date)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Payment Status</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['pending', 'partial', 'paid'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setPaymentData({ ...paymentData, payment_status: status })}
                                        className={`p-3 rounded-lg border-2 transition-all capitalize ${paymentData.payment_status === status
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-muted-foreground/30'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Amount Paid</label>
                            <input
                                type="number"
                                value={paymentData.amount_paid}
                                onChange={(e) => {
                                    const amount = Number(e.target.value);
                                    let status = 'pending';
                                    const total = Number(selectedRental.total_amount) || 0;

                                    if (amount >= total) status = 'paid';
                                    else if (amount > 0) status = 'partial';

                                    setPaymentData({
                                        ...paymentData,
                                        amount_paid: e.target.value,
                                        payment_status: status
                                    });
                                }}
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                placeholder="Enter amount paid"
                            />
                            <p className="text-xs text-muted-foreground">
                                Balance: {formatCurrency((selectedRental.total_amount || 0) - paymentData.amount_paid)}
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleSavePayment} isLoading={saving} className="flex-1">
                                <Save size={16} className="mr-2" /> Save Payment
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Payments;
