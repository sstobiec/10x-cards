import { Button } from "@/components/ui/button";
import { CreateSetDialog } from "./CreateSetDialog";
import { Plus, Sparkles } from "lucide-react";

interface DashboardHeaderProps {
  onCreateSet: (name: string) => Promise<void>;
  isCreating: boolean;
}

export function DashboardHeader({ onCreateSet, isCreating }: DashboardHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Twoje zestawy fiszek</h1>
          <p className="mt-1 text-muted-foreground">Zarządzaj swoimi zestawami fiszek i rozpocznij naukę</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <CreateSetDialog onCreateSet={onCreateSet} isCreating={isCreating}>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Stwórz ręcznie
            </Button>
          </CreateSetDialog>

          <Button asChild className="gap-2">
            <a href="/generate">
              <Sparkles className="h-4 w-4" />
              Generuj z tekstu
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
