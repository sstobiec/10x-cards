import { Button } from "@/components/ui/button";
import type { ApiError } from "@/types";

interface ErrorDisplayProps {
  error: ApiError;
  onRetry?: () => void;
  onReset?: () => void;
}

/**
 * Error display component with retry and reset actions
 *
 * Shows user-friendly error messages with appropriate actions
 */
export function ErrorDisplay({ error, onRetry, onReset }: ErrorDisplayProps) {
  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8 text-center" role="alert">
          {/* Error Icon */}
          <div className="flex justify-center mb-4">
            <svg
              className="h-16 w-16 text-destructive"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <h2 className="text-2xl font-bold text-destructive mb-2">{error.title}</h2>

          {/* Error Message */}
          <p className="text-base text-foreground/80 mb-6">{error.message}</p>

          {/* Error Details (if available) */}
          {error.details && Object.keys(error.details).length > 0 && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Szczegóły techniczne
              </summary>
              <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto text-muted-foreground">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {onRetry && (
              <Button onClick={onRetry} variant="default">
                Spróbuj ponownie
              </Button>
            )}
            {onReset && (
              <Button onClick={onReset} variant="outline">
                Zacznij od nowa
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

