import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Cars from '../Cars';
import { supabase } from '../../supabaseClient';
import { SettingsProvider } from '../../context/SettingsContext';
import toast from 'react-hot-toast';

// Mock Supabase
vi.mock('../../supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            eq: vi.fn(),
            order: vi.fn()
        }))
    }
}));

// Mock Toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

// Helper to wrap component with providers
const renderWithProviders = (component) => {
    return render(
        <SettingsProvider>
            {component}
        </SettingsProvider>
    );
};

describe('Cars Page Integration', () => {
    const mockCars = [
        { id: '1', make: 'Toyota', model: 'Camry', year: 2022, license_plate: 'TS01', status: 'available', daily_rate: 3000 },
        { id: '2', make: 'Honda', model: 'Civic', year: 2021, license_plate: 'TS02', status: 'rented', daily_rate: 3500 }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        supabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockCars, error: null })
            })
        });
    });

    it('fetches and displays cars on load', async () => {
        renderWithProviders(<Cars />);

        expect(screen.getByText('Loading your fleet...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
            expect(screen.getByText('Honda Civic')).toBeInTheDocument();
        });
    });

    it('shows empty state when no cars returned', async () => {
        supabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null })
            })
        });

        renderWithProviders(<Cars />);

        await waitFor(() => {
            expect(screen.getByText(/No cars in inventory yet/)).toBeInTheDocument();
        });
    });

    it('adds a new car', async () => {
        const user = userEvent.setup();
        const insertMock = vi.fn().mockResolvedValue({ error: null });

        supabase.from.mockImplementation((table) => {
            if (table === 'cars') {
                return {
                    select: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockCars, error: null })
                    }),
                    insert: insertMock,
                    update: vi.fn(),
                    delete: vi.fn(),
                    eq: vi.fn()
                };
            }
            return {};
        });

        renderWithProviders(<Cars />);

        await waitFor(() => screen.getByText('Toyota Camry'));

        const openButton = screen.getByRole('button', { name: /Add New Car/i });
        fireEvent.click(openButton);

        const makeInput = await waitFor(() => screen.getByPlaceholderText('Toyota'));
        await user.type(makeInput, 'NewCar');
        await user.type(screen.getByPlaceholderText('Camry'), 'ModelX');
        await user.type(screen.getByPlaceholderText('TS09AB1234'), 'TS03');
        await user.type(screen.getByPlaceholderText('2500'), '5000');

        const submitButton = screen.getAllByRole('button', { name: /Add Vehicle/i }).find(btn => btn.closest('form'));
        await user.click(submitButton);

        await waitFor(() => {
            expect(insertMock).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Vehicle added successfully');
        });
    });

    it('handles delete flow - shows confirmation modal', async () => {
        const user = userEvent.setup();

        // Mock rentals count check
        supabase.from.mockImplementation((table) => {
            if (table === 'rentals') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ count: 0, error: null })
                    })
                };
            }
            if (table === 'cars') {
                return {
                    select: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockCars, error: null })
                    })
                };
            }
            return {};
        });

        renderWithProviders(<Cars />);
        await waitFor(() => screen.getByText('Toyota Camry'));

        // Click delete button
        const deleteButtons = screen.getAllByTitle('Delete Vehicle');
        await user.click(deleteButtons[0]);

        // Verify confirmation modal appears
        await waitFor(() => {
            expect(screen.getByText(/Are you sure you want to remove this vehicle/)).toBeInTheDocument();
            expect(screen.getByText('Remove Vehicle')).toBeInTheDocument();
        });
    });
});
