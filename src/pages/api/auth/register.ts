import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client.ts";
import { z } from "zod";

export const prerender = false;

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Nazwa użytkownika musi mieć co najmniej 3 znaki")
      .max(20, "Nazwa użytkownika może mieć maksymalnie 20 znaków"),
    email: z.string().email("Nieprawidłowy adres email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .max(72, "Hasło może mieć maksymalnie 72 znaki"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są takie same",
    path: ["confirmPassword"],
  });

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          error: firstError.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { username, email, password } = validationResult.data;

    // Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            error: "Użytkownik o tym adresie email już istnieje",
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Wystąpił błąd podczas rejestracji",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return success with user data
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          username,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas rejestracji",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

