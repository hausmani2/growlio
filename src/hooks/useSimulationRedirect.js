import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAndRedirectToSimulation } from '../utils/simulationUtils';
import { message } from 'antd';

/**
 * Hook to check restaurant simulation status and redirect to onboarding if needed
 * Can be used in any component where user action should trigger the check
 * 
 * @param {boolean} enabled - Whether to enable the redirect check
 * @param {Function} onRedirect - Optional callback when redirect happens
 * @returns {{isChecking: boolean, checkRedirect: Function}}
 */
export const useSimulationRedirect = (enabled = false, onRedirect = null) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  const checkRedirect = async () => {
    setIsChecking(true);
    try {
      const result = await checkAndRedirectToSimulation(navigate);
      if (result.shouldRedirect && onRedirect) {
        onRedirect();
      }
      if (!result.success && result.error) {
        message.error(result.error);
      }
      return result;
    } catch (error) {
      console.error('Error checking simulation redirect:', error);
      message.error('Failed to check simulation status');
      return { success: false, error: error.message };
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      checkRedirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { isChecking, checkRedirect };
};

export default useSimulationRedirect;