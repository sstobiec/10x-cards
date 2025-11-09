import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlashcardProposalList } from "./FlashcardProposalList";
import { cn } from "@/lib/utils";
import type { FlashcardProposalViewModel } from "@/types";

interface ReviewSectionProps {
  proposals: FlashcardProposalViewModel[];
  setName: string;
  onSetNameChange: (name: string) => void;
  onSave: () => void;
  onUpdateProposal: (id: string, avers: string, rewers: string) => void;
  onDeleteProposal: (id: string) => void;
  onToggleFlag: (id: string) => void;
  isSaving: boolean;
}

const MAX_SET_NAME_LENGTH = 100;

/**
 * Review section for flashcard proposals
 *
 * Features:
 * - Set name input with validation
 * - List of flashcard proposals
 * - Save button with loading state
 */
export function ReviewSection({
  proposals,
  setName,
  onSetNameChange,
  onSave,
  onUpdateProposal,
  onDeleteProposal,
  onToggleFlag,
  isSaving,
}: ReviewSectionProps) {
  const isSetNameValid = setName.trim().length > 0 && setName.length <= MAX_SET_NAME_LENGTH;
  const hasProposals = proposals.length > 0;
  const canSave = isSetNameValid && hasProposals && !isSaving;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSave) {
      onSave();
    }
  };

  return (
    <div className="container py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Przejrzyj i edytuj fiszki</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sprawdź wygenerowane fiszki, edytuj je w razie potrzeby i zapisz jako nowy zestaw do nauki.
          </p>
        </div>

        {/* Set Name Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="set-name" className="text-sm font-medium text-foreground">
                    Nazwa zestawu
                  </label>
                  <span
                    className={cn("text-sm font-medium transition-colors", {
                      "text-muted-foreground": isSetNameValid,
                      "text-destructive": !isSetNameValid,
                    })}
                    aria-live="polite"
                  >
                    {setName.length} / {MAX_SET_NAME_LENGTH}
                  </span>
                </div>
                <Input
                  id="set-name"
                  value={setName}
                  onChange={(e) => onSetNameChange(e.target.value)}
                  placeholder="np. Historia Polski - XIX wiek"
                  className={cn({
                    "border-destructive focus-visible:ring-destructive/20": !isSetNameValid && setName.length > 0,
                  })}
                  disabled={isSaving}
                  aria-invalid={!isSetNameValid && setName.length > 0}
                  aria-describedby="set-name-description"
                />
                {!isSetNameValid && setName.length > 0 && (
                  <p id="set-name-description" className="text-sm text-destructive mt-1" role="alert">
                    {setName.trim().length === 0
                      ? "Nazwa zestawu nie może być pusta"
                      : `Przekroczono maksymalną długość ${MAX_SET_NAME_LENGTH} znaków`}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" disabled={!canSave} className="w-full" aria-busy={isSaving}>
                {isSaving ? (
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
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                    Zapisz zestaw
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Flashcard Proposals List */}
        <FlashcardProposalList
          proposals={proposals}
          onUpdateProposal={onUpdateProposal}
          onDeleteProposal={onDeleteProposal}
          onToggleFlag={onToggleFlag}
        />
      </div>
    </div>
  );
}

