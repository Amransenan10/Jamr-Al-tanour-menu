import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#121212', color: 'red', height: '100vh', paddingBottom: 100, overflow: 'auto', textAlign: 'left', direction: 'ltr' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {this.state.error?.toString()}
            <br />
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
