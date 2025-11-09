import { useGeneration } from "./hooks/useGeneration";
import { GenerationForm } from "./GenerationForm";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorDisplay } from "./ErrorDisplay";
import { ReviewSection } from "./ReviewSection";
import { SuccessDisplay } from "./SuccessDisplay";

/**
 * Main view component for the flashcard generation flow
 *
 * Orchestrates the entire generation process:
 * 1. User inputs text (GenerationForm)
 * 2. AI generates proposals (LoadingSpinner)
 * 3. User reviews and edits (ReviewSection)
 * 4. User saves the set (LoadingSpinner)
 * 5. Success confirmation (SuccessDisplay)
 *
 * Error states are handled throughout with ErrorDisplay
 */
export function GenerationView() {
  const {
    state,
    text,
    setText,
    setName,
    setSetName,
    proposals,
    error,
    savedSetInfo,
    generateProposals,
    saveFlashcardSet,
    updateProposal,
    deleteProposal,
    toggleFlag,
    reset,
  } = useGeneration();

  // ============================================================================
  // Render based on state
  // ============================================================================

  // State: error
  if (state === "error" && error) {
    // Determine retry action based on available data
    const handleRetry = () => {
      if (proposals.length > 0) {
        // If we have proposals, error likely occurred during save
        saveFlashcardSet();
      } else {
        // Otherwise, error occurred during generation
        generateProposals();
      }
    };

    return (
      <ErrorDisplay 
        error={error} 
        onRetry={handleRetry} 
        onReset={reset}
      />
    );
  }

  // State: idle
  if (state === "idle") {
    return (
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Generuj fiszki z AI</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Wklej swoje notatki, a sztuczna inteligencja automatycznie wygeneruje dla Ciebie fiszki do nauki.
          </p>
        </div>

        <GenerationForm
          text={text}
          onTextChange={setText}
          onGenerate={generateProposals}
          isLoading={false}
        />
      </div>
    );
  }

  // State: generating
  if (state === "generating") {
    return (
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Generuj fiszki z AI</h1>
        </div>
        <LoadingSpinner message="Generowanie fiszek za pomocą AI..." />
      </div>
    );
  }

  // State: reviewing
  if (state === "reviewing") {
    return (
      <ReviewSection
        proposals={proposals}
        setName={setName}
        onSetNameChange={setSetName}
        onSave={saveFlashcardSet}
        onUpdateProposal={updateProposal}
        onDeleteProposal={deleteProposal}
        onToggleFlag={toggleFlag}
        isSaving={false}
      />
    );
  }

  // State: saving
  if (state === "saving") {
    return (
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Zapisywanie zestawu</h1>
        </div>
        <LoadingSpinner message="Zapisywanie zestawu fiszek..." />
      </div>
    );
  }

  // State: success
  if (state === "success" && savedSetInfo) {
    return <SuccessDisplay savedSetInfo={savedSetInfo} onReset={reset} />;
  }

  // Fallback (should not be reached in normal flow)
  return (
    <div className="container py-12">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Nieoczekiwany stan</h2>
        <p className="text-muted-foreground mt-2 mb-4">Wystąpił nieoczekiwany błąd.</p>
        <button onClick={reset} className="text-primary hover:underline">
          Wróć do początku
        </button>
      </div>
    </div>
  );
}

