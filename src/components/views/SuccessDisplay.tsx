import { Button } from "@/components/ui/button";
import type { CreateFlashcardSetResponseDTO } from "@/types";

interface SuccessDisplayProps {
  savedSetInfo: CreateFlashcardSetResponseDTO;
  onReset: () => void;
}

/**
 * Success display component after saving flashcard set
 *
 * Shows confirmation with set details and navigation options
 */
export function SuccessDisplay({ savedSetInfo, onReset }: SuccessDisplayProps) {
  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
              <svg
                className="h-16 w-16 text-green-600 dark:text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success Title */}
          <h2 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
            Zestaw zapisany!
          </h2>

          {/* Success Message */}
          <p className="text-base text-green-800 dark:text-green-200 mb-6">
            Twój zestaw fiszek został pomyślnie utworzony i jest gotowy do nauki.
          </p>

          {/* Set Details */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mb-6 text-left border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-foreground mb-4">Szczegóły zestawu</h3>
            
            <dl className="space-y-3">
              <div className="flex justify-between items-start">
                <dt className="text-sm font-medium text-muted-foreground">Nazwa zestawu:</dt>
                <dd className="text-sm font-semibold text-foreground text-right ml-4">{savedSetInfo.name}</dd>
              </div>
              
              <div className="flex justify-between items-start">
                <dt className="text-sm font-medium text-muted-foreground">Liczba fiszek:</dt>
                <dd className="text-sm font-semibold text-foreground">{savedSetInfo.flashcard_count}</dd>
              </div>
              
              <div className="flex justify-between items-start">
                <dt className="text-sm font-medium text-muted-foreground">Model AI:</dt>
                <dd className="text-sm text-foreground font-mono">{savedSetInfo.model}</dd>
              </div>
              
              <div className="flex justify-between items-start">
                <dt className="text-sm font-medium text-muted-foreground">Czas generowania:</dt>
                <dd className="text-sm text-foreground">
                  {(savedSetInfo.generation_duration / 1000).toFixed(2)}s
                </dd>
              </div>
              
              <div className="flex justify-between items-start">
                <dt className="text-sm font-medium text-muted-foreground">Data utworzenia:</dt>
                <dd className="text-sm text-foreground">
                  {new Date(savedSetInfo.created_at).toLocaleString("pl-PL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default" size="lg">
              <a href={`/sets/${savedSetInfo.id}`}>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Rozpocznij naukę
              </a>
            </Button>

            <Button onClick={onReset} variant="outline" size="lg">
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Generuj kolejny zestaw
            </Button>

            <Button asChild variant="ghost" size="lg">
              <a href="/sets">
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Zobacz wszystkie zestawy
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

