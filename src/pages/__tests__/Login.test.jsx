import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../Login';
import { supabase } from '../../supabaseClient';

// Mock Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    ...vi.importActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    Link: ({ children }) => <a>{children}</a>
}));

// Mock Supabase Auth
vi.mock('../../supabaseClient', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn()
        }
    }
}));

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form correctly', () => {
        render(<Login />);
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('handles input changes', async () => {
        const user = userEvent.setup();
        render(<Login />);

        const emailInput = screen.getByPlaceholderText('name@company.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        expect(emailInput).toHaveValue('test@example.com');
        expect(passwordInput).toHaveValue('password123');
    });

    it('submits form and redirects on success', async () => {
        const user = userEvent.setup();
        supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: '1' } }, error: null });

        render(<Login />);

        await user.type(screen.getByPlaceholderText('name@company.com'), 'admin@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'password');
        await user.click(screen.getByRole('button', { name: /Sign In/i }));

        await waitFor(() => {
            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'admin@example.com',
                password: 'password'
            });
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('displays error message on failure', async () => {
        const user = userEvent.setup();
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: null,
            error: { message: 'Invalid login credentials' }
        });

        render(<Login />);

        await user.type(screen.getByPlaceholderText('name@company.com'), 'wrong@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'wrong');
        await user.click(screen.getByRole('button', { name: /Sign In/i }));

        await waitFor(() => {
            expect(screen.getByText(/Invalid login credentials/)).toBeInTheDocument();
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
