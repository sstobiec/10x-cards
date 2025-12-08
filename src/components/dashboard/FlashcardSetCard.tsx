import { useState } from "react";
import type { FlashcardSetListItemDTO } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteSetAlertDialog } from "./DeleteSetAlertDialog";
import { BookOpen, Pencil, Trash2, Sparkles, Hand } from "lucide-react";

interface FlashcardSetCardProps {
  set: FlashcardSetListItemDTO;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export function FlashcardSetCard({ set, onDelete, isDeleting }: FlashcardSetCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isAiGenerated = set.model !== "manual";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDelete = async () => {
    await onDelete(set.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card
        className="group flex flex-col h-full transition-shadow hover:shadow-md"
        role="listitem"
        aria-label={`Zestaw: ${set.name}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-lg leading-tight">{set.name}</CardTitle>
            <Badge variant={isAiGenerated ? "default" : "secondary"} className="shrink-0">
              {isAiGenerated ? (
                <>
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI
                </>
              ) : (
                <>
                  <Hand className="mr-1 h-3 w-3" />
                  Ręcznie
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-3">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{set.flashcard_count}</span>{" "}
              {set.flashcard_count === 1 ? "fiszka" : set.flashcard_count < 5 ? "fiszki" : "fiszek"}
            </p>
            <p>Utworzono: {formatDate(set.created_at)}</p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 border-t pt-3">
          <Button variant="default" size="sm" className="flex-1 gap-1.5" asChild>
            <a href={`/sets/${set.id}/study`}>
              <BookOpen className="h-4 w-4" />
              Ucz się
            </a>
          </Button>

          <Button variant="outline" size="sm" asChild aria-label={`Edytuj zestaw ${set.name}`}>
            <a href={`/sets/${set.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </a>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            aria-label={`Usuń zestaw ${set.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <DeleteSetAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        setName={set.name}
        isDeleting={isDeleting}
      />
    </>
  );
}
