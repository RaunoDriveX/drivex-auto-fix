import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

/**
 * Hook to check if mock mode is enabled via URL parameter
 * Use ?mock=true to enable mock mode for testing
 */
export function useMockMode() {
  const [searchParams] = useSearchParams();
  
  const isMockMode = useMemo(() => {
    return searchParams.get('mock') === 'true';
  }, [searchParams]);
  
  return {
    isMockMode,
    mockParam: isMockMode ? '?mock=true' : '',
  };
}
