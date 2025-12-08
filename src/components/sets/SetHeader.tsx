import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Loader2 } from "lucide-react";

interface SetHeaderProps {
  name: string;
  lastModified: string;
  onRename: (newName: string) => Promise<void>;
}

const MAX_NAME_LENGTH = 100;

export function SetHeader({ name, lastModified, onRename }: SetHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync editValue when name prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(name);
    }
  }, [name, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Nazwa zestawu jest wymagana";
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      return `Nazwa nie może przekraczać ${MAX_NAME_LENGTH} znaków`;
    }
    return null;
  };

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setError(null);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(name);
    setError(null);
  }, [name]);

  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim();

    // Skip if no change
    if (trimmedValue === name) {
      setIsEditing(false);
      return;
    }

    // Validate
    const validationError = validateName(trimmedValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onRename(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zmienić nazwy";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, name, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    // Only auto-save on blur if not already saving
    if (!isSaving) {
      handleSave();
    }
  }, [isSaving, handleSave]);

  const formattedDate = new Date(lastModified).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="mb-8">
      <div className="flex items-center gap-3">
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              disabled={isSaving}
              maxLength={MAX_NAME_LENGTH}
              className="text-2xl font-bold h-auto py-1 px-2"
              aria-label="Nazwa zestawu"
              aria-invalid={!!error}
              aria-describedby={error ? "name-error" : undefined}
            />
            <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving} aria-label="Zapisz nazwę">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isSaving} aria-label="Anuluj edycję">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{name}</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={handleStartEdit} aria-label="Edytuj nazwę zestawu">
              <Pencil className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {error && (
        <p id="name-error" className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <p className="mt-2 text-sm text-muted-foreground">Ostatnia modyfikacja: {formattedDate}</p>
    </header>
  );
}
