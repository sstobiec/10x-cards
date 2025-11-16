import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  title: string;
  children: React.ReactNode;
  buttonText: string;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  footerContent?: React.ReactNode;
}

export function AuthForm({
  title,
  children,
  buttonText,
  onSubmit,
  isLoading,
  error,
  footerContent,
}: AuthFormProps) {
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          {title}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={onSubmit} className="space-y-6">
          {children}

          {error && (
            <p className="text-sm text-destructive text-center" role="alert">
              {error}
            </p>
          )}

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Przetwarzanie...
                </>
              ) : (
                buttonText
              )}
            </Button>
          </div>
        </form>
        {footerContent && <div className="mt-6">{footerContent}</div>}
      </div>
    </div>
  );
}
