import type { APIRoute } from "astro";
import { CreateFlashcardSchema } from "../../../../lib/validation/flashcard.validation";
import { createFlashcard, ResourceNotFoundError, AccessDeniedError } from "../../../../lib/services/flashcards";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  // 1. Authentication
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized access",
        },
      }),
      { status: 401 }
    );
  }

  // 2. Validate Parameters
  const { setId } = params;
  if (!setId) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Missing setId parameter",
        },
      }),
      { status: 400 }
    );
  }

  // 3. Parse and Validate Body
  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNPROCESSABLE_ENTITY",
          message: "Invalid JSON body",
        },
      }),
      { status: 422 }
    );
  }

  const validationResult = CreateFlashcardSchema.safeParse(payload);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Validation failed",
          details: validationResult.error.flatten(),
        },
      }),
      { status: 400 }
    );
  }

  // 4. Service Call
  try {
    const flashcard = await createFlashcard(locals.supabase, locals.user.id, setId, validationResult.data);

    return new Response(JSON.stringify(flashcard), { status: 201 });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        }),
        { status: 404 }
      );
    }

    if (error instanceof AccessDeniedError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        }),
        { status: 403 }
      );
    }

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      { status: 500 }
    );
  }
};
