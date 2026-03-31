import { getApiErrorMessage } from "../utils/apiErrors";

export const GetErrorMessage = (
  error: unknown,
  type: string,
  event: string,
): string => {
  return getApiErrorMessage(error, `Failed to ${event} ${type}.`);
};
