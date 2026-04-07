import React, { useContext, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GuidanceContext } from '../../contexts/GuidanceContext';
import { apiGet, apiPost } from '../../utils/axiosInterceptors';
import GuidanceTooltip from './GuidanceTooltip';

const GuidanceOverlay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePage = useMemo(() => {
    const path = location.pathname || '';
    if (path.startsWith('/dashboard/profit-loss')) return 'profit_loss';
    if (path === '/dashboard/budget') return 'budget';
    if (path.startsWith('/dashboard')) return 'dashboard';
    return 'unknown';
  }, [location.pathname]);
  
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
    dismissGuidanceUIOnly,
    markGuidanceAsSeen,
    markDataGuidanceAsSeen,
    currentPopupIndex,
    currentDataGuidanceIndex,
    popups,
    dataGuidancePopups,
  } = context;

  // Hard guard: Budget screen must never render the dashboard-only week selector help anchor.
  // If something slipped through (stale state, backend row, etc.), skip it immediately.
  useEffect(() => {
    if (loading) return;
    if (!isDataGuidanceActive) return;
    if (routePage !== 'budget') return;
    const current = getCurrentDataGuidancePopup?.();
    if (!current) return;
    if (current.key !== 'week_selector_help') return;

    const isLast = currentDataGuidanceIndex === dataGuidancePopups.length - 1;
    if (isLast) {
      markDataGuidanceAsSeen();
    } else {
      nextDataGuidancePopup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDataGuidanceActive,
    routePage,
    currentDataGuidanceIndex,
    dataGuidancePopups.length,
    nextDataGuidancePopup,
    markDataGuidanceAsSeen,
    getCurrentDataGuidancePopup,
    loading,
  ]);

  if (loading) {
    return null;
  }

  // Priority: Show data guidance if active, otherwise show regular guidance
  if (isDataGuidanceActive) {
    const currentDataPopup = getCurrentDataGuidancePopup();
    if (currentDataPopup) {
      const isWeekSelector = currentDataPopup.key === 'week_selector';
      const isExpenseGuidanceKey = [
        'total_weekly_expenses',
        'total_monthly_expenses',
        'expense_first_toggle',
        'expense_first_type',
        'expense_first_frequency',
        'expense_first_amount',
        'expense_first_monthly_total',
        'expense_first_weekly_total',
      ].includes(currentDataPopup.key);
      
      const handleDataGuidanceNext = async () => {
        const isLast = currentDataGuidanceIndex === dataGuidancePopups.length - 1;
        const currentPage = routePage;

        const isExpensePage =
          location.pathname.includes('/onboarding/expense') ||
          location.pathname.includes('/dashboard/expense');
        
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
            // Handle 401 errors gracefully - user may have logged out
            if (error.response?.status === 401) {
              setIsDataGuidanceActive(false);
              if (context.setHasSeenGuidance) {
                context.setHasSeenGuidance(true);
              }
              return;
            }
            console.error('Failed to update guidance status:', error);
            setTimeout(() => {
              sessionStorage.setItem('guidance_navigate_to_dashboard', 'true');
              navigate('/dashboard');
            }, 100);
          }
        } else if (isExpensePage && isExpenseGuidanceKey) {
          // Expense onboarding guidance: this is controlled by has_guidance_for_expense
          // We should NOT mark has_seen_user_guidance_data here.
          if (isLast) {
            try {
              if (context.markExpenseGuidanceAsSeen) {
                await context.markExpenseGuidanceAsSeen();
              } else {
                // Fallback: just close locally if context function is missing
                markDataGuidanceAsSeen();
              }
            } catch (e) {
              // Ensure the overlay closes even if posting fails
              if (context.markExpenseGuidanceAsSeen) {
                await context.markExpenseGuidanceAsSeen();
              } else {
                markDataGuidanceAsSeen();
              }
            }
          } else {
            nextDataGuidancePopup();
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
            // Handle 401 errors gracefully - user may have logged out
            if (error.response?.status === 401) {
              markDataGuidanceAsSeen();
              return;
            }
            console.error('Failed to update data guidance status:', error);
            markDataGuidanceAsSeen();
          }
        } else {
          // Move to next data guidance popup
          nextDataGuidancePopup();
        }
      };

      const handleDataGuidanceSkip = () => {
        // If we are on expense guidance, mark the expense flag instead
        if (
          (location.pathname.includes('/onboarding/expense') || location.pathname.includes('/dashboard/expense')) &&
          isExpenseGuidanceKey &&
          context.markExpenseGuidanceAsSeen
        ) {
          context.markExpenseGuidanceAsSeen();
          return;
        }
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
          onClose={dismissGuidanceUIOnly}
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
    const isLioMeetPopup = currentPopup?.key === 'lio_chat_widget';

    // LIO "Meet LIO" tooltip: dismiss UI only (do NOT update guidance-status API).
    // This popup is meant to be lightweight and non-blocking.
    if (isLioMeetPopup) {
      dismissGuidanceUIOnly();
      return;
    }
    
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
        // Handle 401 errors gracefully - user may have logged out
        if (error.response?.status === 401) {
          markGuidanceAsSeen();
          return;
        }
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
      onClose={dismissGuidanceUIOnly}
      onSkip={skipGuidance}
      isLast={isLast}
    />
  );
};

export default GuidanceOverlay;

