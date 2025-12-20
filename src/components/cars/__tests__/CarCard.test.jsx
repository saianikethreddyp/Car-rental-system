import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CarCard from '../CarCard';
import { SettingsProvider } from '../../../context/SettingsContext';

// Helper to wrap component with providers
const renderWithProviders = (component) => {
    return render(
        <SettingsProvider>
            {component}
        </SettingsProvider>
    );
};

describe('CarCard', () => {
    const mockCar = {
        id: '1',
        make: 'Toyota',
        model: 'Corolla',
        year: 2022,
        license_plate: 'TS09AB1234',
        status: 'available',
        daily_rate: 3000,
        image_url: 'http://example.com/image.jpg'
    };

    const mockHandlers = {
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onStatusUpdate: vi.fn()
    };

    it('renders car details correctly', () => {
        renderWithProviders(<CarCard car={mockCar} {...mockHandlers} />);

        expect(screen.getByText('Toyota Corolla')).toBeInTheDocument();
        expect(screen.getByText(/TS09AB1234/)).toBeInTheDocument();
    });

    it('displays fallback when image URL is missing', () => {
        const carWithoutImage = { ...mockCar, image_url: null };
        renderWithProviders(<CarCard car={carWithoutImage} {...mockHandlers} />);

        expect(screen.getByText('No Image')).toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', () => {
        renderWithProviders(<CarCard car={mockCar} {...mockHandlers} />);

        fireEvent.click(screen.getByTitle('Edit Vehicle'));
        expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockCar);
    });

    it('calls onDelete when delete button is clicked', () => {
        renderWithProviders(<CarCard car={mockCar} {...mockHandlers} />);

        fireEvent.click(screen.getByTitle('Delete Vehicle'));
        expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
    });

    it('calls onStatusUpdate with "maintenance" when maintenance button is clicked', () => {
        renderWithProviders(<CarCard car={mockCar} {...mockHandlers} />);

        fireEvent.click(screen.getByText('Set Maintenance'));
        expect(mockHandlers.onStatusUpdate).toHaveBeenCalledWith('1', 'maintenance');
    });

    it('calls onStatusUpdate with "available" when enable button is clicked', () => {
        const maintenanceCar = { ...mockCar, status: 'maintenance' };
        renderWithProviders(<CarCard car={maintenanceCar} {...mockHandlers} />);

        fireEvent.click(screen.getByText('Enable Vehicle'));
        expect(mockHandlers.onStatusUpdate).toHaveBeenCalledWith('1', 'available');
    });
});
