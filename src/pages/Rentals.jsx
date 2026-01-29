import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/date';
import { rentalsApi, carsApi } from '../api/client';

import { useSettings } from '../context/SettingsContext';
import { Plus, Search, Calendar, Phone, CheckCircle, XCircle, Clock, Filter, FileText, ChevronDown, ChevronUp, CreditCard, IdCard, Car as CarIcon, Eye, Calculator } from 'lucide-react';
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
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [selectedRentalForInvoice, setSelectedRentalForInvoice] = useState(null);
    const [editingRentalId, setEditingRentalId] = useState(null); // Fix for Edit Mode
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
        created_by: '', // FIX #5: Operator name
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
        fetchRentals(1);
        fetchAvailableCars();
    }, []);

    // Effect to refetch when filters change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchRentals(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, filterStatus]);

    const fetchRentals = async (page = 1) => {
        try {
            setLoading(true);
            const response = await rentalsApi.getAll({
                page,
                limit: 10,
                search: searchTerm,
                status: filterStatus
            });

            if (response && response.rentals) {
                setRentals(response.rentals);
                setPagination(response.pagination);
            } else if (Array.isArray(response)) {
                // Fallback / legacy support
                setRentals(response);
                setPagination({ page: 1, limit: response.length, total: response.length, pages: 1 });
            } else {
                setRentals([]);
            }
        } catch (error) {
            console.error('Error fetching rentals:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableCars = async () => {
        try {
            // Fetch only available cars for the dropdown, with a high limit
            const response = await carsApi.getAll({ status: 'available', limit: 1000 });
            const availableCars = response.cars || (Array.isArray(response) ? response : []);
            setCars(availableCars);
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
            // Determine status based on Start Date if creating, or keep/update if editing
            // If Start Date is TODAY -> Active
            // If Start Date is FUTURE -> Pending
            const todayStr = new Date().toISOString().split('T')[0];
            const startDateStr = formData.start_date; // YYYY-MM-DD

            // Allow string comparison for ISO dates
            let status = startDateStr > todayStr ? 'pending' : 'active';

            // If we are editing (e.g. starting a rental), and documents are now present, 
            // the user likely INTENDS to start it if the date is reached.
            // But let's stick to the button action determining status unless we are creating.

            if (editingRentalId) {
                // Keep existing status unless we are fulfilling a "Start Rental" flow which usually sets it to active via button
                // But if we are just editing details, status might stay same.
                // However, for the specific "Start Rental" flow where we opened modal to add docs:
                // We should probably ask the user or infer. 
                // Let's assume: if start date is today/past, set active? No, that's risky.
                // Let's just update the details. The "Start Rental" button logic will handle the status flip separately 
                // OR we can make this the "Activate" action.
                // Ideally, we update the data, then if it was a "Start Rental" attempt, we try to activate.
                // Simplified: Update the rental data.
                await rentalsApi.update(editingRentalId, formData);
            } else {
                await rentalsApi.create({ ...formData, status });
            }

            // Reset form
            setIsModalOpen(false);
            setEditingRentalId(null);
            setFormData({
                car_id: '',
                created_by: '',
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
            setEditingRentalId(null); // Reset edit state
            setDateError('');
            fetchRentals();
            fetchAvailableCars();
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'Failed to create booking';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Manual Calculator State
    const [calcRate, setCalcRate] = useState('');
    const [calcDays, setCalcDays] = useState('');

    // Update calcRate when car changes
    useEffect(() => {
        if (formData.car_id) {
            const selectedCar = cars.find(c => c.id === formData.car_id || c._id === formData.car_id);
            if (selectedCar && selectedCar.daily_rate) {
                setCalcRate(selectedCar.daily_rate);
            }
        }
    }, [formData.car_id, cars]);

    // Update calcDays when dates change
    useEffect(() => {
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            if (!isNaN(start) && !isNaN(end)) {
                const diffTime = Math.abs(end - start);
                let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (days === 0) days = 1;
                setCalcDays(days);
            }
        }
    }, [formData.start_date, formData.end_date]);

    // Calculate Total from Manual Inputs
    const calculateManualTotal = () => {
        const rate = parseFloat(calcRate) || 0;
        const days = parseFloat(calcDays) || 0;
        const total = rate * days;
        setFormData(prev => ({ ...prev, total_amount: total }));
        toast.success(`Calculated: ₹${rate} x ${days} days = ₹${total}`);
    };

    const handleStatusUpdate = async (rentalId, carId, newStatus) => {
        try {
            await rentalsApi.update(rentalId, { status: newStatus });
            // Backend automatically updates car availability based on status change

            fetchRentals();
            fetchAvailableCars();
        } catch (error) {
            // FIX: Handle backend validation errors (missing docs) gracefully
            const errorMsg = error.response?.data?.error || error.message;
            if (errorMsg.includes('Cannot start rental without documents')) {
                alert("Documents missing! Please use the 'Start Rental' button to upload documents.");
            } else {
                alert(errorMsg);
            }
        }
    };

    const handleStartRental = (rental) => {
        // Proactive check: If docs missing, open edit modal
        const hasDocs = rental.aadhar_front_image_url && rental.license_front_image_url && rental.car_photos?.length > 0;

        if (!hasDocs) {
            // Populate form and open modal
            setEditingRentalId(rental._id);
            setFormData({
                car_id: rental.car_id?._id || rental.car_id, // Handle populated vs raw
                created_by: rental.created_by || '',
                customer_name: rental.customer_name,
                customer_phone: rental.customer_phone,
                secondary_phone: rental.secondary_phone || '',
                parent_phone: rental.parent_phone || '',
                from_location: rental.from_location,
                to_location: rental.to_location,
                start_date: rental.start_date ? new Date(rental.start_date).toISOString().split('T')[0] : '',
                start_time: rental.start_time || '',
                end_date: rental.end_date ? new Date(rental.end_date).toISOString().split('T')[0] : '',
                end_time: rental.end_time || '',
                total_amount: rental.total_amount,
                payment_method: rental.payment_method,
                // Documents
                aadhar_number: rental.aadhar_number || '',
                aadhar_front_image_url: rental.aadhar_front_image_url || '',
                aadhar_back_image_url: rental.aadhar_back_image_url || '',
                pan_number: rental.pan_number || '',
                pan_front_image_url: rental.pan_front_image_url || '',
                pan_back_image_url: rental.pan_back_image_url || '',
                license_number: rental.license_number || '',
                license_front_image_url: rental.license_front_image_url || '',
                license_back_image_url: rental.license_back_image_url || '',
                rc_number: rental.rc_number || '',
                rc_front_image_url: rental.rc_front_image_url || '',
                rc_back_image_url: rental.rc_back_image_url || '',
                car_photos: rental.car_photos || []
            });
            // Show docs section automatically
            setShowDocuments(true);
            setIsModalOpen(true);
            alert("Please upload the required Identity Documents and Car Photos to start the rental.");
        } else {
            // If docs exist, just activate
            handleStatusUpdate(rental._id, rental.car_id?._id, 'active');
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

    // Data is now filtered on the backend
    const filteredRentals = rentals;

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
            </div> // Fixed closing tag mismatch if any

            {/* Note about Pending Rentals */}
            {rentals.some(r => r.status === 'pending') && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-center gap-2">
                    <Clock size={16} />
                    <span>You have pending bookings. Click "Start Rental" when the customer arrives to upload documents and activate the trip.</span>
                </div>
            )}

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
                        {['all', 'pre_booking', 'active', 'completed', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize whitespace-nowrap ${filterStatus === status
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-background border border-input text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                {status === 'pre_booking' ? 'Pre Booking' : status}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Rentals - Mobile Card View (< md breakpoint) */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <Card className="p-8 text-center">
                        <div className="flex justify-center mb-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        <p className="text-muted-foreground">Loading rentals...</p>
                    </Card>
                ) : filteredRentals.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-muted-foreground">No rentals found matching your criteria.</p>
                    </Card>
                ) : (
                    filteredRentals.map((rental) => (
                        <Card key={rental._id} className="p-4 space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                                        {rental.customer_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{rental.customer_name}</p>
                                        <p className="text-xs text-muted-foreground">ID: #{String(rental._id).slice(0, 6)}</p>
                                    </div>
                                </div>
                                <Badge variant={
                                    rental.status === 'active' ? 'success' :
                                        rental.status === 'completed' ? 'secondary' :
                                            rental.status === 'pending' ? 'default' : 'destructive'
                                }>
                                    {rental.status}
                                </Badge>
                            </div>

                            {/* Car Info */}
                            <div className="pt-2 border-t border-border">
                                <div className="flex items-center gap-2 text-sm">
                                    <CarIcon size={14} className="text-muted-foreground" />
                                    <span className="font-medium">{rental.car_id?.make} {rental.car_id?.model}</span>
                                    <span className="text-muted-foreground">• {rental.car_id?.license_plate}</span>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <p className="text-muted-foreground mb-1">Start</p>
                                    <p className="font-medium">{formatDate(rental.start_date)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">End</p>
                                    <p className="font-medium">{formatDate(rental.end_date)}</p>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="pt-2 border-t border-border">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Amount</span>
                                    <span className="text-lg font-bold text-foreground">{formatCurrency(rental.total_amount)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 border-t border-border flex flex-wrap gap-2">
                                {/* Pre-Booking Actions - Start Rental & Cancel */}
                                {rental.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleStartRental(rental)}
                                            className="flex-1 min-w-[140px] px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 shadow-sm"
                                        >
                                            <CarIcon size={14} /> Start Rental
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(rental._id, rental.car_id?._id, 'cancelled')}
                                            className="px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center gap-1"
                                        >
                                            <XCircle size={14} /> Cancel
                                        </button>
                                    </>
                                )}

                                {/* Always Visible - View & Invoice */}
                                <button
                                    onClick={() => {
                                        setSelectedRentalForDetails(rental);
                                        setDetailsModalOpen(true);
                                    }}
                                    className="flex-1 min-w-[100px] px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                    <Eye size={14} /> View
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedRentalForInvoice(rental);
                                        setInvoiceModalOpen(true);
                                    }}
                                    className="flex-1 min-w-[100px] px-3 py-2 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                    <FileText size={14} /> Invoice
                                </button>

                                {/* Active Rental Actions - Charge, Complete, Cancel */}
                                {rental.status === 'active' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setSelectedRentalForCharge(rental);
                                                setChargeModalOpen(true);
                                            }}
                                            className="px-3 py-2 text-sm bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-medium transition-colors"
                                        >
                                            + Charge
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(rental._id, rental.car_id?._id, 'completed')}
                                            className="px-3 py-2 text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium transition-colors flex items-center gap-1"
                                        >
                                            <CheckCircle size={14} /> Complete
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(rental._id, rental.car_id?._id, 'cancelled')}
                                            className="px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center gap-1"
                                        >
                                            <XCircle size={14} /> Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Rentals Table - Desktop View (>= md breakpoint) */}
            <Card className="hidden md:block overflow-hidden p-0 border border-border shadow-sm">
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
                                                    rental.status === 'completed' ? 'secondary' :
                                                        rental.status === 'pending' ? 'default' : 'destructive'
                                            } className="shadow-none">
                                                {rental.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {/* Pre-booking / Start Rental Action */}
                                                {rental.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStartRental(rental)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-xs font-medium transition-colors shadow-sm"
                                                        title="Customer arrived? Upload docs and start"
                                                    >
                                                        <CarIcon size={14} /> Start Rental
                                                    </button>
                                                )}
                                                {/* Allow Cancel for Pending Rentals too */}
                                                {rental.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(rental._id, rental.car_id?._id, 'cancelled')}
                                                        className="text-destructive hover:text-destructive/80 p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                                                        title="Cancel Booking"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
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

            {/* Pagination Controls */}
            {!loading && rentals.length > 0 && (
                <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{rentals.length}</span> of <span className="font-medium">{pagination.total}</span> rentals
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchRentals(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-2 text-sm font-medium">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchRentals(pagination.page + 1)}
                            disabled={pagination.page >= pagination.pages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal - content passed to Modal component */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRentalId(null); }} title={editingRentalId ? "Complete Booking Details" : "New Booking"}>
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
                        label="Your Name (Operator)"
                        name="created_by"
                        value={formData.created_by}
                        onChange={handleChange}
                        placeholder="Who is creating this booking?"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Manual Price Calculator */}
                        <div className="col-span-1 sm:col-span-2 bg-secondary/30 p-3 rounded-lg border border-border space-y-3">
                            <div className="flex items-center gap-2">
                                <Calculator size={16} className="text-primary" />
                                <span className="text-sm font-medium">Price Calculator</span>
                            </div>
                            <div className="flex items-end gap-3">
                                <div className="flex-1">
                                    <Input
                                        label="Rate (₹/day)"
                                        type="number"
                                        value={calcRate}
                                        onChange={(e) => setCalcRate(e.target.value)}
                                        placeholder="Rate"
                                        className="h-9"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        label="Days"
                                        type="number"
                                        value={calcDays}
                                        onChange={(e) => setCalcDays(e.target.value)}
                                        placeholder="Days"
                                        className="h-9"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={calculateManualTotal}
                                    size="sm"
                                    className="mb-[2px] h-9"
                                >
                                    Calculate
                                </Button>
                            </div>
                        </div>

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
                            {formData.car_id && (
                                <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                                    {(() => {
                                        const selectedCar = cars.find(c => c.id === formData.car_id || c._id === formData.car_id);
                                        return selectedCar?.daily_rate
                                            ? `Rate: ₹${selectedCar.daily_rate}/day`
                                            : 'Daily rate not set for this car';
                                    })()}
                                </p>
                            )}
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
                            {submitting
                                ? (editingRentalId ? 'Updating...' : 'Creating Booking...')
                                : (editingRentalId ? 'Update Booking' : 'Confirm Booking')}
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
                onStatusUpdate={handleStatusUpdate}
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
