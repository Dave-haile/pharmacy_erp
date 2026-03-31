import axios from "axios";

type ErrorPayload =
  | string
  | {
      error?: unknown;
      message?: unknown;
      detail?: unknown;
      non_field_errors?: unknown;
      [key: string]: unknown;
    }
  | null
  | undefined;

const toSentence = (value: string) => value.trim().replace(/\s+/g, " ");

const toList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => toList(item));
  }

  if (value == null) return [];

  if (typeof value === "string") {
    const cleaned = toSentence(value);
    return cleaned ? [cleaned] : [];
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, fieldValue]) => {
        const label = key.replace(/_/g, " ");
        return toList(fieldValue).map((entry) => `${label}: ${entry}`);
      },
    );
  }

  return [String(value)];
};

const getStatusSolution = (status?: number) => {
  switch (status) {
    case 400:
      return "Check the submitted fields and try again.";
    case 401:
      return "Sign in again and retry the action.";
    case 403:
      return "You do not have permission for this action. Use an allowed account or ask an admin.";
    case 404:
      return "The record or endpoint was not found. Refresh the page and confirm the URL or resource still exists.";
    case 405:
      return "The server rejected this request method. Confirm the frontend is calling the correct endpoint.";
    case 409:
      return "This action conflicts with existing data. Review duplicates or current record state.";
    case 422:
      return "The server could not validate the payload. Review the form values and formatting.";
    case 500:
      return "The server failed while handling the request. Check backend logs or try again later.";
    case 502:
    case 503:
    case 504:
      return "The server is temporarily unavailable. Wait a moment and retry.";
    default:
      return "Retry the action, and if it keeps failing inspect the network response or backend logs.";
  }
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong.",
): string => {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && error.message.trim()) {
      return error.message.trim();
    }
    return fallback;
  }

  if (!error.response) {
    return `${fallback} Possible fix: confirm the backend server is running and reachable.`;
  }

  const { status, statusText, data } = error.response as {
    status?: number;
    statusText?: string;
    data?: ErrorPayload;
  };

  const candidates: string[] = [];

  if (typeof data === "string") {
    const cleaned = data.replace(/<[^>]+>/g, " ").trim();
    if (cleaned) candidates.push(toSentence(cleaned));
  } else if (data && typeof data === "object") {
    candidates.push(...toList(data.error));
    candidates.push(...toList(data.message));
    candidates.push(...toList(data.detail));
    candidates.push(...toList(data.non_field_errors));

    for (const [key, value] of Object.entries(data)) {
      if (["error", "message", "detail", "non_field_errors"].includes(key)) {
        continue;
      }
      candidates.push(...toList({ [key]: value }));
    }
  }

  const uniqueMessage = [...new Set(candidates.map((item) => toSentence(item)).filter(Boolean))][0];
  const cause =
    uniqueMessage ||
    (status ? `Request failed with status ${status}${statusText ? ` ${statusText}` : ""}.` : "") ||
    fallback;

  return `${cause} Possible fix: ${getStatusSolution(status)}`;
};
