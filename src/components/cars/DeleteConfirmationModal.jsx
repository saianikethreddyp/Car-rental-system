import React from 'react';
import { Archive, CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, rentalCount, loading }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Remove Vehicle from Fleet" size="sm">
            <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Archive className="text-amber-600" size={32} />
                </div>

                {rentalCount > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 text-left">
                        <p className="text-green-700 text-sm font-bold flex items-center gap-2">
                            <CheckCircle size={16} />
                            Rental History Preserved
                        </p>
                        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                            This car has <strong>{rentalCount}</strong> rental record{rentalCount > 1 ? 's' : ''}.
                            All rental history will be <u>safely preserved</u> after removal.
                        </p>
                    </div>
                ) : (
                    <p className="text-foreground mb-6 leading-relaxed">
                        Are you sure you want to remove this vehicle from your active fleet?
                    </p>
                )}

                <div className="bg-muted/50 rounded-md p-4 mb-6 text-left">
                    <p className="text-sm text-muted-foreground">
                        <strong>What happens:</strong>
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>✓ Car will be hidden from active inventory</li>
                        <li>✓ All rental history remains intact</li>
                        <li>✓ Reports will still include this car's data</li>
                        <li>✓ Can be restored by admin if needed</li>
                    </ul>
                </div>

                <div className="flex gap-3 justify-center">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Removing...' : 'Remove from Fleet'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmationModal;
