/**
 * LearningSession Component
 *
 * Main container component for a learning session.
 * Combines FlashcardRunner, GradingControls, and SessionSummary
 * to provide a complete learning experience.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FlashcardRunner } from "./FlashcardRunner";
import { GradingControls } from "./GradingControls";
import { SessionSummary } from "./SessionSummary";
import { useLearningSession } from "./hooks/useLearningSession";

// ============================================================================
// Types
// ============================================================================

interface LearningSessionProps {
  /** ID of the flashcard set to study */
  setId: string;
  /** Maximum number of cards per session (default: 20) */
  limit?: number;
  /** Callback when user wants to go back */
  onBack?: () => void;
  /** URL to navigate back to (alternative to onBack) */
  backUrl?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Loading Component
// ============================================================================

function LoadingState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="mt-4 text-muted-foreground">Ładowanie fiszek...</p>
    </div>
  );
}

// ============================================================================
// Error Component
// ============================================================================

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onBack?: () => void;
}

function ErrorState({ message, onRetry, onBack }: ErrorStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="mb-4 text-5xl">😕</div>
      <h3 className="mb-2 text-lg font-semibold">Wystąpił błąd</h3>
      <p className="mb-6 text-muted-foreground">{message}</p>
      <div className="flex gap-3">
        <Button onClick={onRetry}>Spróbuj ponownie</Button>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Wróć
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  onBack?: () => void;
}

function EmptyState({ onBack }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="mb-4 text-5xl">🎉</div>
      <h3 className="mb-2 text-lg font-semibold">Wszystko przejrzane!</h3>
      <p className="mb-6 text-muted-foreground">Brak fiszek do nauki w tym momencie. Wróć później!</p>
      {onBack && (
        <Button variant="outline" onClick={onBack}>
          Wróć do zestawu
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LearningSession({ setId, limit = 20, onBack, backUrl, className }: LearningSessionProps) {
  const {
    state,
    queue,
    currentIndex,
    currentCard,
    isFlipped,
    stats,
    totalDue,
    totalNew,
    error,
    isSubmitting,
    flipCard,
    submitGrade,
    restartSession,
    fetchQueue,
  } = useLearningSession(setId, limit);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      window.location.assign(backUrl);
    }
  };

  // Render based on session state
  const renderContent = () => {
    switch (state) {
      case "loading":
        return <LoadingState />;

      case "error":
        return (
          <ErrorState
            message={error || "Wystąpił nieoczekiwany błąd"}
            onRetry={fetchQueue}
            onBack={onBack || backUrl ? handleBack : undefined}
          />
        );

      case "completed":
        // Show summary if cards were studied, otherwise empty state
        if (stats.cardsStudied > 0) {
          return (
            <SessionSummary
              stats={stats}
              onRestartSession={restartSession}
              onBackToSet={onBack || backUrl ? handleBack : undefined}
            />
          );
        }
        return <EmptyState onBack={onBack || backUrl ? handleBack : undefined} />;

      case "studying":
      case "ready":
        return (
          <div className="flex flex-col items-center gap-8">
            {/* Session progress header */}
            <div className="flex w-full max-w-2xl items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                {totalNew > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    {totalNew} nowych
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {totalDue} do powtórki
                </span>
              </div>
              {(onBack || backUrl) && (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  ← Wróć
                </Button>
              )}
            </div>

            {/* Flashcard */}
            <FlashcardRunner
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={flipCard}
              currentPosition={currentIndex + 1}
              totalCards={queue.length}
            />

            {/* Grading controls - only visible when flipped */}
            <GradingControls onGrade={submitGrade} disabled={isSubmitting} visible={isFlipped} />

            {/* Submitting indicator */}
            {isSubmitting && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Zapisywanie...
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return <div className={cn("flex flex-col items-center px-4 py-8", className)}>{renderContent()}</div>;
}
