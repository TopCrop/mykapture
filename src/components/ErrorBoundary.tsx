import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="glass-card max-w-md w-full p-8 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20 mx-auto">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Try refreshing the page.
            </p>
            {this.state.error && (
              <pre className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-3 overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={this.handleReset} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Try Again
              </Button>
              <Button onClick={() => window.location.href = "/dashboard"} className="gap-1.5">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
