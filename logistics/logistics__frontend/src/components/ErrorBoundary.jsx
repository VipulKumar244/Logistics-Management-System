import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="bg-white p-8 rounded-4xl shadow-lg border border-red-100 max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Component Error</h2>
            <p className="text-slate-600 mb-6">
              Something went wrong in the Shipments component. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all"
            >
              Refresh Page
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-slate-500">Error Details</summary>
              <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;