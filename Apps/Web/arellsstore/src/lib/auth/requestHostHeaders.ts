import type { RequestHostHeaders } from './origin';

type HeaderLike = {
  get(name: string): string | null;
};

export function readRequestHostHeaders(headers: HeaderLike): RequestHostHeaders {
  return {
    host: headers.get('host'),
    forwardedHost: headers.get('x-forwarded-host'),
    forwardedProto: headers.get('x-forwarded-proto'),
  };
}

export function readRequestHostHeadersFromApi(req: {
  headers: Record<string, string | string[] | undefined>;
}): RequestHostHeaders {
  const pick = (name: string) => {
    const value = req.headers[name];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  return {
    host: pick('host'),
    forwardedHost: pick('x-forwarded-host'),
    forwardedProto: pick('x-forwarded-proto'),
  };
}
