import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useEditableFlashcard } from "./hooks/useEditableFlashcard";
import { Pencil, Flag, Trash2, Check } from "lucide-react";
import type { FlashcardProposalViewModel } from "@/types";

interface FlashcardProposalItemProps {
  proposal: FlashcardProposalViewModel;
  onUpdate: (id: string, avers: string, rewers: string) => void;
  onDelete: (id: string) => void;
  onToggleFlag: (id: string) => void;
}

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
  const {
    isEditing,
    editedAvers,
    editedRewers,
    isAversFieldValid,
    isRewersFieldValid,
    isFormValid,
    aversErrorMessage,
    rewersErrorMessage,
    aversMaxLength,
    rewersMaxLength,
    setEditedAvers,
    setEditedRewers,
    startEditing,
    cancelEditing,
    saveEditing,
  } = useEditableFlashcard(proposal);

  const handleSave = () => {
    saveEditing((avers, rewers) => onUpdate(proposal.id, avers, rewers));
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
        data-testid="flashcard-proposal-item"
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
            <Button onClick={startEditing} variant="outline" size="sm" data-testid="edit-flashcard-button">
              <Pencil className="h-4 w-4" />
              Edytuj
            </Button>

            <Button
              onClick={handleToggleFlag}
              variant={proposal.isFlagged ? "default" : "outline"}
              size="sm"
              title={proposal.isFlagged ? "Usuń flagę" : "Oflaguj jako słabą jakość"}
              data-testid="flag-flashcard-button"
            >
              <Flag className="h-4 w-4" fill={proposal.isFlagged ? "currentColor" : "none"} />
            </Button>

            <Button onClick={handleDelete} variant="destructive" size="sm" data-testid="delete-flashcard-button">
              <Trash2 className="h-4 w-4" />
              Usuń
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Awers (Pytanie)</h4>
            <p className="text-base text-foreground" data-testid="flashcard-avers">
              {proposal.avers}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Rewers (Odpowiedź)</h4>
            <p className="text-base text-foreground whitespace-pre-wrap" data-testid="flashcard-rewers">
              {proposal.rewers}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Edit Mode
  // ============================================================================

  return (
    <div className="border-2 border-primary rounded-lg p-4 sm:p-6 bg-card" data-testid="flashcard-proposal-item">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <span className="text-sm font-medium text-primary">Tryb edycji</span>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleSave}
            variant="default"
            size="sm"
            disabled={!isFormValid}
            data-testid="save-edit-flashcard-button"
          >
            <Check className="h-4 w-4" />
            Zapisz
          </Button>

          <Button onClick={cancelEditing} variant="outline" size="sm" data-testid="cancel-edit-flashcard-button">
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
                "text-muted-foreground": isAversFieldValid,
                "text-destructive": !isAversFieldValid,
              })}
            >
              {editedAvers.length} / {aversMaxLength}
            </span>
          </div>
          <Input
            id={`avers-${proposal.id}`}
            value={editedAvers}
            onChange={(e) => setEditedAvers(e.target.value)}
            className={cn({
              "border-destructive focus-visible:ring-destructive/20": !isAversFieldValid,
            })}
            aria-invalid={!isAversFieldValid}
            data-testid="edit-flashcard-avers-input"
          />
          {!isAversFieldValid && aversErrorMessage && (
            <p className="text-xs text-destructive mt-1">{aversErrorMessage}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={`rewers-${proposal.id}`} className="text-sm font-semibold text-muted-foreground">
              Rewers (Odpowiedź)
            </label>
            <span
              className={cn("text-xs font-medium", {
                "text-muted-foreground": isRewersFieldValid,
                "text-destructive": !isRewersFieldValid,
              })}
            >
              {editedRewers.length} / {rewersMaxLength}
            </span>
          </div>
          <Textarea
            id={`rewers-${proposal.id}`}
            value={editedRewers}
            onChange={(e) => setEditedRewers(e.target.value)}
            className={cn("min-h-[120px] resize-y", {
              "border-destructive focus-visible:ring-destructive/20": !isRewersFieldValid,
            })}
            aria-invalid={!isRewersFieldValid}
            data-testid="edit-flashcard-rewers-input"
          />
          {!isRewersFieldValid && rewersErrorMessage && (
            <p className="text-xs text-destructive mt-1">{rewersErrorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
