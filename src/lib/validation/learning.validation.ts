/**
 * Validation schemas for Learning Session API endpoints
 */

import { z } from "zod";

/**
 * Schema for UUID validation
 */
export const UUIDSchema = z.string().uuid("Invalid UUID format");

/**
 * Schema for GET /api/learning/queue query parameters
 */
export const GetLearningQueueQuerySchema = z.object({
  setId: UUIDSchema,
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type GetLearningQueueQuery = z.infer<typeof GetLearningQueueQuerySchema>;

/**
 * Schema for POST /api/learning/review request body
 */
export const SubmitReviewBodySchema = z.object({
  flashcardId: UUIDSchema,
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)], {
    errorMap: () => ({ message: "Rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)" }),
  }),
});

export type SubmitReviewBody = z.infer<typeof SubmitReviewBodySchema>;
