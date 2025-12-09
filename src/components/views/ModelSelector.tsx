/**
 * ModelSelector Component
 *
 * A dropdown selector for choosing AI models used in flashcard generation.
 * Displays model name with provider badge and description.
 */

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LLM_MODELS, getModelById } from "@/lib/llm-models.config";

interface ModelSelectorProps {
  /** Currently selected model ID */
  selectedModel: string;
  /** Callback when model selection changes */
  onModelChange: (modelId: string) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * Dropdown component for selecting AI model
 */
export function ModelSelector({ selectedModel, onModelChange, disabled = false }: ModelSelectorProps) {
  const currentModel = getModelById(selectedModel);

  return (
    <div className="space-y-2">
      <label htmlFor="model-selector" className="text-sm font-medium text-foreground">
        Model AI
      </label>
      <Select value={selectedModel} onValueChange={onModelChange} disabled={disabled}>
        <SelectTrigger
          id="model-selector"
          className="w-full"
          aria-label="Wybierz model AI"
          data-testid="model-selector-trigger"
        >
          <SelectValue placeholder="Wybierz model AI">
            {currentModel && (
              <span className="flex items-center gap-2">
                <span className="font-medium">{currentModel.name}</span>
                <span className="text-xs text-muted-foreground">({currentModel.provider})</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Dostępne modele</SelectLabel>
            {LLM_MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id} data-testid={`model-option-${model.id.replace("/", "-")}`}>
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {model.provider}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
