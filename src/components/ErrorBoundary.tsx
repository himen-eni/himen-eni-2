import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught in React ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f17] text-white flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#f8fafc]">Something went wrong</h2>
              <p className="text-[12px] text-[#94a3b8] mt-1">
                An unexpected interface issue occurred. You can reload the application or reset the cache.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="bg-[#0b1329] border border-[#1e293b] p-3 rounded-xl text-[11px] font-mono text-left text-red-400 max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-[#052e16] font-bold text-[12px] rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </button>
              <button
                onClick={this.handleResetCache}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] font-medium text-[12px] rounded-xl border border-[#334155] transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

