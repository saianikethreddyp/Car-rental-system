import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { supabase } from '../../supabaseClient';
import { SettingsProvider } from '../../context/SettingsContext';

// Mock Supabase
vi.mock('../../supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(),
            neq: vi.fn(),
            order: vi.fn(),
            limit: vi.fn()
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

describe('Dashboard Page', () => {
    const today = new Date().toISOString().split('T')[0];

    const mockRecentRentals = [
        {
            id: '1',
            status: 'active',
            customer_name: 'Alice',
            total_amount: 5000,
            created_at: new Date().toISOString(),
            cars: { make: 'Toyota', model: 'Camry', license_plate: 'TS01' }
        }
    ];

    const mockAllRentals = [
        {
            id: '1',
            total_amount: 5000,
            start_date: today,
            end_date: today,
            status: 'active',
            cars: { daily_rate: 5000 }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        supabase.from.mockImplementation((table) => {
            if (table === 'cars') {
                return {
                    select: vi.fn().mockResolvedValue({ count: 10, error: null })
                };
            }
            if (table === 'rentals') {
                return {
                    select: vi.fn().mockReturnValue({
                        neq: vi.fn().mockReturnValue({
                            order: vi.fn().mockReturnValue({
                                limit: vi.fn().mockResolvedValue({ data: mockAllRentals, error: null })
                            })
                        }),
                        order: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue({ data: mockRecentRentals, error: null })
                        })
                    })
                };
            }
            return {};
        });
    });

    it('renders dashboard with stats', async () => {
        renderWithProviders(<Dashboard />);

        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Total Cars')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('10')).toBeInTheDocument();
        });
    });

    it('renders recent activity feed', async () => {
        renderWithProviders(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
        });
    });

    it('updates stats when date changes', async () => {
        renderWithProviders(<Dashboard />);

        await waitFor(() => screen.getByText('10'));

        const futureDate = '2025-01-01';
        const input = screen.getByDisplayValue(today);
        fireEvent.change(input, { target: { value: futureDate } });

        await waitFor(() => {
            // Active rentals should change based on date filtering
            expect(screen.queryByText('1')).not.toBeInTheDocument();
        });
    });
});
