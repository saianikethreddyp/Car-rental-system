import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/date';
import { rentalsApi, carsApi } from '../api/client';
// Removed: import { supabase } from '../supabaseClient';
import { useSettings } from '../context/SettingsContext';
import { Plus, Search, Calendar, Phone, CheckCircle, XCircle, Clock, Filter, FileText, ChevronDown, ChevronUp, CreditCard, IdCard, Car as CarIcon, Eye } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import InvoiceModal from '../components/invoices/InvoiceModal';
import DocumentUploadDual from '../components/ui/DocumentUploadDual';
import CarPhotoUpload from '../components/ui/CarPhotoUpload';
import RentalDetailsModal from '../components/rentals/RentalDetailsModal';
import AddChargeModal from '../components/rentals/AddChargeModal';
import { FileCheck, DollarSign } from 'lucide-react';

const Rentals = () => {
    // Safely access settings or provide defaults to prevent crashes
    const settingsContext = useSettings();

    // Default formatter if context is missing or still initializing
    const defaultFormatter = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Number(amount) || 0);
    };

    const formatCurrency = settingsContext?.formatCurrency || defaultFormatter;
    const [rentals, setRentals] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [selectedRentalForInvoice, setSelectedRentalForInvoice] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [dateError, setDateError] = useState('');
    const [showDocuments, setShowDocuments] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedRentalForDetails, setSelectedRentalForDetails] = useState(null);
    const [chargeModalOpen, setChargeModalOpen] = useState(false);
    const [selectedRentalForCharge, setSelectedRentalForCharge] = useState(null);
    const [addingCharge, setAddingCharge] = useState(false);
    const [formData, setFormData] = useState({
        car_id: '',
        customer_name: '',
        customer_phone: '',
        secondary_phone: '',
        parent_phone: '',
        from_location: '',
        to_location: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        total_amount: '',
        payment_method: 'cash',
        // Identity documents - Front/Back
        aadhar_number: '',
        aadhar_front_image_url: '',
        aadhar_back_image_url: '',
        pan_number: '',
        pan_front_image_url: '',
        pan_back_image_url: '',
        license_number: '',
        license_front_image_url: '',
        license_back_image_url: '',
        rc_number: '',
        rc_front_image_url: '',
        rc_back_image_url: '',
        // Car photos
        car_photos: []
    });

    useEffect(() => {
        fetchRentals();
        fetchAvailableCars();
    }, []);

    const fetchRentals = async () => {
        try {
            setLoading(true);
            const data = await rentalsApi.getAll();
            setRentals(data || []);
        } catch (error) {
            console.error('Error fetching rentals:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableCars = async () => {
        try {
            const data = await carsApi.getAll();
            // Filter only available cars
            setCars(data ? data.filter(c => c.status === 'available') : []);
        } catch (error) {
            console.error('Error fetching cars:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Validate dates
            if (name === 'start_date' || name === 'end_date') {
                const start = name === 'start_date' ? value : prev.start_date;
                const end = name === 'end_date' ? value : prev.end_date;

                if (start && end) {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    if (endDate < startDate) {
                        setDateError('End date must be on or after start date');
                    } else {
                        setDateError('');
                    }
                } else {
                    setDateError('');
                }
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Block submit if date error exists
        if (dateError) {
            alert(dateError);
            return;
        }

        // Prevent double-submit
        if (submitting) return;
        setSubmitting(true);

        try {
            // Create rental directly with status='active'
            await rentalsApi.create({ ...formData, status: 'active' });

            // Update car status
            await carsApi.update(formData.car_id, { status: 'rented' });

            // Reset form
            setIsModalOpen(false);
            setFormData({
                car_id: '',
                customer_name: '',
                customer_phone: '',
                secondary_phone: '',
                parent_phone: '',
                from_location: '',
                to_location: '',
                start_date: '',
                start_time: '',
                end_date: '',
                end_time: '',
                total_amount: '',
                payment_method: 'cash',
                aadhar_number: '',
                aadhar_front_image_url: '',
                aadhar_back_image_url: '',
                pan_number: '',
                pan_front_image_url: '',
                pan_back_image_url: '',
                license_number: '',
                license_front_image_url: '',
                license_back_image_url: '',
                rc_number: '',
                rc_front_image_url: '',
                rc_back_image_url: '',
                car_photos: []
            });
            setShowDocuments(false);
            setDateError('');
            fetchRentals();
            fetchAvailableCars();
        } catch (error) {
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (rentalId, carId, newStatus) => {
        try {
            await rentalsApi.update(rentalId, { status: newStatus });

            if (newStatus === 'completed' || newStatus === 'cancelled') {
                await carsApi.update(carId, { status: 'available' });
            }

            fetchRentals();
            fetchAvailableCars();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleAddCharge = async (chargeData) => {
        if (!selectedRentalForCharge) return;

        setAddingCharge(true);
        try {
            await rentalsApi.addCharge(selectedRentalForCharge.id || selectedRentalForCharge._id, chargeData);
            setChargeModalOpen(false);
            setSelectedRentalForCharge(null);
            fetchRentals();
        } catch (error) {
            alert(error.message);
        } finally {
            setAddingCharge(false);
        }
    };

    const filteredRentals = (rentals || []).filter(rental => {
        if (!rental) return false;

        // Handle search
        const customerName = rental.customer_name?.toLowerCase() || '';
        const carMake = rental.cars?.make?.toLowerCase() || '';
        const licensePlate = rental.cars?.license_plate?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();

        const matchesSearch = !searchTerm ||
            customerName.includes(searchLower) ||
            carMake.includes(searchLower) ||
            licensePlate.includes(searchLower);

        const matchesStatus = filterStatus === 'all' || rental.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Rentals</h1>
                    <p className="text-muted-foreground mt-1">Manage bookings and track vehicle status.</p>
                </div>
                <Button icon={Plus} onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setFormData(prev => ({ ...prev, start_date: today }));
                    setIsModalOpen(true);
                }}>
                    New Booking
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search by customer or car..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-10 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['all', 'active', 'completed', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize whitespace-nowrap ${filterStatus === status
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-background border border-input text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Rentals Table */}
            <Card className="overflow-hidden p-0 border border-border shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Car</th>
                                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
                                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-muted-foreground">
                                        <div className="flex justify-center mb-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                        Loading rentals...
                                    </td>
                                </tr>
                            ) : filteredRentals.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-muted-foreground">
                                        No rentals found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredRentals.map((rental) => (
                                    <tr key={rental._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs">
                                                    {rental.customer_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground text-sm">{rental.customer_name}</p>
                                                    <p className="text-xs text-muted-foreground">ID: #{String(rental._id).slice(0, 6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-foreground">
                                                <p className="font-medium">{rental.car_id?.make} {rental.car_id?.model}</p>
                                                <p className="text-xs text-muted-foreground">{rental.car_id?.license_plate}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{formatDate(rental.start_date)}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(rental.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{formatDate(rental.end_date)}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(rental.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Clock size={10} /> {Math.ceil((new Date(rental.end_date) - new Date(rental.start_date)) / (1000 * 60 * 60 * 24))} days
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-foreground text-sm">{formatCurrency(rental.total_amount)}</td>
                                        <td className="p-4">
                                            <Badge variant={
                                                rental.status === 'active' ? 'success' :
                                                    rental.status === 'completed' ? 'secondary' : 'destructive'
                                            } className="shadow-none">
                                                {rental.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {/* View Details Button */}
                                                <button
                                                    onClick={() => {
                                                        setSelectedRentalForDetails(rental);
                                                        setDetailsModalOpen(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {/* Invoice Button - always visible */}
                                                <button
                                                    onClick={() => {
                                                        setSelectedRentalForInvoice(rental);
                                                        setInvoiceModalOpen(true);
                                                    }}
                                                    className="text-primary hover:text-primary/80 p-1.5 hover:bg-primary/10 rounded-md transition-colors"
                                                    title="View Invoice"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                                {rental.status === 'active' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRentalForCharge(rental);
                                                                setChargeModalOpen(true);
                                                            }}
                                                            className="text-xs px-2 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-md font-medium transition-colors"
                                                            title="Add Charge"
                                                        >
                                                            + Charge
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(rental._id, rental.car_id?._id, 'completed')}
                                                            className="text-emerald-600 hover:text-emerald-700 p-1.5 hover:bg-emerald-50 rounded-md transition-colors"
                                                            title="Complete Rental"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(rental._id, rental.car_id?._id, 'cancelled')}
                                                            className="text-destructive hover:text-destructive/80 p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                                                            title="Cancel Rental"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal - content passed to Modal component */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Booking">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Select Car"
                        name="car_id"
                        value={formData.car_id}
                        onChange={handleChange}
                        options={[
                            { value: '', label: 'Select a car...', disabled: true },
                            ...cars.map(car => ({
                                value: car.id || car._id,
                                label: `${car.make} ${car.model} (${car.license_plate}) ${car.status !== 'available' ? `(${car.status})` : ''}`,
                                disabled: car.status !== 'available'
                            }))
                        ]}
                        required
                    />

                    <Input
                        label="Customer Name"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleChange}
                        placeholder="e.g. John Doe"
                        required
                    />

                    <Input
                        label="Phone Number"
                        name="customer_phone"
                        value={formData.customer_phone}
                        onChange={handleChange}
                        placeholder="e.g. 9876543210"
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Secondary Phone"
                            name="secondary_phone"
                            value={formData.secondary_phone}
                            onChange={handleChange}
                            placeholder="Alternate number"
                        />
                        <Input
                            label="Parent/Guardian Phone"
                            name="parent_phone"
                            value={formData.parent_phone}
                            onChange={handleChange}
                            placeholder="For security"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="From Location"
                            name="from_location"
                            value={formData.from_location}
                            onChange={handleChange}
                            placeholder="Pickup location..."
                            required
                        />
                        <Input
                            label="To Location"
                            name="to_location"
                            value={formData.to_location}
                            onChange={handleChange}
                            placeholder="Drop-off location..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            name="start_date"
                            type="date"
                            value={formData.start_date}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Start Time"
                            name="start_time"
                            type="time"
                            value={formData.start_time}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="End Date"
                            name="end_date"
                            type="date"
                            value={formData.end_date}
                            onChange={handleChange}
                            required
                            error={dateError}
                        />
                        <Input
                            label="End Time"
                            name="end_time"
                            type="time"
                            value={formData.end_time}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {
                        dateError && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                                ⚠️ {dateError}
                            </div>
                        )
                    }

                    {/* Identity Documents Section */}
                    <div className="border border-border rounded-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowDocuments(!showDocuments)}
                            className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
                        >
                            <div className="flex items-center gap-2">
                                <FileCheck size={18} className="text-primary" />
                                <span className="font-medium text-foreground">Identity & Vehicle Documents</span>
                                <Badge variant="secondary" className="text-[10px]">Required</Badge>
                            </div>
                            {showDocuments ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>

                        {showDocuments && (
                            <div className="p-4 space-y-4 bg-background">
                                {/* Aadhar Card */}
                                <DocumentUploadDual
                                    label="Aadhar Card"
                                    docType="aadhar"
                                    icon={IdCard}
                                    numberValue={formData.aadhar_number}
                                    onNumberChange={(e) => setFormData(prev => ({ ...prev, aadhar_number: e.target.value }))}
                                    numberPlaceholder="1234 5678 9012"
                                    frontUrl={formData.aadhar_front_image_url}
                                    backUrl={formData.aadhar_back_image_url}
                                    onFrontUpload={(url) => setFormData(prev => ({ ...prev, aadhar_front_image_url: url }))}
                                    onBackUpload={(url) => setFormData(prev => ({ ...prev, aadhar_back_image_url: url }))}
                                />

                                {/* PAN Card */}
                                <DocumentUploadDual
                                    label="PAN Card"
                                    docType="pan"
                                    icon={CreditCard}
                                    numberValue={formData.pan_number}
                                    onNumberChange={(e) => setFormData(prev => ({ ...prev, pan_number: e.target.value }))}
                                    numberPlaceholder="ABCDE1234F"
                                    frontUrl={formData.pan_front_image_url}
                                    backUrl={formData.pan_back_image_url}
                                    onFrontUpload={(url) => setFormData(prev => ({ ...prev, pan_front_image_url: url }))}
                                    onBackUpload={(url) => setFormData(prev => ({ ...prev, pan_back_image_url: url }))}
                                />

                                {/* Driving License */}
                                <DocumentUploadDual
                                    label="Driving License"
                                    docType="license"
                                    icon={IdCard}
                                    numberValue={formData.license_number}
                                    onNumberChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                                    numberPlaceholder="TS0120200012345"
                                    frontUrl={formData.license_front_image_url}
                                    backUrl={formData.license_back_image_url}
                                    onFrontUpload={(url) => setFormData(prev => ({ ...prev, license_front_image_url: url }))}
                                    onBackUpload={(url) => setFormData(prev => ({ ...prev, license_back_image_url: url }))}
                                />

                                {/* RC (Registration Certificate) */}
                                <DocumentUploadDual
                                    label="RC (Registration Certificate)"
                                    docType="rc"
                                    icon={CarIcon}
                                    numberValue={formData.rc_number}
                                    onNumberChange={(e) => setFormData(prev => ({ ...prev, rc_number: e.target.value }))}
                                    numberPlaceholder="TS01AB1234"
                                    frontUrl={formData.rc_front_image_url}
                                    backUrl={formData.rc_back_image_url}
                                    onFrontUpload={(url) => setFormData(prev => ({ ...prev, rc_front_image_url: url }))}
                                    onBackUpload={(url) => setFormData(prev => ({ ...prev, rc_back_image_url: url }))}
                                />

                                {/* Car Photos */}
                                <CarPhotoUpload
                                    photos={formData.car_photos}
                                    onPhotosChange={(photos) => setFormData(prev => ({ ...prev, car_photos: photos }))}
                                    maxPhotos={6}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Total Amount (₹)"
                                name="total_amount"
                                type="number"
                                value={formData.total_amount}
                                onChange={handleChange}
                                placeholder="Enter agreed amount"
                                required
                            />
                        </div>
                        <Select
                            label="Payment Method"
                            name="payment_method"
                            value={formData.payment_method}
                            onChange={handleChange}
                            options={[
                                { value: 'cash', label: '💵 Cash' },
                                { value: 'upi', label: '📱 UPI' },
                                { value: 'card', label: '💳 Card' },
                                { value: 'bank_transfer', label: '🏦 Bank Transfer' },
                                { value: 'pending', label: '⏳ Pending' },
                            ]}
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={cars.length === 0 || dateError || submitting}
                            isLoading={submitting}
                            size="lg"
                        >
                            {submitting ? 'Creating Booking...' : 'Confirm Booking'}
                        </Button>
                    </div>
                </form >
            </Modal >

            {/* Invoice Modal */}
            <InvoiceModal
                isOpen={invoiceModalOpen}
                onClose={() => {
                    setInvoiceModalOpen(false);
                    setSelectedRentalForInvoice(null);
                }}
                rental={selectedRentalForInvoice}
            />

            {/* Rental Details Modal */}
            <RentalDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedRentalForDetails(null);
                }}
                rental={selectedRentalForDetails}
                formatCurrency={formatCurrency}
            />

            {/* Add Charge Modal */}
            <AddChargeModal
                isOpen={chargeModalOpen}
                onClose={() => {
                    setChargeModalOpen(false);
                    setSelectedRentalForCharge(null);
                }}
                rental={selectedRentalForCharge}
                onAdd={handleAddCharge}
                isLoading={addingCharge}
            />
        </div >
    );
};

export default Rentals;
