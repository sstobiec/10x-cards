import { useState } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface UserProfileProps {
  /** Obiekt użytkownika Supabase przekazany z Astro locals */
  user: User;
}

export type LogoutState = "idle" | "loading" | "error";

export default function UserProfile({ user }: UserProfileProps) {
  const [logoutState, setLogoutState] = useState<LogoutState>("idle");

  const handleLogout = async () => {
    setLogoutState("loading");

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
          throw new Error(data.error || "Błąd podczas wylogowywania");
        }
        throw new Error("Błąd serwera. Spróbuj ponownie później.");
      }

      // Success - redirect to login page
      window.location.href = "/login";
    } catch (error) {
      setLogoutState("error");
      const message = error instanceof Error ? error.message : "Nie udało się wylogować. Spróbuj ponownie.";
      toast.error("Błąd wylogowania", {
        description: message,
      });
    }
  };

  const displayEmail = user.email ?? "Brak adresu email";
  const displayId = user.id;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UserIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Twój profil</CardTitle>
          <CardDescription>Informacje o Twoim koncie</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Adres email</p>
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">{displayEmail}</div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Identyfikator użytkownika</p>
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono text-xs break-all">
              {displayId}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
            disabled={logoutState === "loading"}
            aria-label="Wyloguj się z aplikacji"
          >
            {logoutState === "loading" ? (
              <>
                <LoaderIcon className="h-4 w-4 animate-spin" />
                Wylogowywanie...
              </>
            ) : (
              <>
                <LogOutIcon className="h-4 w-4" />
                Wyloguj się
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Simple SVG Icons
function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}
