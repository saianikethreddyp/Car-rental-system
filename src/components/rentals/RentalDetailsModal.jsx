import React from 'react';
import { formatDate } from '../../utils/date';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { Phone, MapPin, Calendar, Clock, CreditCard, IdCard, Car, ExternalLink } from 'lucide-react';
import { getImageUrl } from '../../utils/image';

/**
 * DocumentCard - Displays identity document with front/back previews
 */
const DocumentCard = ({ title, number, frontUrl, backUrl, onView }) => (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
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
                    <div
                        onClick={() => onView(getImageUrl(frontUrl))}
                        className="block relative group mt-1 cursor-pointer"
                    >
                        <img
                            src={getImageUrl(frontUrl)}
                            alt={`${title} Front`}
                            className="w-full h-20 object-cover rounded-md border border-border"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                            <span className="text-white text-[10px] flex items-center gap-1">
                                <ExternalLink size={10} /> View
                            </span>
                        </div>
                    </div>
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
                    <div
                        onClick={() => onView(getImageUrl(backUrl))}
                        className="block relative group mt-1 cursor-pointer"
                    >
                        <img
                            src={getImageUrl(backUrl)}
                            alt={`${title} Back`}
                            className="w-full h-20 object-cover rounded-md border border-border"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                            <span className="text-white text-[10px] flex items-center gap-1">
                                <ExternalLink size={10} /> View
                            </span>
                        </div>
                    </div>
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
const RentalDetailsModal = ({ isOpen, onClose, rental, formatCurrency, onStatusUpdate }) => {
    const [previewImage, setPreviewImage] = React.useState(null);

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
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant={getStatusVariant(rental.status)} size="lg">
                            {rental.status?.charAt(0).toUpperCase() + rental.status?.slice(1)}
                        </Badge>

                        {(rental.status === 'active' || rental.status === 'pending') && (
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to CANCEL this booking?')) {
                                        onStatusUpdate(rental._id || rental.id, rental.car_id?._id || rental.car_id, 'cancelled');
                                        onClose();
                                    }
                                }}
                                className="text-xs text-red-600 hover:text-red-800 underline font-medium"
                            >
                                Cancel Booking
                            </button>
                        )}
                    </div>
                </div>

                {/* Vehicle & Trip Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Vehicle</span>
                        <p className="font-medium text-foreground flex items-center gap-2">
                            <Car size={14} className="text-primary" />
                            {rental.car_id?.make} {rental.car_id?.model}
                        </p>
                        <p className="text-xs text-muted-foreground">{rental.car_id?.license_plate}</p>
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
                            onView={setPreviewImage}
                        />
                        <DocumentCard
                            title="PAN Card"
                            number={rental.pan_number}
                            frontUrl={rental.pan_front_image_url}
                            backUrl={rental.pan_back_image_url}
                            icon={CreditCard}
                            onView={setPreviewImage}
                        />
                        <DocumentCard
                            title="Driving License"
                            number={rental.license_number}
                            frontUrl={rental.license_front_image_url}
                            backUrl={rental.license_back_image_url}
                            icon={IdCard}
                            onView={setPreviewImage}
                        />
                        <DocumentCard
                            title="RC (Registration Certificate)"
                            number={rental.rc_number}
                            frontUrl={rental.rc_front_image_url}
                            backUrl={rental.rc_back_image_url}
                            icon={Car}
                            onView={setPreviewImage}
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
                                <div
                                    key={index}
                                    onClick={() => setPreviewImage(getImageUrl(url))}
                                    className="relative group aspect-square rounded-lg overflow-hidden border border-border cursor-pointer"
                                >
                                    <img
                                        src={getImageUrl(url)}
                                        alt={`Car photo ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-xs">View</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timestamps & Audit */}
                <div className="pt-4 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
                    <div>
                        <p>Created: {formatDate(rental.created_at, true)}</p>
                        {rental.created_by && <p className="mt-1">Booked by: <span className="font-medium text-foreground">{rental.created_by}</span></p>}
                    </div>
                </div>
            </div>


            {/* Image Preview Overlay */}
            {
                previewImage && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setPreviewImage(null)}
                    >
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )
            }
        </Modal >
    );
};

export default RentalDetailsModal;
