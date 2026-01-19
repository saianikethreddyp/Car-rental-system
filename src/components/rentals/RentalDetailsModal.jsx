import React from 'react';
import { formatDate } from '../../utils/date';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { Phone, MapPin, Calendar, Clock, CreditCard, IdCard, Car, ExternalLink } from 'lucide-react';

/**
 * DocumentCard - Displays identity document with front/back previews
 */
const DocumentCard = ({ title, number, frontUrl, backUrl, icon: IconComponent }) => (
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
        <div className="grid grid-cols-2 gap-2">
            {/* Front Image */}
            <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Front</span>
                {frontUrl ? (
                    <a
                        href={frontUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative group mt-1"
                    >
                        <img
                            src={frontUrl}
                            alt={`${title} Front`}
                            className="w-full h-20 object-cover rounded-md border border-border"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                            <span className="text-white text-[10px] flex items-center gap-1">
                                <ExternalLink size={10} /> View
                            </span>
                        </div>
                    </a>
                ) : (
                    <div className="w-full h-20 bg-muted rounded-md border border-dashed border-border flex items-center justify-center mt-1">
                        <span className="text-[9px] text-muted-foreground">No photo</span>
                    </div>
                )}
            </div>
            {/* Back Image */}
            <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Back</span>
                {backUrl ? (
                    <a
                        href={backUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative group mt-1"
                    >
                        <img
                            src={backUrl}
                            alt={`${title} Back`}
                            className="w-full h-20 object-cover rounded-md border border-border"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                            <span className="text-white text-[10px] flex items-center gap-1">
                                <ExternalLink size={10} /> View
                            </span>
                        </div>
                    </a>
                ) : (
                    <div className="w-full h-20 bg-muted rounded-md border border-dashed border-border flex items-center justify-center mt-1">
                        <span className="text-[9px] text-muted-foreground">No photo</span>
                    </div>
                )}
            </div>
        </div>
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
                        {(rental.secondary_phone || rental.parent_phone) && (
                            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                {rental.secondary_phone && (
                                    <span>Alt: {rental.secondary_phone}</span>
                                )}
                                {rental.parent_phone && (
                                    <span>Parent: {rental.parent_phone}</span>
                                )}
                            </div>
                        )}
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
                        <p className="font-bold text-lg text-emerald-600">
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

                {/* Charges Breakdown */}
                {rental.charges && rental.charges.length > 0 && (
                    <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-4 space-y-3 border border-amber-200/50 dark:border-amber-800/50">
                        <h4 className="font-medium text-foreground flex items-center gap-2 text-sm">
                            💰 Charges Breakdown
                        </h4>
                        <div className="space-y-2">
                            {rental.charges.map((charge, index) => (
                                <div key={index} className="flex justify-between items-start text-sm">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="capitalize font-medium text-foreground">
                                                {charge.type === 'base' && '📋'}
                                                {charge.type === 'extension' && '📅'}
                                                {charge.type === 'damage' && '🔧'}
                                                {charge.type === 'fuel' && '⛽'}
                                                {charge.type === 'fine' && '📋'}
                                                {charge.type === 'discount' && '💸'}
                                                {charge.type === 'other' && '📝'}
                                                {' '}{charge.type}
                                            </span>
                                            {charge.payment_method && charge.payment_method !== 'pending' && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    {charge.payment_method === 'upi' ? 'UPI' :
                                                        charge.payment_method === 'bank_transfer' ? 'Bank' :
                                                            charge.payment_method.charAt(0).toUpperCase() + charge.payment_method.slice(1)}
                                                </span>
                                            )}
                                            {charge.payment_method === 'pending' && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        {charge.note && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{charge.note}</p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(charge.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`font-semibold ${charge.amount < 0 ? 'text-red-600' : 'text-foreground'}`}>
                                        {charge.amount < 0 ? '-' : ''}₹{Math.abs(charge.amount).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/50 flex justify-between items-center">
                            <span className="font-medium text-foreground">Total</span>
                            <span className="font-bold text-lg text-emerald-600">
                                ₹{rental.total_amount?.toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}

                {/* Identity Documents */}
                <div className="space-y-3">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                        <IdCard size={16} className="text-primary" />
                        Identity & Vehicle Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DocumentCard
                            title="Aadhar Card"
                            number={rental.aadhar_number}
                            frontUrl={rental.aadhar_front_image_url}
                            backUrl={rental.aadhar_back_image_url}
                            icon={IdCard}
                        />
                        <DocumentCard
                            title="PAN Card"
                            number={rental.pan_number}
                            frontUrl={rental.pan_front_image_url}
                            backUrl={rental.pan_back_image_url}
                            icon={CreditCard}
                        />
                        <DocumentCard
                            title="Driving License"
                            number={rental.license_number}
                            frontUrl={rental.license_front_image_url}
                            backUrl={rental.license_back_image_url}
                            icon={IdCard}
                        />
                        <DocumentCard
                            title="RC (Registration Certificate)"
                            number={rental.rc_number}
                            frontUrl={rental.rc_front_image_url}
                            backUrl={rental.rc_back_image_url}
                            icon={Car}
                        />
                    </div>
                </div>

                {/* Car Photos */}
                {rental.car_photos && rental.car_photos.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                            <Car size={16} className="text-primary" />
                            Car Photos
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                            {rental.car_photos.map((url, index) => (
                                <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative group aspect-square rounded-lg overflow-hidden border border-border"
                                >
                                    <img
                                        src={url}
                                        alt={`Car photo ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-xs">View</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                    <p>Created: {formatDate(rental.created_at, true)}</p>
                </div>
            </div>
        </Modal>
    );
};

export default RentalDetailsModal;
