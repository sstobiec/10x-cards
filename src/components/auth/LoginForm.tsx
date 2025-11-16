import { useState } from "react";
import { AuthForm } from "./AuthForm";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!email || !password) {
      setError("Email i hasło są wymagane.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
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
        setError(data.error || "Nieprawidłowy email lub hasło");
        setIsLoading(false);
        return;
      }

      // Success - redirect to home page
      window.location.href = "/";
    } catch (err) {
      setError("Wystąpił błąd podczas logowania. Spróbuj ponownie.");
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Zaloguj się do swojego konta"
      buttonText="Zaloguj się"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      footerContent={
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Nie masz konta?{" "}
          <a href="/register" className="font-semibold leading-6 text-primary hover:text-primary/90">
            Zarejestruj się
          </a>
        </p>
      }
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground">
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
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium leading-6 text-foreground">
            Hasło
          </label>
          <div className="text-sm">
            <a href="/reset-password" className="font-semibold text-primary hover:text-primary/90">
              Zapomniałeś hasła?
            </a>
          </div>
        </div>
        <div className="mt-2">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
    </AuthForm>
  );
}
