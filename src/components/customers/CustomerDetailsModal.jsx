import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/date';
import { supabase } from '../../supabaseClient';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Phone, Calendar, Car, DollarSign, MapPin, Clock, TrendingUp, Award, Eye } from 'lucide-react';

/**
 * CustomerDetailsModal - Shows customer profile with complete rental history
 */
const CustomerDetailsModal = ({ isOpen, onClose, customer, formatCurrency, onViewRental }) => {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && customer?.phone) {
            fetchCustomerRentals();
        }
    }, [isOpen, customer]);

    const fetchCustomerRentals = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('rentals')
                .select(`
                    *,
                    cars (make, model, license_plate)
                `)
                .eq('customer_phone', customer.phone)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRentals(data || []);
        } catch (error) {
            console.error('Error fetching rentals:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!customer) return null;

    const getStatusVariant = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'pending': return 'warning';
            case 'completed': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'secondary';
        }
    };

    // Calculate stats
    const totalSpent = rentals.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
    const activeRentals = rentals.filter(r => r.status === 'active').length;
    const completedRentals = rentals.filter(r => r.status === 'completed').length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Customer Profile"
            size="lg"
        >
            <div className="space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Customer Header */}
                <div className="flex items-start gap-4 pb-4 border-b border-border">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                        {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground">{customer.name}</h3>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Phone size={14} /> {customer.phone}
                        </p>
                        {customer.totalRentals >= 5 && (
                            <Badge variant="warning" className="mt-2">
                                <Award size={12} className="mr-1" /> Loyal Customer
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-foreground">{rentals.length}</p>
                        <p className="text-xs text-muted-foreground">Total Bookings</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalSpent)}</p>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{activeRentals}</p>
                        <p className="text-xs text-muted-foreground">Active Now</p>
                    </div>
                </div>

                {/* Rental History */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                            <TrendingUp size={16} className="text-primary" />
                            Rental History
                        </h4>
                        <span className="text-xs text-muted-foreground">{rentals.length} rentals</span>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : rentals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No rentals found</div>
                    ) : (
                        <div className="space-y-3">
                            {rentals.map((rental) => (
                                <div
                                    key={rental.id}
                                    className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Car size={18} className="text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {rental.cars?.make} {rental.cars?.model}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {rental.cars?.license_plate}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={getStatusVariant(rental.status)}>
                                            {rental.status}
                                        </Badge>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar size={12} />
                                            {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-600 font-medium justify-end">
                                            <DollarSign size={12} />
                                            {formatCurrency(rental.total_amount)}
                                        </div>
                                    </div>

                                    {(rental.from_location || rental.to_location) && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin size={10} />
                                            {rental.from_location} → {rental.to_location}
                                        </div>
                                    )}

                                    {onViewRental && (
                                        <div className="mt-3 pt-3 border-t border-border">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onViewRental(rental)}
                                                className="text-xs"
                                            >
                                                <Eye size={12} className="mr-1" /> View Details
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                    <p>Customer since: {customer.lastRentalDate ? formatDate(customer.lastRentalDate) : 'N/A'}</p>
                </div>
            </div>
        </Modal>
    );
};

export default CustomerDetailsModal;
