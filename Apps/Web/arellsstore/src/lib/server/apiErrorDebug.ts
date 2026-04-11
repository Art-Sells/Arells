export type ApiErrorDebug = {
  name?: string;
  message?: string;
  code?: string;
  statusCode?: number;
  at: string;
};

function serializeErr(err: unknown): Omit<ApiErrorDebug, 'at'> {
  if (!err || typeof err !== 'object') {
    return { message: String(err) };
  }
  const o = err as Record<string, unknown>;
  const meta = o.$metadata as { httpStatusCode?: number } | undefined;
  return {
    name: typeof o.name === 'string' ? o.name : undefined,
    message: typeof o.message === 'string' ? o.message : undefined,
    code: typeof o.code === 'string' ? o.code : o.code != null ? String(o.code) : undefined,
    statusCode:
      typeof o.statusCode === 'number'
        ? o.statusCode
        : typeof meta?.httpStatusCode === 'number'
          ? meta.httpStatusCode
          : undefined,
  };
}

/** Use in API catch blocks; Amplify/CloudWatch often drops console output without an SSR Logs role. */
export function logApiRouteError(route: string, err: unknown): void {
  const s = serializeErr(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(`[api] ${route}`, JSON.stringify(s));
  if (stack) console.error(stack);
}

/** When DEBUG_API_ERRORS=1, merge into JSON so the browser Network tab shows the real failure. Remove after debugging. */
export function withOptionalApiDebug<T extends Record<string, unknown>>(body: T, err: unknown): T & { debug?: ApiErrorDebug } {
  if (process.env.DEBUG_API_ERRORS !== '1') return body;
  return { ...body, debug: { ...serializeErr(err), at: new Date().toISOString() } };
}
