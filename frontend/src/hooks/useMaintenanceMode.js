import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook to monitor customer maintenance mode status.
 *
 * Checks:
 * 1. Build-time environment variable (VITE_MAINTENANCE_MODE or MAINTENANCE_MODE)
 * 2. Runtime backend API (/api/maintenance)
 *
 * Defaults safely to false.
 */
export function useMaintenanceMode() {
  const envFlag =
    import.meta.env.VITE_MAINTENANCE_MODE === 'true' ||
    import.meta.env.MAINTENANCE_MODE === 'true';

  const [isMaintenance, setIsMaintenance] = useState(envFlag);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/maintenance');
      if (typeof res.data?.maintenance === 'boolean') {
        setIsMaintenance(res.data.maintenance || envFlag);
      } else {
        setIsMaintenance(envFlag);
      }
    } catch {
      setIsMaintenance(envFlag);
    } finally {
      setLoading(false);
    }
  }, [envFlag]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return { isMaintenance, loading, checkStatus };
}

export default useMaintenanceMode;
