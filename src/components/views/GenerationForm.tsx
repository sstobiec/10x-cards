import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface GenerationFormProps {
  text: string;
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const MAX_CHARACTERS = 10000;

/**
 * Form component for inputting text to generate flashcards
 *
 * Features:
 * - Character counter with visual feedback
 * - Validation (empty text, max length)
 * - Loading state handling
 */
export function GenerationForm({ text, onTextChange, onGenerate, isLoading }: GenerationFormProps) {
  const characterCount = text.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;
  const isEmpty = text.trim().length === 0;
  const isValid = !isEmpty && !isOverLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      onGenerate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="input-text" className="text-sm font-medium text-foreground">
            Wklej swoje notatki
          </label>
          <span
            className={cn("text-sm font-medium transition-colors", {
              "text-muted-foreground": !isOverLimit,
              "text-destructive": isOverLimit,
            })}
            aria-live="polite"
          >
            {characterCount.toLocaleString("pl-PL")} / {MAX_CHARACTERS.toLocaleString("pl-PL")}
          </span>
        </div>

        <Textarea
          id="input-text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Wklej tutaj swoje notatki, artykuł lub materiał do nauki. AI wygeneruje dla Ciebie fiszki do nauki..."
          className={cn("min-h-[300px] resize-y", {
            "border-destructive focus-visible:ring-destructive/20": isOverLimit,
          })}
          disabled={isLoading}
          aria-invalid={isOverLimit}
          aria-describedby="character-count-description"
        />

        {isOverLimit && (
          <p id="character-count-description" className="text-sm text-destructive" role="alert">
            Tekst przekracza maksymalną długość {MAX_CHARACTERS.toLocaleString("pl-PL")} znaków. Usuń{" "}
            {(characterCount - MAX_CHARACTERS).toLocaleString("pl-PL")} znaków.
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <Button
          type="submit"
          size="lg"
          disabled={!isValid || isLoading}
          className="min-w-[200px]"
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generowanie...
            </>
          ) : (
            "Generuj fiszki"
          )}
        </Button>
      </div>
    </form>
  );
}

