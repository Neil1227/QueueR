import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-bg text-text">
      <div className="max-w-sm space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-accent">404</h1>
        <h2 className="text-lg font-semibold">Page Not Found</h2>
        <p className="text-xs text-muted leading-relaxed">
          The page you requested doesn&apos;t exist or has moved.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-xs shadow-sm hover:bg-accent/90 transition-all cursor-pointer"
          >
            Back to Wallet
          </Link>
        </div>
      </div>
    </main>
  );
}
