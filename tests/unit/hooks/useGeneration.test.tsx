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

  describe("saveFlashcardSet", () => {
    const createGenerateResponse = () => ({
      flashcard_proposals: [{ avers: "Question 1", rewers: "Answer 1" }],
      model: "gpt-4o",
      generation_duration: 1500,
    });

    const setupReviewState = async () => {
      const mockGenerateResponse = createGenerateResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerateResponse,
      });

      const hook = renderHook(() => useGeneration());

      await act(async () => {
        hook.result.current.setText("Source text");
      });

      await act(async () => {
        await hook.result.current.generateProposals();
      });

      return { result: hook.result, generateResponse: mockGenerateResponse };
    };

    it("should set error when set name is empty or whitespace", async () => {
      const { result } = renderHook(() => useGeneration());

      act(() => {
        result.current.setSetName("   ");
      });

      await act(async () => {
        await result.current.saveFlashcardSet();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error).toEqual({
        title: "Nieprawidłowa nazwa zestawu",
        message: "Nazwa zestawu nie może być pusta i nie może przekraczać 100 znaków.",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should set error when set name exceeds 100 characters", async () => {
      const { result } = renderHook(() => useGeneration());

      const longName = "a".repeat(101);

      act(() => {
        result.current.setSetName(longName);
      });

      await act(async () => {
        await result.current.saveFlashcardSet();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error).toEqual({
        title: "Nieprawidłowa nazwa zestawu",
        message: "Nazwa zestawu nie może być pusta i nie może przekraczać 100 znaków.",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should set error when there are no proposals to save", async () => {
      const { result } = renderHook(() => useGeneration());

      act(() => {
        result.current.setSetName("Mój zestaw");
      });

      await act(async () => {
        await result.current.saveFlashcardSet();
      });

      expect(result.current.state).toBe("error");
      expect(result.current.error).toEqual({
        title: "Brak fiszek",
        message: "Musisz mieć co najmniej jedną fiszkę do zapisania.",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should persist flashcards with trimmed name and metadata", async () => {
      const { result, generateResponse } = await setupReviewState();

      const mockSaveResponse = {
        id: "set-123",
        name: "My Flashcards",
        flashcard_count: 1,
        model: generateResponse.model,
        generation_duration: generateResponse.generation_duration,
        created_at: "2024-01-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSaveResponse,
      });

      const proposalId = result.current.proposals[0].id;

      act(() => {
        result.current.toggleFlag(proposalId);
        result.current.setSetName("  My Flashcards  ");
      });

      await act(async () => {
        await result.current.saveFlashcardSet();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const [, saveRequestInit] = mockFetch.mock.calls[1];
      const payload = JSON.parse((saveRequestInit?.body as string) || "{}");

      expect(payload).toEqual({
        name: "My Flashcards",
        model: generateResponse.model,
        generation_duration: generateResponse.generation_duration,
        flashcards: [
          {
            avers: "Question 1",
            rewers: "Answer 1",
            source: "ai-full",
            flagged: true,
          },
        ],
      });

      expect(result.current.state).toBe("success");
      expect(result.current.savedSetInfo).toEqual(mockSaveResponse);
      expect(result.current.error).toBeNull();
    });

    it("should surface duplicate name errors (409)", async () => {
      const { result } = await setupReviewState();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: { message: "Already exists" } }),
      });

      act(() => {
        result.current.setSetName("Historia");
      });

      await act(async () => {
        await result.current.saveFlashcardSet();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.current.state).toBe("error");
      expect(result.current.error).toEqual({
        title: "Błąd zapisywania",
        message: "Zestaw o tej nazwie już istnieje.",
      });
      expect(result.current.savedSetInfo).toBeNull();
    });

    it("should handle generic API failures", async () => {
      const { result } = await setupReviewState();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "Server exploded" } }),
      });

      act(() => {
        result.current.setSetName("Historia");
      });

      await act(async () => {
        await result.current.saveFlashcardSet();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.current.state).toBe("error");
      expect(result.current.error).toEqual({
        title: "Błąd zapisywania",
        message: "Server exploded",
      });
      expect(result.current.savedSetInfo).toBeNull();
    });
  });
});
