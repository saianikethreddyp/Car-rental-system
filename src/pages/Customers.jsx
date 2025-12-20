import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/date';
import { supabase } from '../supabaseClient';
import { useSettings } from '../context/SettingsContext';
import { Search, User, Phone, ShoppingBag, Calendar, Filter, Users, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import CustomerDetailsModal from '../components/customers/CustomerDetailsModal';

const Customers = () => {
    const { formatCurrency } = useSettings();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    useEffect(() => {
        fetchCustomers();

        // Real-time subscription for customers
        const subscription = supabase
            .channel('customers-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customers' },
                () => fetchCustomers()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'rentals' },
                () => fetchCustomers()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);

            // Fetch customers from dedicated table
            const { data: customersData, error: customersError } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            if (customersError) throw customersError;

            // Fetch rental stats for each customer
            const { data: rentals, error: rentalsError } = await supabase
                .from('rentals')
                .select('customer_id, total_amount, created_at, status');

            if (rentalsError) throw rentalsError;

            // Aggregate rental data per customer
            const rentalStats = {};
            rentals.forEach(rental => {
                if (!rental.customer_id) return;

                if (!rentalStats[rental.customer_id]) {
                    rentalStats[rental.customer_id] = {
                        totalRentals: 0,
                        totalSpent: 0,
                        lastRentalDate: rental.created_at,
                        hasActiveRental: false
                    };
                }

                rentalStats[rental.customer_id].totalRentals += 1;
                rentalStats[rental.customer_id].totalSpent += rental.total_amount || 0;

                if (new Date(rental.created_at) > new Date(rentalStats[rental.customer_id].lastRentalDate)) {
                    rentalStats[rental.customer_id].lastRentalDate = rental.created_at;
                }

                if (rental.status === 'active') {
                    rentalStats[rental.customer_id].hasActiveRental = true;
                }
            });

            // Merge customer data with stats
            const enrichedCustomers = customersData.map(customer => ({
                ...customer,
                totalRentals: rentalStats[customer.id]?.totalRentals || 0,
                totalSpent: rentalStats[customer.id]?.totalSpent || 0,
                lastRentalDate: rentalStats[customer.id]?.lastRentalDate || customer.created_at,
                hasActiveRental: rentalStats[customer.id]?.hasActiveRental || false
            }));

            setCustomers(enrichedCustomers);

        } catch (error) {
            console.error('Error fetching customers:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Customer Database</h1>
                    <p className="text-muted-foreground mt-1">Insights and history of your client base</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
                    <Users size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">{customers.length} Total Customers</span>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search customers by name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background border border-input rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
                    />
                </div>
                <Button variant="outline" className="px-3">
                    <Filter size={18} />
                </Button>
            </div>

            {/* Customer List */}
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="p-4 border-b border-border">Customer Details</th>
                                <th className="p-4 border-b border-border">Total Rentals</th>
                                <th className="p-4 border-b border-border">Total Spent</th>
                                <th className="p-4 border-b border-border">Last Active</th>
                                <th className="p-4 border-b border-border">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-muted-foreground">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Loading customer data...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center">
                                        <Users size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                                        <p className="text-muted-foreground">No customers found.</p>
                                        <p className="text-xs text-muted-foreground mt-1">Create a rental to add customers</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setSelectedCustomer(customer);
                                            setDetailsModalOpen(true);
                                        }}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                                    {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">{customer.name || 'Unknown'}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Phone size={10} /> {customer.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-foreground">
                                                <ShoppingBag size={14} className="text-muted-foreground" />
                                                {customer.totalRentals} {customer.totalRentals === 1 ? 'booking' : 'bookings'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-emerald-600">
                                                {formatCurrency(customer.totalSpent)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground text-xs">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {formatDate(customer.lastRentalDate)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={customer.hasActiveRental ? "success" : "secondary"}>
                                                {customer.hasActiveRental ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Customer Details Modal */}
            <CustomerDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedCustomer(null);
                }}
                customer={selectedCustomer}
                formatCurrency={formatCurrency}
            />
        </div>
    );
};

export default Customers;
