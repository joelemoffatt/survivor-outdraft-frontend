import { useEffect, useState } from 'react';

export default function useDelayedLoader(isLoading: boolean, delayMs = 200): boolean {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowLoader(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setShowLoader(true);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoading, delayMs]);

  return showLoader;
}
