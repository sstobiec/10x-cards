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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !email || !password || !confirmPassword) {
      setError("Wszystkie pola są wymagane.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Hasła nie są takie same.");
      return;
    }
    // Add more client-side validation as needed (e.g., password strength)

    setIsLoading(true);
    console.log("Submitting:", { username, email, password });
    // TODO: Implement API call to /api/auth/register
    setTimeout(() => {
      setIsLoading(false);
      // Mock success
      setIsSuccess(true);
      // Mock error
      // setError("Użytkownik o tym adresie email już istnieje.");
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
            Sprawdź swoją skrzynkę mailową
          </h2>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Wysłaliśmy link weryfikacyjny na Twój adres email. Kliknij go, aby
            potwierdzić rejestrację.
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
