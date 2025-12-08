import { useState, useCallback } from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Check, X, Loader2, Flag, Sparkles, User } from "lucide-react";
import type { FlashcardDTO, UpdateFlashcardRequestDTO } from "@/types";

interface FlashcardItemProps {
  flashcard: FlashcardDTO;
  onUpdate: (id: string, data: UpdateFlashcardRequestDTO) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const MAX_AVERS_LENGTH = 200;
const MAX_REWERS_LENGTH = 750;

const updateSchema = z.object({
  avers: z
    .string()
    .min(1, "Pytanie jest wymagane")
    .max(MAX_AVERS_LENGTH, `Pytanie nie może przekraczać ${MAX_AVERS_LENGTH} znaków`),
  rewers: z
    .string()
    .min(1, "Odpowiedź jest wymagana")
    .max(MAX_REWERS_LENGTH, `Odpowiedź nie może przekraczać ${MAX_REWERS_LENGTH} znaków`),
});

interface FormErrors {
  avers?: string;
  rewers?: string;
}

// ============================================================================
// FlashcardDisplay - Read Mode
// ============================================================================

interface FlashcardDisplayProps {
  flashcard: FlashcardDTO;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

function FlashcardDisplay({ flashcard, onEdit, onDelete, isDeleting }: FlashcardDisplayProps) {
  const sourceLabel =
    flashcard.source === "manual" ? "Ręczna" : flashcard.source === "ai-full" ? "AI" : "AI (edytowana)";
  const SourceIcon = flashcard.source === "manual" ? User : Sparkles;

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Content */}
          <div className="flex-1 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Pytanie</p>
              <p className="text-sm whitespace-pre-wrap">{flashcard.avers}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Odpowiedź</p>
              <p className="text-sm whitespace-pre-wrap">{flashcard.rewers}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs gap-1">
                <SourceIcon className="h-3 w-3" />
                {sourceLabel}
              </Badge>
              {flashcard.flagged && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <Flag className="h-3 w-3" />
                  Oflagowana
                </Badge>
              )}
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edytuj fiszkę">
                <Pencil className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    aria-label="Usuń fiszkę"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Usuń fiszkę</AlertDialogTitle>
                    <AlertDialogDescription>
                      Czy na pewno chcesz usunąć tę fiszkę? Ta operacja jest nieodwracalna.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Usuwanie...
                        </>
                      ) : (
                        "Usuń"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// FlashcardEditForm - Edit Mode
// ============================================================================

interface FlashcardEditFormProps {
  flashcard: FlashcardDTO;
  onSave: (data: UpdateFlashcardRequestDTO) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function FlashcardEditForm({ flashcard, onSave, onCancel, isSaving }: FlashcardEditFormProps) {
  const [avers, setAvers] = useState(flashcard.avers);
  const [rewers, setRewers] = useState(flashcard.rewers);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const result = updateSchema.safeParse({ avers: avers.trim(), rewers: rewers.trim() });

      if (!result.success) {
        const fieldErrors: FormErrors = {};
        result.error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          if (field) {
            fieldErrors[field] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      setErrors({});

      // Only send changed fields
      const updateData: UpdateFlashcardRequestDTO = {};
      if (result.data.avers !== flashcard.avers) {
        updateData.avers = result.data.avers;
      }
      if (result.data.rewers !== flashcard.rewers) {
        updateData.rewers = result.data.rewers;
      }

      // Skip if nothing changed
      if (Object.keys(updateData).length === 0) {
        onCancel();
        return;
      }

      await onSave(updateData);
    },
    [avers, rewers, flashcard.avers, flashcard.rewers, onSave, onCancel]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        onCancel();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [onCancel, handleSubmit]
  );

  return (
    <Card className="border-primary">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Avers */}
            <div className="space-y-2">
              <Label htmlFor={`edit-avers-${flashcard.id}`} className="flex justify-between">
                <span>Pytanie (awers)</span>
                <span className="text-xs text-muted-foreground">
                  {avers.length}/{MAX_AVERS_LENGTH}
                </span>
              </Label>
              <Textarea
                id={`edit-avers-${flashcard.id}`}
                value={avers}
                onChange={(e) => setAvers(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={MAX_AVERS_LENGTH}
                disabled={isSaving}
                rows={3}
                className="resize-none"
                aria-invalid={!!errors.avers}
                aria-describedby={errors.avers ? `edit-avers-error-${flashcard.id}` : undefined}
              />
              {errors.avers && (
                <p id={`edit-avers-error-${flashcard.id}`} className="text-sm text-destructive" role="alert">
                  {errors.avers}
                </p>
              )}
            </div>

            {/* Rewers */}
            <div className="space-y-2">
              <Label htmlFor={`edit-rewers-${flashcard.id}`} className="flex justify-between">
                <span>Odpowiedź (rewers)</span>
                <span className="text-xs text-muted-foreground">
                  {rewers.length}/{MAX_REWERS_LENGTH}
                </span>
              </Label>
              <Textarea
                id={`edit-rewers-${flashcard.id}`}
                value={rewers}
                onChange={(e) => setRewers(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={MAX_REWERS_LENGTH}
                disabled={isSaving}
                rows={3}
                className="resize-none"
                aria-invalid={!!errors.rewers}
                aria-describedby={errors.rewers ? `edit-rewers-error-${flashcard.id}` : undefined}
              />
              {errors.rewers && (
                <p id={`edit-rewers-error-${flashcard.id}`} className="text-sm text-destructive" role="alert">
                  {errors.rewers}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Anuluj
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Zapisz
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// FlashcardItem - Main Component
// ============================================================================

export function FlashcardItem({ flashcard, onUpdate, onDelete }: FlashcardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(
    async (data: UpdateFlashcardRequestDTO) => {
      setIsSaving(true);
      try {
        await onUpdate(flashcard.id, data);
        setIsEditing(false);
      } finally {
        setIsSaving(false);
      }
    },
    [flashcard.id, onUpdate]
  );

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete(flashcard.id);
    } finally {
      setIsDeleting(false);
    }
  }, [flashcard.id, onDelete]);

  if (isEditing) {
    return <FlashcardEditForm flashcard={flashcard} onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />;
  }

  return <FlashcardDisplay flashcard={flashcard} onEdit={handleEdit} onDelete={handleDelete} isDeleting={isDeleting} />;
}
