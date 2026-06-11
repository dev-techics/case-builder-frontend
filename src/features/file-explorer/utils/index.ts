/**
 * Returns the CSS classes for a given conversion status.
 *
 * @param status - The conversion status ('converting', 'success', or 'failed').
 * @returns A string containing the CSS classes for the status badge.
 */
export const getConversionStatusClasses = (
    status: "converting" |"success" | "failed"
  ) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-800';
      case 'failed':
        return 'bg-red-50 text-red-800';
      default:
        return 'bg-blue-50 text-blue-800';
    }
  };


/**
 * Extracts a user-friendly error message from an unknown error value.
 *
 * Supports:
 * - Error instances (`error.message`)
 * - API errors containing a `data` property
 * - String error messages stored in `data`
 * - Object error responses with a `message` field in `data`
 *
 * Falls back to a default message when no specific error message can be determined.
 *
 * @param error - The error value to extract a message from.
 * @returns A user-friendly error message.
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;

    if (typeof data === 'string') {
      return data;
    }

    return (data as { message?: string })?.message ?? 'Failed to upload files';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to upload files';
};