import React, { useState, useEffect, useCallback } from 'react';
import { carsApi, rentalsApi } from '../api/client';
import { Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import CarCard from '../components/cars/CarCard';
import CarFormModal from '../components/cars/CarFormModal';
import DeleteConfirmationModal from '../components/cars/DeleteConfirmationModal';
import Button from '../components/ui/Button';
import CarDetailsModal from '../components/cars/CarDetailsModal';
import { useSettings } from '../context/SettingsContext';

const Cars = () => {
    const [cars, setCars] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCar, setEditingCar] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Analytics Modal State
    const [analyticsModal, setAnalyticsModal] = useState({
        show: false,
        car: null
    });

    const settingsContext = useSettings();
    const formatCurrency = settingsContext?.formatCurrency;

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({
        show: false,
        carId: null,
        rentalCount: 0,
        loading: false
    });

    // Memoized fetch function to prevent unnecessary re-renders lint issues
    const fetchCars = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const response = await carsApi.getAll({
                page,
                limit: 12, // Grid view
                search: searchQuery
            });

            if (response && response.cars) {
                setCars(response.cars);
                setPagination(response.pagination);
            } else if (Array.isArray(response)) {
                setCars(response);
                setPagination({ page: 1, limit: response.length, total: response.length, pages: 1 });
            } else {
                setCars([]);
            }
        } catch (error) {
            console.error('Error fetching cars:', error.message);
            toast.error('Failed to load cars');
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // Initial load and Debounced Search
    // Since fetchCars depends on searchQuery, it changes updates whenever query updates.
    // This effect handles both initial load (searchQuery='') and updates.
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCars(1);
        }, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [fetchCars]);

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
            const operatorName = window.prompt('Enter your name to update vehicle status:');
            if (!operatorName) {
                return;
            }
            await carsApi.update(id, { status: newStatus, modified_by: operatorName.trim() });
            // Optimistic update
            setCars(cars.map(c => c.id === id ? { ...c, status: newStatus } : c));
            toast.success(`Car marked as ${newStatus}`);
        } catch (error) {
            console.error('Status update error:', error);
            toast.error('Failed to update status');
        }
    };

    // --- Delete Logic (Soft Delete - preserves rental history) ---
    const initiateDelete = async (id) => {
        setDeleteModal(prev => ({ ...prev, loading: true }));
        try {
            // Check for rentals (for informational purpose only - shown in modal)
            const response = await rentalsApi.getAll({ car_id: id });
            const rentals = response.rentals || (Array.isArray(response) ? response : []);
            const count = rentals.length;

            setDeleteModal({
                show: true,
                carId: id,
                rentalCount: count,
                loading: false
            });
        } catch (error) {
            console.error('Check error:', error);
            // Even if we can't count rentals, still show delete modal
            setDeleteModal({
                show: true,
                carId: id,
                rentalCount: 0,
                loading: false
            });
        }
    };

    const confirmDelete = async () => {
        const { carId } = deleteModal;
        setDeleteModal(prev => ({ ...prev, loading: true }));

        try {
            // Soft delete the car - rental history is preserved!
            await carsApi.delete(carId);

            toast.success('Vehicle removed from fleet. Rental history preserved.');
            fetchCars();
            setDeleteModal({ show: false, carId: null, rentalCount: 0, loading: false });
        } catch (error) {
            console.error('[Delete] Operation failed:', error);
            toast.error(error.message || 'Failed to delete vehicle');
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Data filtered on backend
    const filteredCars = cars;

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
                            // Assuming I will add this prop to CarCard
                            onView={() => setAnalyticsModal({ show: true, car })}
                            onStatusUpdate={handleStatusUpdate}
                        />
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && cars.length > 0 && (
                <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{cars.length}</span> of <span className="font-medium">{pagination.total}</span> cars
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchCars(pagination.page - 1)}
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
                            onClick={() => fetchCars(pagination.page + 1)}
                            disabled={pagination.page >= pagination.pages}
                        >
                            Next
                        </Button>
                    </div>
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
                loading={deleteModal.loading}
            />

            <CarDetailsModal
                isOpen={analyticsModal.show}
                onClose={() => setAnalyticsModal({ show: false, car: null })}
                car={analyticsModal.car}
                formatCurrency={formatCurrency}
            />
        </div >
    );
};

export default Cars;
