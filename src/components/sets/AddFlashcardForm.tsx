import { useState, useRef, useCallback } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import type { CreateFlashcardRequestDTO } from "@/types";

interface AddFlashcardFormProps {
  onAdd: (card: CreateFlashcardRequestDTO) => Promise<void>;
  isSubmitting: boolean;
}

const MAX_AVERS_LENGTH = 200;
const MAX_REWERS_LENGTH = 750;

const flashcardSchema = z.object({
  avers: z
    .string()
    .min(1, "Pytanie jest wymagane")
    .max(MAX_AVERS_LENGTH, `Pytanie nie może przekraczać ${MAX_AVERS_LENGTH} znaków`),
  rewers: z
    .string()
    .min(1, "Odpowiedź jest wymagana")
    .max(MAX_REWERS_LENGTH, `Odpowiedź nie może przekraczać ${MAX_REWERS_LENGTH} znaków`),
});

interface FormErrors {
  avers?: string;
  rewers?: string;
}

export function AddFlashcardForm({ onAdd, isSubmitting }: AddFlashcardFormProps) {
  const [avers, setAvers] = useState("");
  const [rewers, setRewers] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const aversRef = useRef<HTMLTextAreaElement>(null);

  const resetForm = useCallback(() => {
    setAvers("");
    setRewers("");
    setErrors({});
    // Focus back to avers field after successful submission
    setTimeout(() => {
      aversRef.current?.focus();
    }, 0);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate with Zod
      const result = flashcardSchema.safeParse({ avers: avers.trim(), rewers: rewers.trim() });

      if (!result.success) {
        const fieldErrors: FormErrors = {};
        result.error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          if (field) {
            fieldErrors[field] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      setErrors({});

      try {
        await onAdd({
          avers: result.data.avers,
          rewers: result.data.rewers,
          source: "manual",
        });
        resetForm();
      } catch {
        // Error handling is done in the parent component via toast
      }
    },
    [avers, rewers, onAdd, resetForm]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">Dodaj nową fiszkę</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Avers (Front) */}
            <div className="space-y-2">
              <Label htmlFor="avers" className="flex justify-between">
                <span>Pytanie (awers)</span>
                <span className="text-xs text-muted-foreground">
                  {avers.length}/{MAX_AVERS_LENGTH}
                </span>
              </Label>
              <Textarea
                ref={aversRef}
                id="avers"
                value={avers}
                onChange={(e) => setAvers(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Wpisz pytanie..."
                maxLength={MAX_AVERS_LENGTH}
                disabled={isSubmitting}
                rows={3}
                className="resize-none"
                aria-invalid={!!errors.avers}
                aria-describedby={errors.avers ? "avers-error" : undefined}
              />
              {errors.avers && (
                <p id="avers-error" className="text-sm text-destructive" role="alert">
                  {errors.avers}
                </p>
              )}
            </div>

            {/* Rewers (Back) */}
            <div className="space-y-2">
              <Label htmlFor="rewers" className="flex justify-between">
                <span>Odpowiedź (rewers)</span>
                <span className="text-xs text-muted-foreground">
                  {rewers.length}/{MAX_REWERS_LENGTH}
                </span>
              </Label>
              <Textarea
                id="rewers"
                value={rewers}
                onChange={(e) => setRewers(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Wpisz odpowiedź..."
                maxLength={MAX_REWERS_LENGTH}
                disabled={isSubmitting}
                rows={3}
                className="resize-none"
                aria-invalid={!!errors.rewers}
                aria-describedby={errors.rewers ? "rewers-error" : undefined}
              />
              {errors.rewers && (
                <p id="rewers-error" className="text-sm text-destructive" role="alert">
                  {errors.rewers}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dodawanie...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj fiszkę
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Skrót: <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Cmd</kbd> +{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> aby dodać
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
