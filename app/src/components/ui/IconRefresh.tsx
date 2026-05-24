import { LoaderCircle, RefreshCw } from 'lucide-react';

export function IconRefresh({ spinning = false }: { spinning?: boolean }) {
  if (spinning) {
    return (
      <LoaderCircle
        className="w-4 h-4 animate-spin"
        aria-hidden="true"
      />
    );
  }
  return <RefreshCw className="w-4 h-4" aria-hidden="true" />;
}
