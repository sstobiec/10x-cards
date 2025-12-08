import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { logError } from "../lib/api/error-logs.api";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary component that catches JavaScript errors in child component tree,
 * logs them to the server, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    // Attempt to log the error to the server
    // We don't await this as we don't want to block the UI
    logError({
      model: "client-react",
      error_type: error.name || "ReactError",
      error_message: error.message,
      input_payload: {
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    }).catch((apiError) => {
      // Fallback logging if API fails
      console.warn("Failed to send error log to server:", apiError);
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Coś poszło nie tak</h2>
          <p className="text-red-600 mb-6 max-w-md">
            Wystąpił nieoczekiwany błąd. Został on automatycznie zgłoszony do naszego zespołu.
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={() => this.setState({ hasError: false, error: null })}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Spróbuj ponownie
            </Button>
            <Button onClick={this.handleReload} className="bg-red-600 hover:bg-red-700 text-white">
              Odśwież stronę
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <div className="mt-8 p-4 bg-white rounded border border-red-200 text-left w-full max-w-2xl overflow-auto text-xs text-red-900 font-mono">
              <p className="font-bold mb-2">{this.state.error.toString()}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

