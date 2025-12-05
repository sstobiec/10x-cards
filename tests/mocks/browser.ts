import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * MSW worker for browser environment (used for development)
 */
export const worker = setupWorker(...handlers);
