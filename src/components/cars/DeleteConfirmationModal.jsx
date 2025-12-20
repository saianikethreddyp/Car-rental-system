import React from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, rentalCount }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Remove Vehicle" size="sm">
            <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 className="text-destructive" size={32} />
                </div>

                {rentalCount > 0 ? (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-6 text-left">
                        <p className="text-destructive text-sm font-bold flex items-center gap-2">
                            ⚠️ Warning: Active History
                        </p>
                        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                            This car has <strong>{rentalCount}</strong> rental records.
                            Proceeding will <u>permanently delete</u> the car AND its entire history.
                        </p>
                    </div>
                ) : (
                    <p className="text-foreground mb-8 leading-relaxed">
                        Are you sure you want to remove this vehicle from your fleet? <br />
                        <span className="text-sm text-muted-foreground">This action cannot be undone.</span>
                    </p>
                )}

                <div className="flex gap-3 justify-center">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                    >
                        {rentalCount > 0 ? 'Delete Everything' : 'Confirm Remove'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmationModal;
