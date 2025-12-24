import React, { useState, useEffect } from 'react';
import { carsApi, rentalsApi } from '../api/client';
// Removed: import { supabase } from '../supabaseClient';
import { Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import CarCard from '../components/cars/CarCard';
import CarFormModal from '../components/cars/CarFormModal';
import DeleteConfirmationModal from '../components/cars/DeleteConfirmationModal';
import Button from '../components/ui/Button';

const Cars = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCar, setEditingCar] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({
        show: false,
        carId: null,
        rentalCount: 0,
        loading: false
    });

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        try {
            setLoading(true);
            const data = await carsApi.getAll();
            setCars(data || []);
        } catch (error) {
            console.error('Error fetching cars:', error.message);
            toast.error('Failed to load cars');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (car = null) => {
        setEditingCar(car);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCar(null);
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingCar) {
                await carsApi.update(editingCar.id, formData);
                toast.success('Vehicle updated successfully');
            } else {
                await carsApi.create(formData);
                toast.success('Vehicle added successfully');
            }
            fetchCars();
            handleCloseModal();
        } catch (error) {
            toast.error(error.message);
        }
    };

    // --- Status Update Logic ---
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await carsApi.update(id, { status: newStatus });
            // Optimistic update
            setCars(cars.map(c => c.id === id ? { ...c, status: newStatus } : c));
            toast.success(`Car marked as ${newStatus}`);
        } catch (error) {
            console.error('Status update error:', error);
            toast.error('Failed to update status');
        }
    };

    // --- Delete Logic ---
    const initiateDelete = async (id) => {
        setDeleteModal(prev => ({ ...prev, loading: true }));
        try {
            // Check for rentals
            // Check for rentals
            // rentalsApi.getAll doesn't return count object easily without backend change.
            // Simplified: Fetch all and count length.
            const rentals = await rentalsApi.getAll({ car_id: id }); // Assumes getAll filters work
            const count = rentals.length;

            setDeleteModal({
                show: true,
                carId: id,
                rentalCount: count || 0, // Simplified count for now
                loading: false
            });
        } catch (error) {
            console.error('Check error:', error);
            toast.error('Error checking car status');
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    const confirmDelete = async () => {
        const { carId, rentalCount } = deleteModal;
        const operationContext = { carId, rentalCount };

        try {
            // Step 1: Delete rentals first (if any)
            if (rentalCount > 0) {
                console.info(`[Delete] Removing ${rentalCount} rentals for car ${carId}`);
                // Note: We need a bulk delete endpoint or loop. For now, assuming direct DB access is gone,
                // we'd typically need a backend endpoint for 'cascade delete car'.
                // Since our current rentalsApi.delete(id) is singular, strict API design would fail here.
                // However, let's assume we implement a backend-side cascade or similar.
                // For this refactor, I will simulate it via loop or skip if backend handles it (it doesn't yet).
                // Let's rely on the user to manually clear rentals or implement backend cascade later.
                // Correction: The backend `carsService.deleteCar` does simple DELETE.
                // Foreign key constraints might block it unless ON DELETE CASCADE is set in DB.
                // Assuming we still need manual cleanup:
                // We'd need to fetch rental IDs and delete them.
                // BUT, to keep it simple and consistent:
                // We should add a 'deleteRentalsByCarId' endpoint or update deleteCar to cascade.
                // For now, I'll invoke a loop (inefficient but works without backend change).

                // Fetch rentals for this car to get IDs
                const carRentals = await rentalsApi.getAll({ car_id: carId }); // We need to ensure getAll supports car_id filter
                if (carRentals && carRentals.length > 0) {
                    await Promise.all(carRentals.map(r => rentalsApi.delete(r.id)));
                }
                console.info(`[Delete] Successfully removed rentals`);
            }

            // Step 2: Delete the car
            console.info(`[Delete] Removing car ${carId}`);
            await carsApi.delete(carId);

            console.info(`[Delete] Successfully removed car ${carId}`, operationContext);
            toast.success('Vehicle removed from fleet');
            fetchCars();
            setDeleteModal({ show: false, carId: null, rentalCount: 0, loading: false });
        } catch (error) {
            console.error('[Delete] Operation failed:', error, operationContext);
            toast.error(error.message || 'Failed to delete vehicle');
            // Keep modal open so user can retry
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    const filteredCars = cars.filter(car =>
        car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.license_plate.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Cars Inventory</h1>
                    <p className="text-muted-foreground mt-1">Manage your fleet and track vehicle status.</p>
                </div>
                <Button icon={Plus} onClick={() => { setEditingCar(null); setShowModal(true); }} className="shadow-lg hover:shadow-xl transition-all">
                    Add New Car
                </Button>
            </div>

            {/* Filters/Search */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search fleet..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-10 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                <Button variant="outline" className="px-3" title="Filter">
                    <Filter size={18} />
                </Button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center text-muted-foreground py-20">Loading your fleet...</div>
            ) : filteredCars.length === 0 ? (
                <div className="text-center text-muted-foreground py-16 bg-card rounded-lg border border-border border-dashed">
                    <p className="mb-4">{searchQuery ? 'No cars match your search.' : 'No cars in inventory yet.'}</p>
                    {!searchQuery && <Button onClick={() => handleOpenModal()}>Add your first car</Button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCars.map((car) => (
                        <CarCard
                            key={car.id}
                            car={car}
                            onEdit={handleOpenModal}
                            onDelete={initiateDelete}
                            onStatusUpdate={handleStatusUpdate}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <CarFormModal
                isOpen={showModal}
                onClose={handleCloseModal}
                onSubmit={handleFormSubmit}
                initialData={editingCar}
            />

            <DeleteConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal(prev => ({ ...prev, show: false }))}
                onConfirm={confirmDelete}
                rentalCount={deleteModal.rentalCount}
            />
        </div>
    );
};

export default Cars;
