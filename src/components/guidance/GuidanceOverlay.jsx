import React from 'react';
import { useGuidance } from '../../contexts/GuidanceContext';
import GuidanceTooltip from './GuidanceTooltip';

const GuidanceOverlay = () => {
  const {
    isActive,
    loading,
    getCurrentPopup,
    nextPopup,
    skipGuidance,
    currentPopupIndex,
    popups,
  } = useGuidance();

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

