import { useState } from "react";
import { AuthForm } from "./AuthForm";
import { Input } from "@/components/ui/input";

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!username || !email || !password || !confirmPassword) {
      setError("Wszystkie pola są wymagane.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Hasła nie są takie same.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, confirmPassword }),
      });

      const contentType = response.headers.get("content-type");

      // Check if response is JSON
      if (!contentType || !contentType.includes("application/json")) {
        setError("Błąd serwera. Spróbuj ponownie później.");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Błąd podczas rejestracji");
        setIsLoading(false);
        return;
      }

      // Success - show confirmation message
      setIsSuccess(true);
    } catch (err) {
      setError("Wystąpił błąd podczas rejestracji. Spróbuj ponownie.");
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
            Sprawdź swoją skrzynkę mailową
          </h2>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Wysłaliśmy link weryfikacyjny na adres <strong>{email}</strong>.
            Kliknij go, aby potwierdzić rejestrację i aktywować swoje konto.
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Po potwierdzeniu email będziesz mógł zalogować się do swojego konta.
          </p>
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="font-semibold leading-6 text-primary hover:text-primary/90"
            >
              Powrót do logowania
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      title="Utwórz nowe konto"
      buttonText="Zarejestruj się"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      footerContent={
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Masz już konto?{" "}
          <a
            href="/login"
            className="font-semibold leading-6 text-primary hover:text-primary/90"
          >
            Zaloguj się
          </a>
        </p>
      }
    >
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium leading-6 text-foreground"
        >
          Nazwa użytkownika
        </label>
        <div className="mt-2">
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium leading-6 text-foreground"
        >
          Adres email
        </label>
        <div className="mt-2">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium leading-6 text-foreground"
        >
          Hasło
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
          Powtórz hasło
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
