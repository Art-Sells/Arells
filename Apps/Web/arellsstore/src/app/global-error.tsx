'use client';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body>
        <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <p>{error.name}: {error.message}</p>
          <p>{error.stack}</p>
        </div>
      </body>
    </html>
  );
}
