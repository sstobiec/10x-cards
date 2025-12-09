import { useCallback } from "react";
import { useDashboardSets } from "./hooks/useDashboardSets";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardContent } from "./DashboardContent";
import { PaginationControls } from "./PaginationControls";

export function DashboardContainer() {
  const { sets, isLoading, error, fetchSets, createSet, deleteSet, currentPage, totalPages, isCreating, isDeleting } =
    useDashboardSets();

  const handlePageChange = useCallback(
    (page: number) => {
      fetchSets(page);
    },
    [fetchSets]
  );

  const handleRetry = useCallback(() => {
    fetchSets(currentPage);
  }, [fetchSets, currentPage]);

  const handleCreateSet = useCallback(
    async (name: string) => {
      const createdSet = await createSet(name);
      // Redirect to edit page after successful creation
      window.location.href = `/sets/${createdSet.id}`;
    },
    [createSet]
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardHeader onCreateSet={handleCreateSet} isCreating={isCreating} />

        <DashboardContent
          sets={sets}
          isLoading={isLoading}
          error={error}
          onDelete={deleteSet}
          onRetry={handleRetry}
          isDeleting={isDeleting}
        />

        {!isLoading && !error && sets.length > 0 && totalPages > 1 && (
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>
    </main>
  );
}
