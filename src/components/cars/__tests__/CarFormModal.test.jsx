import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CarFormModal from '../CarFormModal';

describe('CarFormModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        initialData: null
    };

    it('renders nothing when isOpen is false', () => {
        render(<CarFormModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Add New Vehicle')).not.toBeInTheDocument();
    });

    it('renders correctly for adding a new car', () => {
        render(<CarFormModal {...defaultProps} />);
        expect(screen.getByText('Add New Vehicle')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Toyota')).toHaveValue('');
        expect(screen.getByRole('button', { name: 'Add Vehicle' })).toBeInTheDocument();
    });

    it('renders correctly for editing a car', () => {
        const initialData = {
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            license_plate: 'KA01XY1234',
            daily_rate: 4000,
            status: 'rented'
        };

        render(<CarFormModal {...defaultProps} initialData={initialData} />);

        expect(screen.getByText('Edit Vehicle')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Honda')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Update Vehicle' })).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        render(<CarFormModal {...defaultProps} />);
        // Find close button in header (X icon button)
        const header = screen.getByText('Add New Vehicle').closest('div');
        const btn = header.querySelector('button');
        fireEvent.click(btn);

        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('submits form data when filled correctly', () => {
        render(<CarFormModal {...defaultProps} />);

        fireEvent.change(screen.getByPlaceholderText('Toyota'), { target: { value: 'Ford' } });
        fireEvent.change(screen.getByPlaceholderText('Camry'), { target: { value: 'Mustang' } });
        fireEvent.change(screen.getByPlaceholderText('TS09AB1234'), { target: { value: 'MH12GT5678' } });
        fireEvent.change(screen.getByPlaceholderText('2500'), { target: { value: '5000' } });

        fireEvent.click(screen.getByRole('button', { name: 'Add Vehicle' }));

        expect(defaultProps.onSubmit).toHaveBeenCalledWith(expect.objectContaining({
            make: 'Ford',
            model: 'Mustang',
            license_plate: 'MH12GT5678',
            daily_rate: '5000'
        }));
    });
});
