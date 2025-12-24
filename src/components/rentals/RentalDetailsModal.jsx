import React from 'react';
import { formatDate } from '../../utils/date';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { Phone, MapPin, Calendar, Clock, CreditCard, IdCard, Car, DollarSign, ExternalLink } from 'lucide-react';

/**
 * DocumentCard - Displays identity document with preview
 */
const DocumentCard = ({ title, number, imageUrl, icon: IconComponent }) => (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
            <IconComponent size={16} className="text-primary" />
            <span className="font-medium text-foreground">{title}</span>
        </div>
        {number ? (
            <p className="text-sm text-muted-foreground font-mono">{number}</p>
        ) : (
            <p className="text-sm text-muted-foreground italic">Not provided</p>
        )}
        {imageUrl ? (
            <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative group"
            >
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-32 object-cover rounded-md border border-border"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                    <span className="text-white text-sm flex items-center gap-1">
                        <ExternalLink size={14} /> View Full
                    </span>
                </div>
            </a>
        ) : (
            <div className="w-full h-32 bg-muted rounded-md border border-dashed border-border flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No photo uploaded</span>
            </div>
        )}
    </div>
);

/**
 * RentalDetailsModal - Shows full rental details including customer documents
 */
const RentalDetailsModal = ({ isOpen, onClose, rental, formatCurrency }) => {
    if (!rental) return null;

    const formatTime = (time) => {
        if (!time) return '--:--';
        return time;
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'pending': return 'warning';
            case 'completed': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'secondary';
        }
    };



    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Rental Details"
            size="lg"
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Header with Status */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            {rental.customer_name}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone size={12} /> {rental.customer_phone}
                        </p>
                    </div>
                    <Badge variant={getStatusVariant(rental.status)} size="lg">
                        {rental.status?.charAt(0).toUpperCase() + rental.status?.slice(1)}
                    </Badge>
                </div>

                {/* Vehicle & Trip Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Vehicle</span>
                        <p className="font-medium text-foreground flex items-center gap-2">
                            <Car size={14} className="text-primary" />
                            {rental.cars?.make} {rental.cars?.model}
                        </p>
                        <p className="text-xs text-muted-foreground">{rental.cars?.license_plate}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Amount</span>
                        <p className="font-bold text-lg text-emerald-600 flex items-center gap-1">
                            <DollarSign size={16} />
                            {formatCurrency(rental.total_amount)}
                        </p>
                    </div>
                </div>

                {/* Trip Details */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-foreground text-sm">Trip Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-emerald-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">From</p>
                                <p className="text-foreground">{rental.from_location || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-orange-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">To</p>
                                <p className="text-foreground">{rental.to_location || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Calendar size={14} className="text-primary mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Start</p>
                                <p className="text-foreground">{formatDate(rental.start_date)}</p>
                                <p className="text-xs text-muted-foreground">{formatTime(rental.start_time)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Calendar size={14} className="text-primary mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">End</p>
                                <p className="text-foreground">{formatDate(rental.end_date)}</p>
                                <p className="text-xs text-muted-foreground">{formatTime(rental.end_time)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Identity Documents */}
                <div className="space-y-3">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                        <IdCard size={16} className="text-primary" />
                        Identity Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <DocumentCard
                            title="PAN Card"
                            number={rental.pan_number}
                            imageUrl={rental.pan_image_url}
                            icon={CreditCard}
                        />
                        <DocumentCard
                            title="Aadhar Card"
                            number={rental.aadhar_number}
                            imageUrl={rental.aadhar_image_url}
                            icon={IdCard}
                        />
                        <DocumentCard
                            title="Driving License"
                            number={rental.license_number}
                            imageUrl={rental.license_image_url}
                            icon={Car}
                        />
                    </div>
                </div>

                {/* Timestamps */}
                <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                    <p>Created: {formatDate(rental.created_at, true)}</p>
                </div>
            </div>
        </Modal>
    );
};

export default RentalDetailsModal;
