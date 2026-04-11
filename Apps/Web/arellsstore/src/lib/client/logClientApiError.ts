import axios from 'axios';

/** Logs server JSON (including `debug` when DEBUG_API_ERRORS=1 on the server) to the browser console. */
export function logClientApiError(context: string, err: unknown): void {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;
    console.error(`[API] ${context} → HTTP ${status}`, data ?? err.message);
    return;
  }
  console.error(`[API] ${context}`, err);
}

export function logFetchApiFailure(context: string, status: number, body: unknown): void {
  console.error(`[API] ${context} → HTTP ${status}`, body);
}
