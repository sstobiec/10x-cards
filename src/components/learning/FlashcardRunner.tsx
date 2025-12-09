/**
 * FlashcardRunner Component
 *
 * Displays a flashcard with flip animation.
 * Shows front (avers/question) initially, flips to reveal back (rewers/answer).
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import type { FlashcardWithProgressDTO } from "@/types";

// ============================================================================
// Types
// ============================================================================

interface FlashcardRunnerProps {
  /** Flashcard data with optional progress */
  card: FlashcardWithProgressDTO | null;
  /** Whether the card is flipped (showing answer) */
  isFlipped: boolean;
  /** Callback when card is clicked to flip */
  onFlip: () => void;
  /** Current position in queue (1-based) */
  currentPosition?: number;
  /** Total cards in queue */
  totalCards?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function FlashcardRunner({
  card,
  isFlipped,
  onFlip,
  currentPosition,
  totalCards,
  className,
}: FlashcardRunnerProps) {
  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        onFlip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onFlip]);

  if (!card) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8",
          "min-h-[320px] w-full max-w-2xl",
          className
        )}
      >
        <p className="text-muted-foreground text-lg">Brak fiszek do wyświetlenia</p>
      </div>
    );
  }

  const { flashcard, progress } = card;

  // Determine card state badge
  const getStateBadge = () => {
    if (!progress) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          Nowa
        </span>
      );
    }

    switch (progress.state) {
      case "learning":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            W nauce
          </span>
        );
      case "review":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Powtórka
          </span>
        );
      case "relearning":
        return (
          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            Ponowna nauka
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full max-w-2xl", className)}>
      {/* Progress indicator */}
      {currentPosition !== undefined && totalCards !== undefined && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStateBadge()}
            {progress && progress.reps > 0 && (
              <span className="text-xs text-muted-foreground">Powtórzono {progress.reps}×</span>
            )}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {currentPosition} / {totalCards}
          </span>
        </div>
      )}

      {/* Flashcard with flip animation */}
      <div
        className="perspective-1000 cursor-pointer"
        onClick={onFlip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFlip();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? "Pokaż pytanie" : "Pokaż odpowiedź"}
      >
        <div
          className={cn(
            "relative min-h-[320px] w-full transition-transform duration-500",
            "transform-style-preserve-3d",
            isFlipped && "rotate-y-180"
          )}
        >
          {/* Front side (Question/Avers) */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center",
              "rounded-2xl border bg-card p-8 shadow-lg",
              "backface-hidden",
              "bg-gradient-to-br from-card to-card/80"
            )}
          >
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pytanie</div>
            <p className="text-center text-xl font-medium leading-relaxed text-card-foreground md:text-2xl">
              {flashcard.avers}
            </p>
            <div className="mt-8 text-sm text-muted-foreground">
              Kliknij lub naciśnij spację, aby zobaczyć odpowiedź
            </div>
          </div>

          {/* Back side (Answer/Rewers) */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center",
              "rounded-2xl border bg-card p-8 shadow-lg",
              "backface-hidden rotate-y-180",
              "bg-gradient-to-br from-primary/5 to-card"
            )}
          >
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary">Odpowiedź</div>
            <p className="text-center text-xl font-medium leading-relaxed text-card-foreground md:text-2xl">
              {flashcard.rewers}
            </p>
          </div>
        </div>
      </div>

      {/* Instruction text */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        {isFlipped ? <span>Oceń swoją odpowiedź poniżej</span> : <span>Spróbuj odpowiedzieć, a potem obróć kartę</span>}
      </div>
    </div>
  );
}

// ============================================================================
// CSS Classes (to be added to global styles)
// ============================================================================

/*
Add these styles to your global CSS (src/styles/global.css):

.perspective-1000 {
  perspective: 1000px;
}

.transform-style-preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
*/
