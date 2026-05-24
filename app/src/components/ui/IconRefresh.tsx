import { LoaderCircle, RefreshCw } from 'lucide-react';

export function IconRefresh({ spinning = false }: { spinning?: boolean }) {
  if (spinning) {
    return (
      <LoaderCircle
        className="w-4 h-4"
        style={{ animation: 'spin 0.8s linear infinite' }}
        aria-hidden="true"
      />
    );
  }
  return <RefreshCw className="w-4 h-4" aria-hidden="true" />;
}
