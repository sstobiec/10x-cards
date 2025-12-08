import type { FlashcardSetListItemDTO } from "@/types";
import { FlashcardSetList } from "./FlashcardSetList";
import { EmptyState } from "./EmptyState";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { ErrorDisplay } from "./ErrorDisplay";

interface DashboardContentProps {
  sets: FlashcardSetListItemDTO[];
  isLoading: boolean;
  error: string | null;
  onDelete: (id: string) => Promise<void>;
  onRetry: () => void;
  isDeleting: boolean;
}

export function DashboardContent({ sets, isLoading, error, onDelete, onRetry, isDeleting }: DashboardContentProps) {
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={onRetry} />;
  }

  if (sets.length === 0) {
    return <EmptyState />;
  }

  return <FlashcardSetList sets={sets} onDelete={onDelete} isDeleting={isDeleting} />;
}
