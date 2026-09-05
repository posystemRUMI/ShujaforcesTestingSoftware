import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL UNCAUGHT UI FAULT:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center p-6 select-none">
          <div className="max-w-xl w-full bg-white border border-[#0E1B2A] rounded p-8 shadow-[0_4px_0_0_rgba(14,27,42,0.08)]">
            <div className="flex items-center space-x-3 text-[#782525] border-b border-[#D4D9DF] pb-4 mb-5">
              <ShieldAlert className="w-7 h-7 text-[#782525]" />
              <div>
                <h1 className="text-lg font-bold uppercase tracking-wider text-[#0E1B2A]">
                  Terminal Anomaly / Interface Execution Exception
                </h1>
                <p className="text-xs text-[#64748B]">Forces Academy Secure Workstation Recovery Protocol</p>
              </div>
            </div>

            <div className="bg-[#FDF2F2] border border-[#E29A9A] rounded p-4 mb-6">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-[#782525] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[#782525] space-y-1">
                  <p className="font-semibold">Execution Fault Code: ERR_UI_STATE_CRASH</p>
                  <p className="font-mono break-all">{this.state.error?.message || 'Unspecified runtime exception'}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#1F2937] leading-relaxed mb-6">
              If this workstation is actively conducting a locked computerized test session, your answers have been
              cryptographically secured in local persistent storage. Notify the invigilator immediately or reload to
              re-establish telemetry.
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-[#D4D9DF]">
              <span className="text-[11px] font-mono text-[#64748B]">TERMINAL: LOCAL_STATION</span>
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center space-x-2 bg-[#0E1B2A] text-white px-4 py-2 text-xs font-semibold rounded hover:bg-[#1A2C42] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A75E]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recover Interface</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
