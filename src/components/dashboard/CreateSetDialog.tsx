import { useState, type ReactNode, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateSetDialogProps {
  children: ReactNode;
  onCreateSet: (name: string) => Promise<void>;
  isCreating: boolean;
}

const MAX_NAME_LENGTH = 100;

export function CreateSetDialog({ children, onCreateSet, isCreating }: CreateSetDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const isValid = trimmedName.length > 0 && trimmedName.length <= MAX_NAME_LENGTH;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError("Nazwa zestawu jest wymagana (max 100 znaków)");
      return;
    }

    try {
      await onCreateSet(trimmedName);
      setOpen(false);
      setName("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił błąd podczas tworzenia zestawu";
      setError(message);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setName("");
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nowy zestaw fiszek</DialogTitle>
            <DialogDescription>
              Wprowadź nazwę dla nowego zestawu. Po utworzeniu zostaniesz przekierowany do edytora.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6">
            <Label htmlFor="set-name" className="mb-2 block">
              Nazwa zestawu
            </Label>
            <Input
              id="set-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Słówka angielskie"
              maxLength={MAX_NAME_LENGTH}
              disabled={isCreating}
              aria-describedby={error ? "name-error" : undefined}
              aria-invalid={!!error}
            />
            <div className="mt-1 flex justify-between text-xs">
              {error ? (
                <span id="name-error" className="text-destructive" role="alert">
                  {error}
                </span>
              ) : (
                <span className="text-muted-foreground">Wymagane</span>
              )}
              <span className="text-muted-foreground">
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isCreating}>
              Anuluj
            </Button>
            <Button type="submit" disabled={!isValid || isCreating}>
              {isCreating ? "Tworzenie..." : "Utwórz zestaw"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
