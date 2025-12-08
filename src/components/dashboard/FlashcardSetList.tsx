import type { FlashcardSetListItemDTO } from "@/types";
import { FlashcardSetCard } from "./FlashcardSetCard";

interface FlashcardSetListProps {
  sets: FlashcardSetListItemDTO[];
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export function FlashcardSetList({ sets, onDelete, isDeleting }: FlashcardSetListProps) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="list"
      aria-label="Lista zestawów fiszek"
    >
      {sets.map((set) => (
        <FlashcardSetCard key={set.id} set={set} onDelete={onDelete} isDeleting={isDeleting} />
      ))}
    </div>
  );
}
