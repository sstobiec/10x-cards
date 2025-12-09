import { useSetEditor } from "./hooks/useSetEditor";
import { SetHeader } from "./SetHeader";
import { AddFlashcardForm } from "./AddFlashcardForm";
import { FlashcardList } from "./FlashcardList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap } from "lucide-react";
import type { FlashcardSetDetailDTO } from "@/types";

interface SetEditorProps {
  initialData: FlashcardSetDetailDTO;
}

export function SetEditor({ initialData }: SetEditorProps) {
  const { set, isAddingFlashcard, updateSetName, addFlashcard, updateFlashcard, deleteFlashcard } =
    useSetEditor(initialData);

  const hasFlashcards = set.flashcards.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild className="gap-2">
            <a href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Powrót do pulpitu
            </a>
          </Button>

          {/* Study Button */}
          {hasFlashcards && (
            <Button asChild className="gap-2">
              <a href={`/study/${set.id}`}>
                <GraduationCap className="h-4 w-4" />
                Ucz się
              </a>
            </Button>
          )}
        </div>

        {/* Header with editable title */}
        <SetHeader name={set.name} lastModified={set.updated_at} onRename={updateSetName} />

        {/* Add new flashcard form */}
        <AddFlashcardForm onAdd={addFlashcard} isSubmitting={isAddingFlashcard} />

        {/* Flashcard list */}
        <FlashcardList flashcards={set.flashcards} onUpdate={updateFlashcard} onDelete={deleteFlashcard} />
      </div>
    </main>
  );
}
