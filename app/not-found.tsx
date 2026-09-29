import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-bg text-text">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 stroke-[2]" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Page Not Found</h1>
      <p className="text-sm text-muted max-w-xs mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-accent text-white font-semibold text-sm shadow-sm hover:bg-accent/90 active:scale-95 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Wallet</span>
      </Link>
    </div>
  );
}
