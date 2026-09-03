"use server";

/**
 * Server actions keep this use case's backend calls on the server: the browser
 * never sees the API URL or any credential, and no CORS configuration or portal
 * route handler is needed.
 */

const API_URL =
  process.env.INFRASTRUCTURE_COPILOT_API_URL ?? "http://localhost:8100";

export type AskState = {
  question: string;
  answer: string | null;
  error: string | null;
};

export const initialAskState: AskState = {
  question: "",
  answer: null,
  error: null,
};

export async function askCopilot(
  _previous: AskState,
  formData: FormData,
): Promise<AskState> {
  const question = String(formData.get("question") ?? "").trim();

  if (!question) {
    return { question, answer: null, error: "Enter a question first." };
  }

  try {
    const response = await fetch(`${API_URL}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        question,
        answer: null,
        error: `Backend responded with ${response.status}.`,
      };
    }

    const data = (await response.json()) as { answer: string };
    return { question, answer: data.answer, error: null };
  } catch {
    return {
      question,
      answer: null,
      error: `Could not reach the backend at ${API_URL}. Start it with: uvicorn main:app --port 8100`,
    };
  }
}
