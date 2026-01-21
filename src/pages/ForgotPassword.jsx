import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // TODO: Replace with backend reset password endpoint
            // const { error } = await supabase.auth.resetPasswordForEmail(email, {
            //     redirectTo: `${window.location.origin}/reset-password`,
            // });

            // if (error) throw error;
            console.log('Reset link triggered (Mock)');
            setSuccess(true);
        } catch (err) {
            setError(err.message);
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
                        <span className="text-3xl font-bold text-primary-foreground">D</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Forgot Password</h1>
                    <p className="text-muted-foreground">
                        {success
                            ? "Check your email for reset instructions"
                            : "Enter your email to reset your password"
                        }
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-6 text-sm flex items-center animate-shake">
                        ⚠️ {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center space-y-6">
                        <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-6 rounded-xl flex flex-col items-center gap-3">
                            <CheckCircle size={48} />
                            <p className="text-sm">
                                We've sent a password reset link to <strong>{email}</strong>.
                                Please check your inbox and follow the instructions.
                            </p>
                        </div>
                        <Link
                            to="/login"
                            className="inline-flex items-center text-primary hover:text-primary/80 font-semibold hover:underline transition-all"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleResetPassword} className="space-y-6">
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

                            <Button
                                type="submit"
                                isLoading={loading}
                                className="w-full py-3.5 text-base shadow-lg hover:shadow-xl transition-all"
                                size="lg"
                            >
                                Send Reset Link <Send size={18} className="ml-2" />
                            </Button>
                        </form>

                        <div className="mt-8 text-center pt-6 border-t border-border">
                            <Link
                                to="/login"
                                className="inline-flex items-center text-primary hover:text-primary/80 font-semibold hover:underline transition-all"
                            >
                                <ArrowLeft size={18} className="mr-2" />
                                Back to Login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
