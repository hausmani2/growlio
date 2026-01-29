import { useState, useEffect } from 'react';
import api from './axiosInterceptors';

const useSalesDataPopup = () => {
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if popup should be shown today
  // COMMENTED OUT: Update My Day API calls disabled
  const checkPopupStatus = async () => {
    try {
      setIsLoading(true);
      // COMMENTED OUT: API call disabled
      // const response = await api.get('/authentication/sales-data-popup/');
      // setShouldShowPopup(response.data.should_show);
      
      // Always set to false to prevent popup from showing
      setShouldShowPopup(false);
    } catch (err) {
      console.error('Error checking popup status:', err);
      // Default to not showing popup
      setShouldShowPopup(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark popup as shown today
  // COMMENTED OUT: Update My Day API calls disabled
  const markPopupAsShown = async () => {
    try {
      // COMMENTED OUT: API call disabled
      // await api.post('/authentication/sales-data-popup/');
      
      setShouldShowPopup(false);
    } catch (err) {
      console.error('Error marking popup as shown:', err);
      // Still hide the popup locally even if the API call fails
      setShouldShowPopup(false);
    }
  };

  // Check popup status when component mounts
  // COMMENTED OUT: Update My Day popup check disabled
  useEffect(() => {
    // COMMENTED OUT: API call disabled
    // checkPopupStatus();
    
    // Always set to false to prevent popup
    setShouldShowPopup(false);
    setIsLoading(false);
  }, []);

  return {
    shouldShowPopup,
    isLoading,
    markPopupAsShown
  };
};

export default useSalesDataPopup;
