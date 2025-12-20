import React, { useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';

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

    // Reset form when modal opens/closes or initialData changes
    if (resetKey !== lastResetKey) {
        setFormData(getInitialFormData());
        setLastResetKey(resetKey);
        setLicensePlateError('');
    }

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Auto-capitalize license plate
        if (name === 'license_plate') {
            const upperValue = value.toUpperCase();
            setFormData(prev => ({ ...prev, [name]: upperValue }));
            setLicensePlateError(''); // Clear error when user types
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateLicensePlate = async (plate) => {
        if (!plate || plate.trim() === '') {
            return 'License plate is required';
        }

        // Check for valid format (letters and numbers, typically 8-12 chars like TS08FA2898)
        const plateRegex = /^[A-Z0-9]{6,12}$/;
        if (!plateRegex.test(plate)) {
            return 'Invalid format. Use letters and numbers only (e.g., TS08FA2898)';
        }

        // Check uniqueness in database
        const { data, error } = await supabase
            .from('cars')
            .select('id')
            .eq('license_plate', plate)
            .maybeSingle();

        if (error) {
            console.error('Error checking license plate:', error);
            return 'Error validating license plate';
        }

        // If editing, allow the same plate for this car
        if (data && initialData?.id !== data.id) {
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
                            placeholder="TS08FA2898"
                            required
                            error={licensePlateError}
                            className="uppercase"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Format: Letters and numbers (e.g., TS08FA2898)
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
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (initialData ? 'Update Vehicle' : 'Add Vehicle')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CarFormModal;

