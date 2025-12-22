import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
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

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
                    <div className="glass max-w-md w-full p-8 rounded-2xl animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-destructive/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-muted-foreground mb-8 text-sm">
                            We encountered an unexpected error. Don't worry, your data is safe.
                        </p>
                        <Button
                            onClick={this.handleReset}
                            className="w-full gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Reload Application
                        </Button>
                        {process.env.NODE_ENV === 'development' && (
                            <pre className="mt-8 p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-h-40 text-destructive">
                                {this.state.error?.message}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
