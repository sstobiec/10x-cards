import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FlashcardProposalViewModel } from "@/types";

interface FlashcardProposalItemProps {
  proposal: FlashcardProposalViewModel;
  onUpdate: (id: string, avers: string, rewers: string) => void;
  onDelete: (id: string) => void;
  onToggleFlag: (id: string) => void;
}

const MAX_AVERS_LENGTH = 200;
const MAX_REWERS_LENGTH = 750;

/**
 * Individual flashcard proposal item with view and edit modes
 *
 * Features:
 * - View mode: Display flashcard content with action buttons
 * - Edit mode: Editable fields with validation
 * - Flag indicator for low quality flashcards
 * - Delete and flag actions
 */
export function FlashcardProposalItem({ proposal, onUpdate, onDelete, onToggleFlag }: FlashcardProposalItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAvers, setEditedAvers] = useState(proposal.avers);
  const [editedRewers, setEditedRewers] = useState(proposal.rewers);

  // Validation
  const isAversValid = editedAvers.trim().length > 0 && editedAvers.length <= MAX_AVERS_LENGTH;
  const isRewersValid = editedRewers.trim().length > 0 && editedRewers.length <= MAX_REWERS_LENGTH;
  const isValid = isAversValid && isRewersValid;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (isValid) {
      onUpdate(proposal.id, editedAvers.trim(), editedRewers.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedAvers(proposal.avers);
    setEditedRewers(proposal.rewers);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(proposal.id);
  };

  const handleToggleFlag = () => {
    onToggleFlag(proposal.id);
  };

  // ============================================================================
  // View Mode
  // ============================================================================

  if (!isEditing) {
    return (
      <div
        className={cn(
          "border rounded-lg p-4 sm:p-6 bg-card transition-all",
          proposal.isFlagged && "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {proposal.source === "ai-edited" && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Edytowane
              </span>
            )}
            {proposal.isFlagged && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                Oflagowane
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleEdit} variant="outline" size="sm">
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edytuj
            </Button>

            <Button
              onClick={handleToggleFlag}
              variant={proposal.isFlagged ? "default" : "outline"}
              size="sm"
              title={proposal.isFlagged ? "Usuń flagę" : "Oflaguj jako słabą jakość"}
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill={proposal.isFlagged ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
            </Button>

            <Button onClick={handleDelete} variant="destructive" size="sm">
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Usuń
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Awers (Pytanie)</h4>
            <p className="text-base text-foreground">{proposal.avers}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Rewers (Odpowiedź)</h4>
            <p className="text-base text-foreground whitespace-pre-wrap">{proposal.rewers}</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Edit Mode
  // ============================================================================

  return (
    <div className="border-2 border-primary rounded-lg p-4 sm:p-6 bg-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <span className="text-sm font-medium text-primary">Tryb edycji</span>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleSave} variant="default" size="sm" disabled={!isValid}>
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Zapisz
          </Button>

          <Button onClick={handleCancel} variant="outline" size="sm">
            Anuluj
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={`avers-${proposal.id}`} className="text-sm font-semibold text-muted-foreground">
              Awers (Pytanie)
            </label>
            <span
              className={cn("text-xs font-medium", {
                "text-muted-foreground": isAversValid,
                "text-destructive": !isAversValid,
              })}
            >
              {editedAvers.length} / {MAX_AVERS_LENGTH}
            </span>
          </div>
          <Input
            id={`avers-${proposal.id}`}
            value={editedAvers}
            onChange={(e) => setEditedAvers(e.target.value)}
            className={cn({
              "border-destructive focus-visible:ring-destructive/20": !isAversValid,
            })}
            aria-invalid={!isAversValid}
          />
          {!isAversValid && (
            <p className="text-xs text-destructive mt-1">
              {editedAvers.trim().length === 0
                ? "Awers nie może być pusty"
                : `Przekroczono limit ${MAX_AVERS_LENGTH} znaków`}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={`rewers-${proposal.id}`} className="text-sm font-semibold text-muted-foreground">
              Rewers (Odpowiedź)
            </label>
            <span
              className={cn("text-xs font-medium", {
                "text-muted-foreground": isRewersValid,
                "text-destructive": !isRewersValid,
              })}
            >
              {editedRewers.length} / {MAX_REWERS_LENGTH}
            </span>
          </div>
          <Textarea
            id={`rewers-${proposal.id}`}
            value={editedRewers}
            onChange={(e) => setEditedRewers(e.target.value)}
            className={cn("min-h-[120px] resize-y", {
              "border-destructive focus-visible:ring-destructive/20": !isRewersValid,
            })}
            aria-invalid={!isRewersValid}
          />
          {!isRewersValid && (
            <p className="text-xs text-destructive mt-1">
              {editedRewers.trim().length === 0
                ? "Rewers nie może być pusty"
                : `Przekroczono limit ${MAX_REWERS_LENGTH} znaków`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

