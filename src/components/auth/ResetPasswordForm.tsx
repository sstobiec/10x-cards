import { useState } from "react";
import { AuthForm } from "./AuthForm";
import { Input } from "@/components/ui/input";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Adres email jest wymagany.");
      return;
    }

    setIsLoading(true);
    console.log("Submitting:", { email });
    // TODO: Implement API call to /api/auth/reset-password
    setTimeout(() => {
      setIsLoading(false);
      // As per spec, always show success to prevent email enumeration
      setIsSuccess(true);
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
            Jeśli konto dla podanego adresu email istnieje, wysłaliśmy na nie instrukcje dotyczące resetowania hasła.
          </p>
          <div className="mt-6 text-center">
            <a href="/login" className="font-semibold leading-6 text-primary hover:text-primary/90">
              Powrót do logowania
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      title="Zresetuj swoje hasło"
      buttonText="Wyślij instrukcje"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      footerContent={
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Pamiętasz hasło?{" "}
          <a href="/login" className="font-semibold leading-6 text-primary hover:text-primary/90">
            Zaloguj się
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
    </AuthForm>
  );
}
