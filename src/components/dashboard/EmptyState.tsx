import { Button } from "@/components/ui/button";
import { FolderOpen, Sparkles } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <FolderOpen className="h-10 w-10 text-muted-foreground" />
      </div>

      <h2 className="mb-2 text-xl font-semibold text-foreground">Brak zestawów fiszek</h2>

      <p className="mb-6 max-w-sm text-muted-foreground">
        Nie masz jeszcze żadnych zestawów fiszek. Zacznij naukę, generując fiszki z tekstu lub tworząc je ręcznie.
      </p>

      <Button asChild className="gap-2">
        <a href="/generate">
          <Sparkles className="h-4 w-4" />
          Wygeneruj pierwszy zestaw
        </a>
      </Button>
    </div>
  );
}
