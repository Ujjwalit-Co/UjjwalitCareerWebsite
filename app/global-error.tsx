'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-bg text-[#F5F5F5] font-sans antialiased flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-brand-orange">Something went wrong!</h1>
          <p className="text-slate-400 text-sm">{error.message}</p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-brand-orange rounded-lg text-white font-semibold"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
