import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
import { carsApi, uploadApi } from '../api/client';
import { formatDate } from '../utils/date'; // Added import
import { Shield, Search, Calendar, Car, Upload, FileText, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

const Insurance = () => {
    // Removed unused formatCurrency
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedCar, setSelectedCar] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        insurance_expiry_date: '',
        insurance_provider: '',
        insurance_policy_number: '',
        insurance_document_url: ''
    });

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        try {
            setLoading(true);
            const data = await carsApi.getAll(); // API returns array directly
            setCars(data || []);
        } catch (error) {
            console.error('Error fetching cars:', error);
            // alert('Failed to fetch cars. Please try refreshing.'); // Optional
        } finally {
            setLoading(false);
        }
    };

    const getInsuranceStatus = (expiryDate) => {
        if (!expiryDate) return { status: 'not_set', label: 'Not Set', variant: 'secondary' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            return { status: 'expired', label: 'Expired', variant: 'destructive', days: Math.abs(daysUntilExpiry) };
        } else if (daysUntilExpiry <= 30) {
            return { status: 'expiring', label: 'Expiring Soon', variant: 'warning', days: daysUntilExpiry };
        } else {
            return { status: 'valid', label: 'Valid', variant: 'success', days: daysUntilExpiry };
        }
    };

    const openEditModal = (car) => {
        setSelectedCar(car);
        setFormData({
            insurance_expiry_date: car.insurance_expiry_date || '',
            insurance_provider: car.insurance_provider || '',
            insurance_policy_number: car.insurance_policy_number || '',
            insurance_document_url: car.insurance_document_url || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCar || submitting) return;

        setSubmitting(true);
        try {
            const carId = selectedCar.id || selectedCar._id;
            await carsApi.update(carId, formData);

            setIsModalOpen(false);
            fetchCars();
        } catch (error) {
            console.error('Error updating insurance:', error);
            alert('Failed to update insurance details');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDocumentUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const response = await uploadApi.uploadFile(file);
            const publicUrl = response.url;
            setFormData(prev => ({ ...prev, insurance_document_url: publicUrl }));
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload document');
        }
    };

    // Filter cars
    const filteredCars = cars.filter(car => {
        const matchesSearch =
            car.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            car.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            car.license_plate?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filterStatus === 'all') return true;

        const status = getInsuranceStatus(car.insurance_expiry_date);
        return status.status === filterStatus;
    });

    // Stats
    const stats = {
        expired: cars.filter(c => getInsuranceStatus(c.insurance_expiry_date).status === 'expired').length,
        expiring: cars.filter(c => getInsuranceStatus(c.insurance_expiry_date).status === 'expiring').length,
        valid: cars.filter(c => getInsuranceStatus(c.insurance_expiry_date).status === 'valid').length,
        notSet: cars.filter(c => getInsuranceStatus(c.insurance_expiry_date).status === 'not_set').length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Insurance</h1>
                    <p className="text-muted-foreground mt-1">Manage vehicle insurance and track renewals.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card
                    className={`p-4 cursor-pointer transition-all ${filterStatus === 'expired' ? 'ring-2 ring-red-500' : ''}`}
                    onClick={() => setFilterStatus(filterStatus === 'expired' ? 'all' : 'expired')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <AlertTriangle size={20} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                            <p className="text-xs text-muted-foreground">Expired</p>
                        </div>
                    </div>
                </Card>
                <Card
                    className={`p-4 cursor-pointer transition-all ${filterStatus === 'expiring' ? 'ring-2 ring-amber-500' : ''}`}
                    onClick={() => setFilterStatus(filterStatus === 'expiring' ? 'all' : 'expiring')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{stats.expiring}</p>
                            <p className="text-xs text-muted-foreground">Expiring Soon</p>
                        </div>
                    </div>
                </Card>
                <Card
                    className={`p-4 cursor-pointer transition-all ${filterStatus === 'valid' ? 'ring-2 ring-emerald-500' : ''}`}
                    onClick={() => setFilterStatus(filterStatus === 'valid' ? 'all' : 'valid')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">{stats.valid}</p>
                            <p className="text-xs text-muted-foreground">Valid</p>
                        </div>
                    </div>
                </Card>
                <Card
                    className={`p-4 cursor-pointer transition-all ${filterStatus === 'not_set' ? 'ring-2 ring-gray-500' : ''}`}
                    onClick={() => setFilterStatus(filterStatus === 'not_set' ? 'all' : 'not_set')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Shield size={20} className="text-gray-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-600">{stats.notSet}</p>
                            <p className="text-xs text-muted-foreground">Not Set</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <Card className="p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search by vehicle name or plate..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    {filterStatus !== 'all' && (
                        <Button variant="ghost" onClick={() => setFilterStatus('all')}>
                            <X size={16} className="mr-1" /> Clear Filter
                        </Button>
                    )}
                </div>
            </Card>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">VEHICLE</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">PROVIDER</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">POLICY NO.</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">EXPIRY DATE</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">STATUS</th>
                                <th className="text-left p-4 font-medium text-muted-foreground text-sm">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-muted-foreground">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredCars.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <Shield size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                                        <p className="text-muted-foreground">No vehicles found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCars.map((car) => {
                                    const insuranceStatus = getInsuranceStatus(car.insurance_expiry_date);
                                    return (
                                        <tr key={car.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Car size={18} className="text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{car.make} {car.model}</p>
                                                        <p className="text-xs text-muted-foreground">{car.license_plate}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-foreground">
                                                {car.insurance_provider || <span className="text-muted-foreground">—</span>}
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-sm text-foreground">
                                                    {car.insurance_policy_number || <span className="text-muted-foreground">—</span>}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-foreground">
                                                    <Calendar size={14} className="text-muted-foreground" />
                                                    {formatDate(car.insurance_expiry_date)}
                                                </div>
                                                {insuranceStatus.days !== undefined && insuranceStatus.status !== 'valid' && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {insuranceStatus.status === 'expired'
                                                            ? `${insuranceStatus.days} days ago`
                                                            : `${insuranceStatus.days} days left`
                                                        }
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={insuranceStatus.variant}>
                                                    {insuranceStatus.label}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openEditModal(car)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    {car.insurance_document_url && (
                                                        <a
                                                            href={car.insurance_document_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Button size="sm" variant="ghost">
                                                                <FileText size={14} />
                                                            </Button>
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Insurance - ${selectedCar?.make} ${selectedCar?.model}`}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Insurance Provider"
                        value={formData.insurance_provider}
                        onChange={(e) => setFormData(prev => ({ ...prev, insurance_provider: e.target.value }))}
                        placeholder="e.g. ICICI Lombard, New India Assurance"
                    />

                    <Input
                        label="Policy Number"
                        value={formData.insurance_policy_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, insurance_policy_number: e.target.value }))}
                        placeholder="e.g. POL123456789"
                    />

                    <Input
                        label="Expiry Date"
                        type="date"
                        value={formData.insurance_expiry_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, insurance_expiry_date: e.target.value }))}
                        required
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Insurance Document</label>
                        {formData.insurance_document_url ? (
                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                <FileText size={16} className="text-primary" />
                                <span className="text-sm text-foreground flex-1 truncate">Document uploaded</span>
                                <a
                                    href={formData.insurance_document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary text-sm hover:underline"
                                >
                                    View
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, insurance_document_url: '' }))}
                                    className="text-destructive text-sm hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                                <Upload size={18} className="text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Upload PDF or Image</span>
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={handleDocumentUpload}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" isLoading={submitting}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Insurance;
