import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
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
            const { data, error } = await supabase
                .from('cars')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCars(data);
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
                const { error } = await supabase
                    .from('cars')
                    .update(formData)
                    .eq('id', editingCar.id);
                if (error) throw error;
                toast.success('Vehicle updated successfully');
            } else {
                const { error } = await supabase
                    .from('cars')
                    .insert([formData]);
                if (error) throw error;
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
            const { error } = await supabase
                .from('cars')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

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
            const { count, error } = await supabase
                .from('rentals')
                .select('*', { count: 'exact', head: true })
                .eq('car_id', id);

            if (error) throw error;

            setDeleteModal({
                show: true,
                carId: id,
                rentalCount: count,
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
                const { error: deleteRentalsError } = await supabase
                    .from('rentals')
                    .delete()
                    .eq('car_id', carId);

                if (deleteRentalsError) {
                    console.error('[Delete] Failed to delete rentals:', deleteRentalsError);
                    throw new Error(`Failed to remove rental records: ${deleteRentalsError.message}`);
                }
                console.info(`[Delete] Successfully removed ${rentalCount} rentals`);
            }

            // Step 2: Delete the car
            console.info(`[Delete] Removing car ${carId}`);
            const { error: deleteCarError } = await supabase
                .from('cars')
                .delete()
                .eq('id', carId);

            if (deleteCarError) {
                // Log critical error - rentals were deleted but car deletion failed
                console.error('[Delete] CRITICAL: Car deletion failed after rentals were removed!', {
                    carId,
                    rentalsDeleted: rentalCount,
                    error: deleteCarError
                });
                throw new Error(`Failed to remove vehicle: ${deleteCarError.message}. Note: ${rentalCount} rental records were already removed.`);
            }

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
