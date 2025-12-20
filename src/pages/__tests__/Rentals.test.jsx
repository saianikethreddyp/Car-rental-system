import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Rentals from '../Rentals';
import { supabase } from '../../supabaseClient';
import { SettingsProvider } from '../../context/SettingsContext';

// Mock Supabase
vi.mock('../../supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(),
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            eq: vi.fn(),
            order: vi.fn(),
            single: vi.fn(),
            neq: vi.fn()
        })),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis()
        })),
        removeChannel: vi.fn()
    }
}));

// Helper to wrap component with providers
const renderWithProviders = (component) => {
    return render(
        <BrowserRouter>
            <SettingsProvider>
                {component}
            </SettingsProvider>
        </BrowserRouter>
    );
};

describe('Rentals Page', () => {
    const mockRentals = [
        {
            id: '101',
            customer_name: 'John Doe',
            customer_phone: '1234567890',
            start_date: '2023-10-01',
            end_date: '2023-10-05',
            total_amount: 5000,
            status: 'active',
            car_id: '1',
            created_at: '2023-09-30T10:00:00Z',
            cars: {
                make: 'Toyota',
                model: 'Camry',
                license_plate: 'TS01',
                image_url: null
            }
        }
    ];

    const mockCars = [
        { id: '1', make: 'Toyota', model: 'Camry', daily_rate: 1000, license_plate: 'TS01', status: 'available' },
        { id: '2', make: 'Honda', model: 'Civic', daily_rate: 1200, license_plate: 'TS02', status: 'rented' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        supabase.from.mockImplementation((table) => {
            if (table === 'rentals') {
                return {
                    select: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockRentals, error: null })
                    }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { id: '102' }, error: null })
                        })
                    }),
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                };
            }
            if (table === 'cars') {
                return {
                    select: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockCars, error: null })
                    }),
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                };
            }
            return {};
        });
    });

    it('fetches and displays rentals', async () => {
        renderWithProviders(<Rentals />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
    });

    it('opens new booking modal', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Rentals />);

        await user.click(screen.getByRole('button', { name: /New Booking/i }));

        await waitFor(() => {
            expect(screen.getByText('Select Car')).toBeInTheDocument();
        });
    });

    it('submits new rental and updates car status', async () => {
        const user = userEvent.setup();
        const insertSpy = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'new' }, error: null })
            })
        });
        const updateCarSpy = vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
        });

        supabase.from.mockImplementation((table) => {
            if (table === 'rentals') {
                return {
                    select: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockRentals, error: null })
                    }),
                    insert: insertSpy
                };
            }
            if (table === 'cars') {
                return {
                    select: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockCars, error: null })
                    }),
                    update: updateCarSpy
                };
            }
        });

        renderWithProviders(<Rentals />);

        await user.click(screen.getByRole('button', { name: /New Booking/i }));

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        await user.selectOptions(screen.getByRole('combobox'), '1');

        // Use name attribute since Input component doesn't have htmlFor
        const startDateInput = document.querySelector('input[name="start_date"]');
        const endDateInput = document.querySelector('input[name="end_date"]');
        if (startDateInput) fireEvent.change(startDateInput, { target: { value: '2023-11-01' } });
        if (endDateInput) fireEvent.change(endDateInput, { target: { value: '2023-11-02' } });

        await user.type(screen.getByPlaceholderText('e.g. John Doe'), 'New Customer');
        await user.type(screen.getByPlaceholderText('+91...'), '9999999999');

        await user.click(screen.getByRole('button', { name: /Confirm Booking/i }));

        await waitFor(() => {
            expect(insertSpy).toHaveBeenCalled();
            expect(updateCarSpy).toHaveBeenCalledWith({ status: 'rented' });
        });
    });
});
