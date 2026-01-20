import React from 'react';
import { Edit2, Trash2, Car, CheckCircle, AlertTriangle, Clock, UserCircle, BarChart2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';

const CarCard = ({ car, onEdit, onDelete, onStatusUpdate, onView }) => {
    const { formatCurrency } = useSettings();

    const getStatusConfig = (status) => {
        switch (status) {
            case 'available':
                return {
                    variant: 'success',
                    icon: CheckCircle,
                    label: 'Available',
                    bgClass: 'bg-emerald-50 border-emerald-200',
                    textClass: 'text-emerald-700'
                };
            case 'rented':
                return {
                    variant: 'info',
                    icon: Clock,
                    label: 'Rented',
                    bgClass: 'bg-blue-50 border-blue-200',
                    textClass: 'text-blue-700'
                };
            case 'maintenance':
                return {
                    variant: 'warning',
                    icon: AlertTriangle,
                    label: 'Maintenance',
                    bgClass: 'bg-amber-50 border-amber-200',
                    textClass: 'text-amber-700'
                };
            default:
                return {
                    variant: 'secondary',
                    icon: Car,
                    label: status,
                    bgClass: 'bg-gray-50 border-gray-200',
                    textClass: 'text-gray-700'
                };
        }
    };

    const statusConfig = getStatusConfig(car.status);
    const StatusIcon = statusConfig.icon;

    return (
        <Card className="p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30">
            {/* Image Area */}
            <div className="h-44 bg-gradient-to-br from-muted to-secondary relative overflow-hidden">
                {car.image_url ? (
                    <img
                        src={car.image_url}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Car size={48} className="mx-auto text-muted-foreground/50" />
                            <span className="text-xs text-muted-foreground mt-2 block">No Image</span>
                        </div>
                    </div>
                )}

                {/* Status Badge - Top Right */}
                <div className={`absolute top-3 right-3 ${statusConfig.bgClass} border rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm`}>
                    <StatusIcon size={12} className={statusConfig.textClass} />
                    <span className={`text-xs font-semibold ${statusConfig.textClass}`}>
                        {statusConfig.label}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4">
                {/* Vehicle Info */}
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-base font-bold text-foreground">
                            {car.make} {car.model}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {car.license_plate} • {car.year}
                        </p>
                        {car.ownership_type === 'external' && car.external_owner_name && (
                            <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
                                <UserCircle size={12} />
                                {car.external_owner_name}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                            {formatCurrency(car.daily_rate)}
                        </p>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">per day</span>
                    </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    {/* Status Toggle Button */}
                    <div>
                        {car.status === 'available' ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-400"
                                onClick={() => onStatusUpdate(car.id, 'maintenance')}
                            >
                                <AlertTriangle size={14} className="mr-1.5" />
                                Set Maintenance
                            </Button>
                        ) : car.status === 'maintenance' ? (
                            <Button
                                size="sm"
                                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => onStatusUpdate(car.id, 'available')}
                            >
                                <CheckCircle size={14} className="mr-1.5" />
                                Enable Vehicle
                            </Button>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">
                                <Clock size={12} />
                                Currently Rented
                            </span>
                        )}
                    </div>

                    {/* Edit/Delete Actions */}
                    <div className="flex gap-1">
                        <button
                            onClick={() => onView && onView(car)}
                            className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Analytics"
                        >
                            <BarChart2 size={16} />
                        </button>
                        <button
                            onClick={() => onEdit(car)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                            title="Edit Vehicle"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(car.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title="Delete Vehicle"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default CarCard;
