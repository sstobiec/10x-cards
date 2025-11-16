import { useState } from "react";
import { AuthForm } from "./AuthForm";
import { Input } from "@/components/ui/input";

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError("Wszystkie pola są wymagane.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Hasła nie są takie same.");
      return;
    }
    // TODO: Add password strength validation

    setIsLoading(true);
    console.log("Submitting new password");
    // TODO: Implement API call to /api/auth/update-password
    // This will require the access_token from the URL fragment
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      // Mock error
      // setError("Wystąpił błąd podczas aktualizacji hasła. Spróbuj ponownie.");
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
            Hasło zostało zmienione
          </h2>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Możesz teraz zalogować się przy użyciu nowego hasła.
          </p>
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="font-semibold leading-6 text-primary hover:text-primary/90"
            >
              Przejdź do logowania
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      title="Ustaw nowe hasło"
      buttonText="Zapisz nowe hasło"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    >
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium leading-6 text-foreground"
        >
          Nowe hasło
        </label>
        <div className="mt-2">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium leading-6 text-foreground"
        >
          Powtórz nowe hasło
        </label>
        <div className="mt-2">
          <Input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
    </AuthForm>
  );
}
