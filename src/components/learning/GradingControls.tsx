/**
 * GradingControls Component
 *
 * Displays rating buttons for spaced repetition grading.
 * Based on FSRS algorithm ratings:
 * - 1 (Again): Complete failure to recall
 * - 2 (Hard): Recalled with significant difficulty
 * - 3 (Good): Recalled with some effort
 * - 4 (Easy): Recalled effortlessly
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { FSRSRating } from "@/types";

// ============================================================================
// Types
// ============================================================================

interface GradingControlsProps {
  /** Callback when a grade is selected */
  onGrade: (rating: FSRSRating) => void;
  /** Whether the controls are disabled (e.g., during submission) */
  disabled?: boolean;
  /** Whether grading controls should be visible (show only after flip) */
  visible?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface GradeButtonConfig {
  rating: FSRSRating;
  label: string;
  shortcut: string;
  description: string;
  variant: "destructive" | "outline" | "secondary" | "default";
  className: string;
}

// ============================================================================
// Constants
// ============================================================================

const GRADE_BUTTONS: GradeButtonConfig[] = [
  {
    rating: 1,
    label: "Nie pamiętam",
    shortcut: "1",
    description: "Zapomniane - powtórka wkrótce",
    variant: "destructive",
    className: "hover:bg-red-600 dark:hover:bg-red-700",
  },
  {
    rating: 2,
    label: "Trudne",
    shortcut: "2",
    description: "Przypomniałem sobie z trudem",
    variant: "outline",
    className:
      "border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950",
  },
  {
    rating: 3,
    label: "Dobrze",
    shortcut: "3",
    description: "Przypomniałem sobie poprawnie",
    variant: "secondary",
    className:
      "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60",
  },
  {
    rating: 4,
    label: "Łatwe",
    shortcut: "4",
    description: "Bez problemu!",
    variant: "default",
    className: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
  },
];

// ============================================================================
// Component
// ============================================================================

export function GradingControls({ onGrade, disabled = false, visible = true, className }: GradingControlsProps) {
  // Handle keyboard shortcuts
  React.useEffect(() => {
    if (!visible || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;
      if (key >= "1" && key <= "4") {
        e.preventDefault();
        onGrade(parseInt(key) as FSRSRating);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onGrade, visible, disabled]);

  if (!visible) {
    return null;
  }

  return (
    <div className={cn("w-full max-w-2xl", className)}>
      {/* Main grade buttons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GRADE_BUTTONS.map((config) => (
          <Button
            key={config.rating}
            variant={config.variant}
            className={cn("h-auto flex-col gap-1 py-4", config.className)}
            onClick={() => onGrade(config.rating)}
            disabled={disabled}
            aria-label={`${config.label} - ${config.description}`}
          >
            <span className="text-base font-semibold">{config.label}</span>
            <span className="text-xs opacity-75">({config.shortcut})</span>
          </Button>
        ))}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        <span className="hidden sm:inline">
          Skróty klawiaturowe: <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">1</kbd>-
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">4</kbd>
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Compact Variant
// ============================================================================

interface CompactGradingControlsProps {
  onGrade: (rating: FSRSRating) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Compact version of grading controls for smaller screens or embedded use
 */
export function CompactGradingControls({ onGrade, disabled = false, className }: CompactGradingControlsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => onGrade(1)}
        disabled={disabled}
        className="px-3"
        title="Nie pamiętam (1)"
      >
        ✗
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onGrade(2)}
        disabled={disabled}
        className="border-orange-300 px-3 text-orange-700 dark:border-orange-700 dark:text-orange-400"
        title="Trudne (2)"
      >
        ~
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onGrade(3)}
        disabled={disabled}
        className="bg-emerald-100 px-3 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
        title="Dobrze (3)"
      >
        ✓
      </Button>
      <Button
        size="sm"
        variant="default"
        onClick={() => onGrade(4)}
        disabled={disabled}
        className="bg-blue-600 px-3 hover:bg-blue-700"
        title="Łatwe (4)"
      >
        ✓✓
      </Button>
    </div>
  );
}
