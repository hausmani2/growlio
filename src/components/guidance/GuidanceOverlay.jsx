import React, { useContext } from 'react';
import { GuidanceContext } from '../../contexts/GuidanceContext';
import GuidanceTooltip from './GuidanceTooltip';

const GuidanceOverlay = () => {
  // Check context directly to avoid throwing error if provider is not available
  const context = useContext(GuidanceContext);
  
  // If context is not available, return null (component is outside provider)
  if (!context) {
    console.warn('GuidanceOverlay: GuidanceProvider is not available. Make sure GuidanceOverlay is rendered within GuidanceProvider.');
    return null;
  }

  const {
    isActive,
    loading,
    getCurrentPopup,
    nextPopup,
    skipGuidance,
    currentPopupIndex,
    popups,
  } = context;

  // Debug logging
  React.useEffect(() => {
    console.log('🎨 GuidanceOverlay state:', { isActive, loading, currentPopupIndex, popupsCount: popups.length });
  }, [isActive, loading, currentPopupIndex, popups.length]);

  if (loading) {
    console.log('⏳ GuidanceOverlay: Still loading...');
    return null;
  }

  if (!isActive) {
    console.log('⏸️ GuidanceOverlay: Not active');
    return null;
  }

  const currentPopup = getCurrentPopup();
  if (!currentPopup) {
    console.log('⚠️ GuidanceOverlay: No current popup');
    return null;
  }

  console.log('✅ GuidanceOverlay: Rendering popup:', currentPopup);

  // Add index info to popup for progress indicator
  const popupWithIndex = {
    ...currentPopup,
    currentIndex: currentPopupIndex,
    totalCount: popups.length,
  };

  const isLast = currentPopupIndex === popups.length - 1;

  return (
    <GuidanceTooltip
      popup={popupWithIndex}
      onNext={nextPopup}
      onSkip={skipGuidance}
      isLast={isLast}
    />
  );
};

export default GuidanceOverlay;

