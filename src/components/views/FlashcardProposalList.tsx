import { FlashcardProposalItem } from "./FlashcardProposalItem";
import type { FlashcardProposalViewModel } from "@/types";

interface FlashcardProposalListProps {
  proposals: FlashcardProposalViewModel[];
  onUpdateProposal: (id: string, avers: string, rewers: string) => void;
  onDeleteProposal: (id: string) => void;
  onToggleFlag: (id: string) => void;
}

/**
 * List component for displaying flashcard proposals
 *
 * Renders a list of FlashcardProposalItem components
 */
export function FlashcardProposalList({
  proposals,
  onUpdateProposal,
  onDeleteProposal,
  onToggleFlag,
}: FlashcardProposalListProps) {
  if (proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Brak propozycji fiszek do wyświetlenia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Wygenerowane fiszki ({proposals.length})
        </h3>
        <div className="text-sm text-muted-foreground">
          {proposals.filter((p) => p.isFlagged).length > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {proposals.filter((p) => p.isFlagged).length} oflagowanych
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {proposals.map((proposal) => (
          <FlashcardProposalItem
            key={proposal.id}
            proposal={proposal}
            onUpdate={onUpdateProposal}
            onDelete={onDeleteProposal}
            onToggleFlag={onToggleFlag}
          />
        ))}
      </div>
    </div>
  );
}

