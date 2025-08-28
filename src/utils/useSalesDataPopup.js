import { useState, useEffect } from 'react';
import api from './axiosInterceptors';

const useSalesDataPopup = () => {
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if popup should be shown today
  const checkPopupStatus = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/authentication/sales-data-popup/');
      setShouldShowPopup(response.data.should_show);
    } catch (err) {
      console.error('Error checking popup status:', err);
      // Default to showing popup if there's an error
      setShouldShowPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark popup as shown today
  const markPopupAsShown = async () => {
    try {
      
      await api.post('/authentication/sales-data-popup/');
      
      setShouldShowPopup(false);
    } catch (err) {
      console.error('Error marking popup as shown:', err);
      // Still hide the popup locally even if the API call fails
      setShouldShowPopup(false);
    }
  };

  // Check popup status when component mounts
  useEffect(() => {
    
    checkPopupStatus();
  }, []);

  return {
    shouldShowPopup,
    isLoading,
    markPopupAsShown
  };
};

export default useSalesDataPopup;
