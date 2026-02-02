import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthProvider';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { login } = useAuth(); // Use auth context

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { success, error } = await login(email, password);

            if (success) {
                navigate('/');
            } else {
                setError(error);
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-md w-full bg-card/50 backdrop-blur-xl rounded-2xl shadow-xl relative z-10 p-8 border border-border">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20 transform -rotate-6">
                        <span className="text-3xl font-bold text-primary-foreground">N</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
                    <p className="text-muted-foreground">Sign in to manage your premium fleet</p>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-6 text-sm flex items-center animate-shake">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-foreground text-sm font-medium mb-2">Email Address</label>
                        <div className="relative group">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-12 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="name@company.com"
                                required
                            />
                            <Mail className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-foreground text-sm font-medium mb-2">Password</label>
                        <div className="relative group">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-12 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="••••••••"
                                required
                            />
                            <Lock className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" size={18} />
                        </div>
                        <div className="mt-2 text-right">
                            <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 hover:underline transition-all">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        isLoading={loading}
                        className="w-full py-3.5 text-base shadow-lg hover:shadow-xl transition-all"
                        size="lg"
                    >
                        Sign In <ArrowRight size={18} className="ml-2" />
                    </Button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-border">
                    <p className="text-muted-foreground text-sm">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary hover:text-primary/80 font-semibold hover:underline transition-all">
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

