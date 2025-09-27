import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={this.resetError}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-4"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Refresh Page
            </button>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-gray-400">Error Details</summary>
                <pre className="text-xs text-red-300 mt-2 p-2 bg-gray-800 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;