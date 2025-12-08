import { FlashcardItem } from "./FlashcardItem";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";
import type { FlashcardDTO, UpdateFlashcardRequestDTO } from "@/types";

interface FlashcardListProps {
  flashcards: FlashcardDTO[];
  onUpdate: (id: string, data: UpdateFlashcardRequestDTO) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Brak fiszek</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ten zestaw nie zawiera jeszcze żadnych fiszek. Użyj formularza powyżej, aby dodać pierwszą fiszkę.
        </p>
      </CardContent>
    </Card>
  );
}

export function FlashcardList({ flashcards, onUpdate, onDelete }: FlashcardListProps) {
  if (flashcards.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Fiszki ({flashcards.length})</h2>
      </div>

      <ul className="space-y-3" aria-label="Lista fiszek">
        {flashcards.map((flashcard) => (
          <li key={flashcard.id}>
            <FlashcardItem flashcard={flashcard} onUpdate={onUpdate} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </div>
  );
}
