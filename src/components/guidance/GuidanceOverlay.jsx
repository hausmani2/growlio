import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GuidanceContext } from '../../contexts/GuidanceContext';
import { apiGet, apiPost } from '../../utils/axiosInterceptors';
import GuidanceTooltip from './GuidanceTooltip';

const GuidanceOverlay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check context directly to avoid throwing error if provider is not available
  const context = useContext(GuidanceContext);
  
  // If context is not available, return null (component is outside provider)
  if (!context) {
    console.warn('GuidanceOverlay: GuidanceProvider is not available. Make sure GuidanceOverlay is rendered within GuidanceProvider.');
    return null;
  }

  const {
    isActive,
    isDataGuidanceActive,
    setIsDataGuidanceActive,
    loading,
    getCurrentPopup,
    getCurrentDataGuidancePopup,
    nextPopup,
    nextDataGuidancePopup,
    skipGuidance,
    markGuidanceAsSeen,
    markDataGuidanceAsSeen,
    currentPopupIndex,
    currentDataGuidanceIndex,
    popups,
    dataGuidancePopups,
  } = context;

  if (loading) {
    return null;
  }

  // Priority: Show data guidance if active, otherwise show regular guidance
  if (isDataGuidanceActive) {
    const currentDataPopup = getCurrentDataGuidancePopup();
    if (currentDataPopup) {
      const isWeekSelector = currentDataPopup.key === 'week_selector';
      
      const handleDataGuidanceNext = async () => {
        const isLast = currentDataGuidanceIndex === dataGuidancePopups.length - 1;
        const currentPage = location.pathname.includes('/dashboard/profit-loss') ? 'profit_loss' : 
                           location.pathname.includes('/dashboard') ? 'dashboard' : 'budget';
        
        // Check if this is the last dashboard popup (actual-weekly-labor-totals)
        const isLastDashboardPopup = currentDataPopup.key === 'actual-weekly-labor-totals' && 
                                     currentPage === 'dashboard';
        
        if (isWeekSelector) {
          try {
            setIsDataGuidanceActive(false);
            await apiPost('/authentication/user/guidance-status/', {
              has_seen_user_guidance: true,
              has_seen_user_guidance_data: false
            });
            if (context.setHasSeenGuidance) {
              context.setHasSeenGuidance(true);
            }
            setTimeout(() => {
              sessionStorage.setItem('guidance_navigate_to_dashboard', 'true');
              navigate('/dashboard');
            }, 100);
          } catch (error) {
            console.error('Failed to update guidance status:', error);
            setTimeout(() => {
              sessionStorage.setItem('guidance_navigate_to_dashboard', 'true');
              navigate('/dashboard');
            }, 100);
          }
        } else if (isLastDashboardPopup) {
          // Last dashboard popup - navigate to profit_loss page
          try {
            setIsDataGuidanceActive(false);
            setTimeout(() => {
              sessionStorage.setItem('guidance_navigate_to_profit_loss', 'true');
              navigate('/dashboard/profit-loss');
            }, 100);
          } catch (error) {
            console.error('Failed to navigate to profit loss:', error);
            setTimeout(() => {
              sessionStorage.setItem('guidance_navigate_to_profit_loss', 'true');
              navigate('/dashboard/profit-loss');
            }, 100);
          }
        } else if (isLast) {
          // Last data guidance popup (on profit_loss page) - mark as seen
          try {
            const currentStatus = await apiGet('/authentication/user/guidance-status/');
            await apiPost('/authentication/user/guidance-status/', {
              has_seen_user_guidance: currentStatus.data?.has_seen_user_guidance ?? true,
              has_seen_user_guidance_data: true
            });
            markDataGuidanceAsSeen();
          } catch (error) {
            console.error('Failed to update data guidance status:', error);
            markDataGuidanceAsSeen();
          }
        } else {
          // Move to next data guidance popup
          nextDataGuidancePopup();
        }
      };

      const handleDataGuidanceSkip = () => {
        markDataGuidanceAsSeen();
      };

      const isLast = currentDataGuidanceIndex === dataGuidancePopups.length - 1;
      
      return (
        <GuidanceTooltip
          popup={{
            ...currentDataPopup,
            currentIndex: currentDataGuidanceIndex,
            totalCount: dataGuidancePopups.length,
          }}
          onNext={handleDataGuidanceNext}
          onSkip={handleDataGuidanceSkip}
          isLast={isLast && !isWeekSelector} // Show "Got It" only on last popup (unless it's week_selector)
        />
      );
    }
  }

  if (!isActive) {
    return null;
  }

  const currentPopup = getCurrentPopup();
  if (!currentPopup) {
    return null;
  }

  // Add index info to popup for progress indicator
  const popupWithIndex = {
    ...currentPopup,
    currentIndex: currentPopupIndex,
    totalCount: popups.length,
  };

  const isLast = currentPopupIndex === popups.length - 1;

  // Handle regular guidance "Next" button (when no data)
  const handleGuidanceNext = async () => {
    const currentPopup = getCurrentPopup();
    const isSummaryTable = currentPopup?.key === 'summary_table';
    
    if (isLast) {
      try {
        const currentStatus = await apiGet('/authentication/user/guidance-status/');
        const currentDataGuidanceStatus = currentStatus.data?.has_seen_user_guidance_data ?? false;
        
        await apiPost('/authentication/user/guidance-status/', {
          has_seen_user_guidance: true,
          has_seen_user_guidance_data: currentDataGuidanceStatus
        });
        
        markGuidanceAsSeen();
        
        // If data guidance hasn't been seen, show it now (week_selector on budget page)
        if (!currentDataGuidanceStatus) {
          sessionStorage.setItem('show_data_guidance_after_user_guidance', 'true');
        }
      } catch (error) {
        console.error('Failed to update guidance status:', error);
        markGuidanceAsSeen();
      }
    } else {
      nextPopup();
    }
  };

  return (
    <GuidanceTooltip
      popup={popupWithIndex}
      onNext={handleGuidanceNext}
      onSkip={skipGuidance}
      isLast={isLast}
    />
  );
};

export default GuidanceOverlay;

