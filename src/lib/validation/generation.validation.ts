/**
 * Generation Validation Schemas
 *
 * Centralized Zod validation schemas for flashcard generation flow.
 * Used by both hooks and components to ensure consistent validation.
 */

import { z } from "zod";

// ============================================================================
// Constants
// ============================================================================

export const TEXT_MAX_LENGTH = 10000;
export const SET_NAME_MAX_LENGTH = 100;

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for validating generation input text
 * - Must not be empty (after trimming)
 * - Must not exceed TEXT_MAX_LENGTH characters
 */
export const GenerationTextSchema = z
  .string()
  .min(1, "Tekst nie może być pusty")
  .max(TEXT_MAX_LENGTH, `Tekst nie może przekraczać ${TEXT_MAX_LENGTH.toLocaleString("pl-PL")} znaków`)
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, "Tekst nie może być pusty");

/**
 * Schema for validating flashcard set name
 * - Must not be empty (after trimming)
 * - Must not exceed SET_NAME_MAX_LENGTH characters
 */
export const SetNameSchema = z
  .string()
  .min(1, "Nazwa zestawu nie może być pusta")
  .max(SET_NAME_MAX_LENGTH, `Nazwa nie może przekraczać ${SET_NAME_MAX_LENGTH} znaków`)
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, "Nazwa zestawu nie może być pusta");

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates generation input text
 *
 * @param text - The input text to validate
 * @returns Zod SafeParseReturnType with validation result
 */
export function validateGenerationText(text: string) {
  return GenerationTextSchema.safeParse(text);
}

/**
 * Validates flashcard set name
 *
 * @param name - The set name to validate
 * @returns Zod SafeParseReturnType with validation result
 */
export function validateSetName(name: string) {
  return SetNameSchema.safeParse(name);
}

// ============================================================================
// UI Helper Functions
// ============================================================================

/**
 * Checks if text length is over the maximum limit
 * Used by UI components for visual feedback
 */
export function isTextOverLimit(text: string): boolean {
  return text.length > TEXT_MAX_LENGTH;
}

/**
 * Checks if text is valid for generation (not empty and within limit)
 * Used by UI components for button state
 */
export function isTextValidForGeneration(text: string): boolean {
  return text.trim().length > 0 && text.length <= TEXT_MAX_LENGTH;
}

/**
 * Checks if set name is valid (not empty and within limit)
 * Used by UI components for button state
 */
export function isSetNameValid(name: string): boolean {
  return name.trim().length > 0 && name.length <= SET_NAME_MAX_LENGTH;
}
