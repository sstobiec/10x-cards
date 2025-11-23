import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useGeneration } from "@/components/views/hooks/useGeneration";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto.randomUUID for consistent IDs or just existence
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid-" + Math.random().toString(36).substring(7),
  },
  writable: true,
});

describe("useGeneration", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("generateProposals", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useGeneration());
      expect(result.current.state).toBe("idle");
      expect(result.current.proposals).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should set error when text is empty", async () => {
      const { result } = renderHook(() => useGeneration());

      await act(async () => {
        result.current.setText("   "); // Empty after trim
        await result.current.generateProposals();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error).toEqual({
        title: "Nieprawidłowe dane wejściowe",
        message: "Tekst nie może być pusty i nie może przekraczać 10 000 znaków.",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should set error when text is too long", async () => {
      const { result } = renderHook(() => useGeneration());
      const longText = "a".repeat(10001);

      await act(async () => {
        result.current.setText(longText);
        await result.current.generateProposals();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error?.title).toBe("Nieprawidłowe dane wejściowe");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle successful API response", async () => {
      const mockResponse = {
        flashcard_proposals: [
          { avers: "Question 1", rewers: "Answer 1" },
          { avers: "Question 2", rewers: "Answer 2" },
        ],
        model: "gpt-4o",
        generation_duration: 1500,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useGeneration());

      // Setup valid text
      await act(async () => {
        result.current.setText("Valid text content");
      });

      // Trigger generation
      await act(async () => {
        await result.current.generateProposals();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/flashcards/generate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ text: "Valid text content" }),
        })
      );

      expect(result.current.state).toBe("reviewing");
      expect(result.current.proposals).toHaveLength(2);

      // Check first item structure
      const firstItem = result.current.proposals[0];
      expect(firstItem).toEqual(
        expect.objectContaining({
          avers: "Question 1",
          rewers: "Answer 1",
          source: "ai-full",
          isFlagged: false,
        })
      );
      expect(firstItem.id).toBeDefined();

      expect(result.current.error).toBeNull();
    });

    it("should handle API error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "Internal Server Error" } }),
      });

      const { result } = renderHook(() => useGeneration());

      await act(async () => {
        result.current.setText("Valid text");
      });

      await act(async () => {
        await result.current.generateProposals();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error).toEqual({
        title: "Błąd generowania",
        message: "Internal Server Error",
      });
      expect(result.current.proposals).toEqual([]);
    });

    it("should handle empty proposals from API", async () => {
      const mockResponse = {
        flashcard_proposals: [],
        model: "gpt-4o",
        generation_duration: 1000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useGeneration());

      await act(async () => {
        result.current.setText("Valid text");
      });

      await act(async () => {
        await result.current.generateProposals();
      });

      expect(result.current.state).toBe("reviewing");
      expect(result.current.proposals).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should handle network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network Error"));

      const { result } = renderHook(() => useGeneration());

      await act(async () => {
        result.current.setText("Valid text");
      });

      await act(async () => {
        await result.current.generateProposals();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error).toEqual({
        title: "Błąd generowania",
        message: "Network Error",
      });
    });
  });
});
