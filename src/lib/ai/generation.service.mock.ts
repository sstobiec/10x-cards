/**
 * Mock AI Generation Service
 *
 * This service provides mock flashcard generation for development and testing.
 * It simulates AI behavior without making actual API calls.
 */

import type { FlashcardProposalDTO } from "../../types";

/**
 * Simulates network delay to mimic real API behavior
 */
async function simulateDelay(minMs = 800, maxMs = 2000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Extracts key phrases and words from text for flashcard generation
 */
function extractKeyPhrases(text: string): string[] {
  // Split into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  // Split into words and filter meaningful ones
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);

  return [...sentences.slice(0, 5), ...words.slice(0, 10)];
}

/**
 * Generates a question based on text content
 */
function generateQuestion(text: string, index: number): string {
  const templates = [
    "What is the main concept discussed in:",
    "How would you explain:",
    "What does the following describe:",
    "Define the following:",
    "What is meant by:",
    "Explain the concept of:",
    "What are the key points about:",
    "Describe:",
  ];

  const template = templates[index % templates.length];

  // Extract a snippet from text (first 50-100 chars)
  const snippet = text.substring(0, 80).trim();
  const words = snippet.split(/\s+/);

  if (words.length > 10) {
    return `${template} ${words.slice(0, 8).join(" ")}...?`;
  }

  return `${template} ${snippet}?`;
}

/**
 * Generates an answer based on text content
 */
function generateAnswer(text: string, questionText: string): string {
  // Extract sentences that might be relevant
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (sentences.length === 0) {
    return text.substring(0, 150).trim() + "...";
  }

  // Take 1-2 sentences as answer
  const answerSentences = sentences.slice(0, Math.min(2, sentences.length));
  return answerSentences.join(". ") + ".";
}

/**
 * Splits text into meaningful chunks for flashcard generation
 */
function splitTextIntoChunks(text: string, maxChunks = 15): string[] {
  // Split by paragraphs first
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length > 0 && paragraphs.length <= maxChunks) {
    return paragraphs;
  }

  // Split by sentences
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);

  if (sentences.length <= maxChunks) {
    return sentences;
  }

  // Group sentences into chunks
  const chunkSize = Math.ceil(sentences.length / maxChunks);
  const chunks: string[] = [];

  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize).join(". ");
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks.slice(0, maxChunks);
}

/**
 * Generates predefined flashcards based on common programming concepts
 */
function generateDefaultFlashcards(text: string): FlashcardProposalDTO[] {
  const lowercaseText = text.toLowerCase();
  const flashcards: FlashcardProposalDTO[] = [];

  // Check for common programming concepts and generate relevant flashcards
  const conceptMap: Record<string, FlashcardProposalDTO> = {
    rest: {
      avers: "What is REST?",
      rewers:
        "REST (Representational State Transfer) is an architectural style for designing networked applications, using HTTP methods and stateless communication.",
    },
    api: {
      avers: "What is an API?",
      rewers:
        "API (Application Programming Interface) is a set of rules and protocols that allows different software applications to communicate with each other.",
    },
    javascript: {
      avers: "What is JavaScript?",
      rewers:
        "JavaScript is a high-level, interpreted programming language used primarily for creating interactive web pages and web applications.",
    },
    typescript: {
      avers: "What is TypeScript?",
      rewers:
        "TypeScript is a strongly typed superset of JavaScript that compiles to plain JavaScript, adding static type definitions.",
    },
    react: {
      avers: "What is React?",
      rewers:
        "React is a JavaScript library for building user interfaces, particularly single-page applications, using a component-based architecture.",
    },
    database: {
      avers: "What is a database?",
      rewers:
        "A database is an organized collection of structured data stored electronically, designed for efficient retrieval, management, and updating.",
    },
    algorithm: {
      avers: "What is an algorithm?",
      rewers:
        "An algorithm is a step-by-step procedure or formula for solving a problem or completing a task, often used in computer programming.",
    },
    function: {
      avers: "What is a function in programming?",
      rewers:
        "A function is a reusable block of code that performs a specific task, can accept parameters, and can return a value.",
    },
  };

  // Add flashcards for detected concepts
  Object.entries(conceptMap).forEach(([keyword, flashcard]) => {
    if (lowercaseText.includes(keyword)) {
      flashcards.push(flashcard);
    }
  });

  return flashcards;
}

/**
 * Mock implementation of flashcard generation
 *
 * @param text - The input text to generate flashcards from
 * @param model - The AI model to simulate (not used in mock, but kept for API compatibility)
 * @returns Promise resolving to array of flashcard proposals
 */
export async function generateFlashcardsMock(text: string, model = "mock-model"): Promise<FlashcardProposalDTO[]> {
  // Simulate API delay
  await simulateDelay(1000, 2500);

  // Validate input
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  // Start with concept-based flashcards
  const conceptFlashcards = generateDefaultFlashcards(text);

  // Generate text-based flashcards
  const chunks = splitTextIntoChunks(text, 12);
  const textBasedFlashcards: FlashcardProposalDTO[] = chunks.map((chunk, index) => {
    const question = generateQuestion(chunk, index);
    const answer = generateAnswer(chunk, question);

    return {
      avers: question,
      rewers: answer,
    };
  });

  // Combine both types of flashcards
  const allFlashcards = [...conceptFlashcards, ...textBasedFlashcards];

  // Ensure we have at least 5 flashcards and at most 20
  const minFlashcards = 5;
  const maxFlashcards = 20;

  let finalFlashcards = allFlashcards.slice(0, maxFlashcards);

  // If we have fewer than minimum, generate generic ones
  while (finalFlashcards.length < minFlashcards) {
    const index = finalFlashcards.length;
    finalFlashcards.push({
      avers: `Question ${index + 1}: What is the key concept in this section?`,
      rewers: text.substring(0, Math.min(100, text.length)).trim() + "...",
    });
  }

  // Shuffle to mix concept-based and text-based flashcards
  finalFlashcards = finalFlashcards
    .map((card) => ({ card, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ card }) => card);

  return finalFlashcards;
}
