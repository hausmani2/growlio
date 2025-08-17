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
      console.log('Popup API response:', response.data);
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
      console.log('Marking popup as shown...');
      await api.post('/authentication/sales-data-popup/');
      console.log('Popup marked as shown successfully');
      setShouldShowPopup(false);
    } catch (err) {
      console.error('Error marking popup as shown:', err);
      // Still hide the popup locally even if the API call fails
      setShouldShowPopup(false);
    }
  };

  // Check popup status when component mounts
  useEffect(() => {
    console.log('useSalesDataPopup: Component mounted, checking popup status...');
    checkPopupStatus();
  }, []);

  return {
    shouldShowPopup,
    isLoading,
    markPopupAsShown
  };
};

export default useSalesDataPopup;
