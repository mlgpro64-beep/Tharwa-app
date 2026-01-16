import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Ignore common non-critical errors that shouldn't trigger error boundary
        const errorMessage = error.message || '';
        const errorStack = error.stack || '';
        
        // Check if it's a dynamic import error - requires page reload
        const isDynamicImportError = errorMessage.includes('Failed to fetch dynamically imported module') ||
                                   errorMessage.includes('Importing a module script failed') ||
                                   errorMessage.includes('dynamically imported module');
        
        if (isDynamicImportError) {
            console.warn('ErrorBoundary: Dynamic import error detected, clearing cache and reloading...');
            
            // Clear all caches and reload
            if ('caches' in window) {
                caches.keys().then((names) => {
                    names.forEach(name => caches.delete(name));
                });
            }
            
            // Unregister service workers
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((registration) => registration.unregister());
                });
            }
            
            // Force reload after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 500);
            return;
        }
        
        // These are expected errors and shouldn't show the error page
        const ignoredErrors = [
            'Failed to fetch',
            'NetworkError',
            'Network request failed',
            'load failed',
            'timeout',
            'AbortError',
            'ChunkLoadError', // Vite hot reload chunk errors
        ];
        
        const shouldIgnore = ignoredErrors.some(ignored => 
            errorMessage.includes(ignored) || errorStack.includes(ignored)
        );
        
        if (shouldIgnore) {
            console.warn('ErrorBoundary: Ignoring non-critical error:', error.message);
            // Don't set error state for ignored errors
            return;
        }

        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // Log to error tracking service (Sentry, etc)
        if (import.meta.env.PROD) {
            // TODO: Send to error tracking
            // Example: Sentry.captureException(error, { extra: errorInfo });
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-destructive/5 p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full glass rounded-3xl p-8 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: 'spring' }}
                            className="w-20 h-20 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto mb-6"
                        >
                            <AlertTriangle className="w-10 h-10 text-destructive" />
                        </motion.div>

                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            عذراً، حدث خطأ
                        </h1>
                        <h2 className="text-lg font-semibold text-foreground/80 mb-4">
                            Oops, something went wrong
                        </h2>

                        <p className="text-sm text-muted-foreground mb-6">
                            حدث خطأ غير متوقع. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-xs text-destructive cursor-pointer font-mono mb-2">
                                    Error Details (Dev Only)
                                </summary>
                                <pre className="text-xs bg-destructive/10 p-3 rounded-lg overflow-auto max-h-40 text-destructive">
                                    {this.state.error.toString()}
                                    {'\n\n'}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={this.handleReset}
                                className="flex-1 h-12 rounded-2xl bg-muted text-foreground font-semibold flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>إعادة المحاولة</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={this.handleGoHome}
                                className="flex-1 h-12 rounded-2xl gradient-primary text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                            >
                                <Home className="w-4 h-4" />
                                <span>الصفحة الرئيسية</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}
