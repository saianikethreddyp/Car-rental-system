import React, { useState, useMemo } from 'react';
import { carsApi } from '../../api/client';
import { supabase } from '../../supabaseClient';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CarFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
    const defaultFormData = useMemo(() => ({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        status: 'available',
        daily_rate: '',
    }), []);

    // Use key-based reset pattern: when resetKey changes, form resets
    const resetKey = `${isOpen}-${initialData?.id || 'new'}`;

    // Initialize form data based on initialData or defaults
    const getInitialFormData = () => initialData ? initialData : defaultFormData;
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

        // Check uniqueness in database (active cars only)
        const { data, error } = await supabase
            .from('cars')
            .select('id, is_deleted')
            .eq('license_plate', plate)
            .maybeSingle();

        if (error) {
            console.error('Error checking license plate:', error);
            return 'Error validating license plate';
        }

        // If editing, allow the same plate for this car
        if (data && initialData?.id !== data.id && !data.is_deleted) {
            return 'This license plate is already registered to another vehicle';
        }

        return null; // No error
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // Validate license plate uniqueness
            const plateError = await validateLicensePlate(formData.license_plate);
            if (plateError) {
                setLicensePlateError(plateError);
                setIsSubmitting(false);
                return;
            }

            await onSubmit(formData);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                                    License: {deletedCarFound.license_plate} • Rate: ₹{deletedCarFound.daily_rate}/day
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
            )}

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

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Daily Rate"
                        name="daily_rate"
                        type="number"
                        value={formData.daily_rate}
                        onChange={handleChange}
                        placeholder="2500"
                        required
                    />
                    <Select
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        options={statusOptions}
                    />
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
        </Modal>
    );
};

export default CarFormModal;
