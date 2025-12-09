/**
 * SessionSummary Component
 *
 * Displays summary statistics after completing a learning session.
 * Shows cards studied, rating distribution, and session duration.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { SessionStats } from "./hooks/useLearningSession";

// ============================================================================
// Types
// ============================================================================

interface SessionSummaryProps {
  /** Session statistics */
  stats: SessionStats;
  /** Callback to start a new session */
  onRestartSession: () => void;
  /** Callback to go back to set view */
  onBackToSet?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDuration(start: Date, end: Date | null): string {
  if (!end) return "W trakcie...";

  const durationMs = end.getTime() - start.getTime();
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds} sek.`;
  }

  return `${minutes} min ${remainingSeconds} sek.`;
}

function getPerformanceMessage(stats: SessionStats): { message: string; emoji: string } {
  const total = stats.cardsStudied;
  if (total === 0) {
    return { message: "Brak danych do analizy", emoji: "📊" };
  }

  const successRate = ((stats.goodCount + stats.easyCount) / total) * 100;

  if (successRate >= 90) {
    return { message: "Doskonała sesja! Świetnie znasz ten materiał!", emoji: "🌟" };
  }
  if (successRate >= 75) {
    return { message: "Bardzo dobra sesja! Kontynuuj tak dalej!", emoji: "🎉" };
  }
  if (successRate >= 50) {
    return { message: "Dobra robota! Widzę postępy!", emoji: "👍" };
  }
  if (successRate >= 25) {
    return { message: "Potrzebujesz więcej powtórek - to normalne!", emoji: "💪" };
  }
  return { message: "Nowy materiał wymaga czasu - nie poddawaj się!", emoji: "🌱" };
}

// ============================================================================
// Component
// ============================================================================

export function SessionSummary({ stats, onRestartSession, onBackToSet, className }: SessionSummaryProps) {
  const performance = getPerformanceMessage(stats);
  const duration = formatDuration(stats.startTime, stats.endTime);

  // Calculate percentages for visualization
  const total = stats.cardsStudied || 1; // Prevent division by zero
  const againPercent = (stats.againCount / total) * 100;
  const hardPercent = (stats.hardCount / total) * 100;
  const goodPercent = (stats.goodCount / total) * 100;
  const easyPercent = (stats.easyCount / total) * 100;

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="text-center">
        <div className="mb-2 text-4xl">{performance.emoji}</div>
        <CardTitle className="text-2xl">Sesja zakończona!</CardTitle>
        <CardDescription>{performance.message}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-lg bg-muted p-4">
            <div className="text-3xl font-bold text-foreground">{stats.cardsStudied}</div>
            <div className="text-sm text-muted-foreground">Przejrzanych fiszek</div>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <div className="text-3xl font-bold text-foreground">{duration}</div>
            <div className="text-sm text-muted-foreground">Czas sesji</div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Rozkład ocen</h4>

          {/* Visual bar */}
          <div className="flex h-4 overflow-hidden rounded-full bg-muted">
            {stats.againCount > 0 && (
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${againPercent}%` }}
                title={`Nie pamiętam: ${stats.againCount}`}
              />
            )}
            {stats.hardCount > 0 && (
              <div
                className="bg-orange-500 transition-all"
                style={{ width: `${hardPercent}%` }}
                title={`Trudne: ${stats.hardCount}`}
              />
            )}
            {stats.goodCount > 0 && (
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${goodPercent}%` }}
                title={`Dobrze: ${stats.goodCount}`}
              />
            )}
            {stats.easyCount > 0 && (
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${easyPercent}%` }}
                title={`Łatwe: ${stats.easyCount}`}
              />
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="mb-1 h-2 w-full rounded bg-red-500" />
              <span className="text-muted-foreground">Nie pamiętam</span>
              <div className="font-medium">{stats.againCount}</div>
            </div>
            <div>
              <div className="mb-1 h-2 w-full rounded bg-orange-500" />
              <span className="text-muted-foreground">Trudne</span>
              <div className="font-medium">{stats.hardCount}</div>
            </div>
            <div>
              <div className="mb-1 h-2 w-full rounded bg-emerald-500" />
              <span className="text-muted-foreground">Dobrze</span>
              <div className="font-medium">{stats.goodCount}</div>
            </div>
            <div>
              <div className="mb-1 h-2 w-full rounded bg-blue-500" />
              <span className="text-muted-foreground">Łatwe</span>
              <div className="font-medium">{stats.easyCount}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onRestartSession} className="w-full">
            Ucz się dalej
          </Button>
          {onBackToSet && (
            <Button variant="outline" onClick={onBackToSet} className="w-full">
              Wróć do zestawu
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
