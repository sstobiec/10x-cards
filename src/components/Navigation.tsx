import { useState } from "react";

interface NavigationProps {
  userEmail?: string;
}

export default function Navigation({ userEmail }: NavigationProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setError(data.error || "Błąd podczas wylogowywania");
        } else {
          setError("Błąd serwera. Spróbuj ponownie później.");
        }
        setIsLoggingOut(false);
        return;
      }

      // Success - redirect to login page
      window.location.href = "/login";
    } catch (err) {
      setError("Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.");
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold text-foreground">
              10x Cards
            </a>
          </div>

          {userEmail && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{userEmail}</span>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                aria-label="Wyloguj się"
              >
                {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
              </button>
            </div>
          )}
        </div>
      </div>
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm text-center" role="alert">
          {error}
        </div>
      )}
    </nav>
  );
}

