import React, { Component } from 'react';
import { logError } from '../utils/logger';

/**
 * Error Boundary component for catching and logging React errors
 * Wraps around components to prevent entire app crashes
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to our logging service
        logError('React Error Boundary caught error', error, {
            component: this.props.name || 'Unknown',
            componentStack: errorInfo?.componentStack
        });

        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-destructive/5 rounded-xl border border-destructive/20">
                    <div className="text-destructive text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-muted-foreground text-sm mb-4 text-center max-w-md">
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Try Again
                    </button>
                    {import.meta.env.DEV && this.state.errorInfo && (
                        <details className="mt-4 text-xs text-muted-foreground max-w-full overflow-auto">
                            <summary className="cursor-pointer">Stack trace</summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-left whitespace-pre-wrap">
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
