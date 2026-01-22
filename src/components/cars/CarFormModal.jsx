import React, { useState, useMemo } from 'react';
import { carsApi, rentalsApi } from '../../api/client';

import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { RefreshCw, AlertCircle, Building2, User } from 'lucide-react';
import toast from 'react-hot-toast';

const CarFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
    const defaultFormData = useMemo(() => ({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        created_by: '', // FIX #5: Operator accountability
        modified_by: '',
        status: 'available',
        daily_rate: 0,
        ownership_type: 'self',
        external_owner_name: '',
    }), []);

    // Use key-based reset pattern: when resetKey changes, form resets
    const resetKey = `${isOpen}-${initialData?.id || 'new'}`;

    // Initialize form data based on initialData or defaults
    const getInitialFormData = () => {
        const baseData = { ...defaultFormData, ...(initialData || {}) };
        if (initialData) {
            baseData.modified_by = '';
        }
        return baseData;
    };
    const [formData, setFormData] = useState(getInitialFormData);
    const [lastResetKey, setLastResetKey] = useState(resetKey);
    const [licensePlateError, setLicensePlateError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Deleted car detection state
    const [deletedCarFound, setDeletedCarFound] = useState(null);
    const [isCheckingDeleted, setIsCheckingDeleted] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // Reset form when modal opens/closes or initialData changes
    if (resetKey !== lastResetKey) {
        setFormData(getInitialFormData());
        setLastResetKey(resetKey);
        setLicensePlateError('');
        setDeletedCarFound(null);
    }

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Auto-capitalize license plate
        if (name === 'license_plate') {
            const upperValue = value.toUpperCase();
            setFormData(prev => ({ ...prev, [name]: upperValue }));
            setLicensePlateError(''); // Clear error when user types
            setDeletedCarFound(null); // Clear deleted car check
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Check for deleted car when license plate loses focus
    const handleLicensePlateBlur = async () => {
        const plate = formData.license_plate?.trim();

        // Skip if editing existing car or empty plate
        if (initialData || !plate || plate.length < 6) {
            return;
        }

        setIsCheckingDeleted(true);
        try {
            const result = await carsApi.checkDeletedByPlate(plate);
            if (result.exists && result.car) {
                setDeletedCarFound(result.car);
            } else {
                setDeletedCarFound(null);
            }
        } catch (error) {
            console.error('Error checking deleted car:', error);
        } finally {
            setIsCheckingDeleted(false);
        }
    };

    // Handle restoring the deleted car
    const handleRestoreDeletedCar = async () => {
        if (!deletedCarFound) return;

        setIsRestoring(true);
        try {
            await carsApi.restore(deletedCarFound.id);
            toast.success(`${deletedCarFound.make} ${deletedCarFound.model} restored successfully!`);
            setDeletedCarFound(null);
            onClose();
            // Trigger refresh
            if (onSubmit) {
                onSubmit(null, true); // Pass flag to indicate refresh needed
            }
        } catch (error) {
            console.error('Error restoring car:', error);
            toast.error('Failed to restore car');
        } finally {
            setIsRestoring(false);
        }
    };

    const validateLicensePlate = async (plate) => {
        if (!plate || plate.trim() === '') {
            return 'License plate is required';
        }

        // Check for valid format (letters and numbers, typically 6-12 chars like TS08FA2898)
        const plateRegex = /^[A-Z0-9]{6,12}$/;
        if (!plateRegex.test(plate)) {
            return 'Invalid format. Use letters and numbers only (e.g., TS08FA2898)';
        }

        try {
            // Check uniqueness via Backend API
            const { available, isDeleted, car } = await carsApi.checkAvailability(plate);

            if (!available) {
                // If editing, allow the same plate for this car
                if (initialData && initialData.license_plate === plate) {
                    return null;
                }

                if (isDeleted) {
                    // Logic to show deleted car alert is handled in onBlur,
                    // but we validation should block standard submission until they explicitly restore.
                    return 'This license plate belongs to a deleted vehicle. Please restore it.';
                }

                return 'This license plate is already registered to another vehicle';
            }
        } catch (error) {
            console.error('Error checking license plate:', error);
            // Allow submit if check fails? Or block?
            // Safer to block or just warn. Let's return generic error for now.
            return 'Error validating license plate. SERVER ERROR';
        }

        return null; // No error
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // Check for conflict: If setting to available but has active rental
            // Only applicable for existing cars (initialData exists)
            if (initialData && formData.status === 'available' && initialData.status !== 'available') {
                const activeRentals = await rentalsApi.getAll({
                    car_id: initialData.id || initialData._id,
                    status: 'active'
                });

                if (activeRentals && activeRentals.length > 0) {
                    const rental = activeRentals[0];
                    if (window.confirm(`This car has an active booking (Rental ID: #${String(rental._id).slice(0, 6)}). Do you want to cancel that booking and free the car?`)) {
                        await rentalsApi.update(rental._id, { status: 'cancelled' });
                        toast.success('Active rental cancelled successfully');
                    } else {
                        setIsSubmitting(false);
                        return;
                    }
                }
            }

            // Validate license plate uniqueness
            const plateError = await validateLicensePlate(formData.license_plate);
            if (plateError) {
                setLicensePlateError(plateError);
                setIsSubmitting(false);
                return;
            }

            // Ensure proper types
            const submissionData = {
                ...formData,
                daily_rate: Number(formData.daily_rate) || 0,
                year: Number(formData.year) || new Date().getFullYear()
            };

            await onSubmit(submissionData);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const operatorFieldName = initialData ? 'modified_by' : 'created_by';
    const operatorPlaceholder = initialData
        ? 'Who is updating this vehicle?'
        : 'Who is adding this vehicle?';

    const statusOptions = [
        { value: 'available', label: 'Available' },
        { value: 'rented', label: 'Rented' },
        { value: 'maintenance', label: 'In Maintenance' },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Vehicle' : 'Add New Vehicle'}
        >
            {/* Deleted Car Found Alert */}
            {deletedCarFound && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-medium text-amber-800">Previously Deleted Car Found</h4>
                            <p className="text-sm text-amber-700 mt-1">
                                A car with this license plate was previously removed from the fleet:
                            </p>
                            <div className="mt-2 p-2 bg-white rounded border border-amber-100">
                                <p className="font-medium text-foreground">
                                    {deletedCarFound.make} {deletedCarFound.model} ({deletedCarFound.year})
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    License: {deletedCarFound.license_plate}
                                </p>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleRestoreDeletedCar}
                                    disabled={isRestoring}
                                    className="bg-amber-600 hover:bg-amber-700"
                                >
                                    <RefreshCw className={`w-4 h-4 mr-1 ${isRestoring ? 'animate-spin' : ''}`} />
                                    {isRestoring ? 'Restoring...' : 'Restore This Car'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletedCarFound(null)}
                                >
                                    Add as New
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Make"
                        name="make"
                        value={formData.make}
                        onChange={handleChange}
                        placeholder="Toyota"
                        required
                    />
                    <Input
                        label="Model"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        placeholder="Camry"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Year"
                        name="year"
                        type="number"
                        value={formData.year}
                        onChange={handleChange}
                        placeholder="2024"
                        required
                    />
                    <div>
                        <Input
                            label="License Plate"
                            name="license_plate"
                            value={formData.license_plate}
                            onChange={handleChange}
                            onBlur={handleLicensePlateBlur}
                            placeholder="TS08FA2898"
                            required
                            error={licensePlateError}
                            className="uppercase"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {isCheckingDeleted ? (
                                <span className="text-primary">Checking...</span>
                            ) : (
                                'Format: Letters and numbers (e.g., TS08FA2898)'
                            )}
                        </p>
                    </div>
                </div>

                <Input
                    label="Your Name (Operator)"
                    name={operatorFieldName}
                    value={formData[operatorFieldName] || ''}
                    onChange={handleChange}
                    placeholder={operatorPlaceholder}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={statusOptions}
                    />
                    <Input
                        label="Daily Rate (₹)"
                        name="daily_rate"
                        type="number"
                        value={formData.daily_rate}
                        onChange={handleChange}
                        placeholder="2000"
                    />
                </div>

                {/* Ownership Section */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Car Ownership</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, ownership_type: 'self', external_owner_name: '' }))}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${formData.ownership_type === 'self'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-muted-foreground/50 text-muted-foreground'
                                }`}
                        >
                            <Building2 size={20} />
                            <div className="text-left">
                                <p className="font-medium text-sm">Organization</p>
                                <p className="text-xs opacity-70">Self-owned vehicle</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, ownership_type: 'external' }))}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${formData.ownership_type === 'external'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-muted-foreground/50 text-muted-foreground'
                                }`}
                        >
                            <User size={20} />
                            <div className="text-left">
                                <p className="font-medium text-sm">External Owner</p>
                                <p className="text-xs opacity-70">Third-party vehicle</p>
                            </div>
                        </button>
                    </div>

                    {/* External Owner Name - shown only when external is selected */}
                    {formData.ownership_type === 'external' && (
                        <Input
                            label="Owner Name"
                            name="external_owner_name"
                            value={formData.external_owner_name}
                            onChange={handleChange}
                            placeholder="e.g., Shekhar Sharma"
                            required
                        />
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !!deletedCarFound}>
                        {isSubmitting ? 'Saving...' : (initialData ? 'Update Vehicle' : 'Add Vehicle')}
                    </Button>
                </div>
            </form>
        </Modal >
    );
};

export default CarFormModal;
