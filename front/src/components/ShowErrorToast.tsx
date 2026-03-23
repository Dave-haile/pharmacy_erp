export const getErrorMessage = (
  error: unknown,
  type: string,
  event: string,
): string => {
  return error &&
    typeof error === "object" &&
    "response" in error &&
    error.response
    ? (error.response as { data?: { error?: string; message?: string } })?.data
        ?.error ||
        (error.response as { data?: { error?: string; message?: string } })
          ?.data?.message
    : `Failed to ${event} ${type}.`;
};
