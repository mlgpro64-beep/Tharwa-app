
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 text-center">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <span className="material-symbols-outlined text-5xl">error_outline</span>
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-text-primary-dark mb-2">
            Oops! Something went wrong.
          </h1>
          <p className="text-text-secondary dark:text-text-secondary-dark mb-8 max-w-xs">
            We encountered an unexpected error. Our team has been notified.
          </p>
          <button
            onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
            }}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95"
          >
            Restart App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
