import React, { useEffect, useState, useRef } from 'react';
import { Button, Card } from 'antd';
import { CloseOutlined, ArrowRightOutlined } from '@ant-design/icons';

const GuidanceTooltip = ({ popup, onNext, onSkip, isLast }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [elementRect, setElementRect] = useState(null);
  const [arrowPosition, setArrowPosition] = useState({ side: 'right', top: null, left: null });
  const popupRef = useRef(null);

  useEffect(() => {
    if (!popup) {
      console.log('⚠️ GuidanceTooltip: No popup provided');
      return;
    }

    console.log('🔍 GuidanceTooltip: Looking for element with key:', popup.key);
    const element = document.querySelector(`[data-guidance="${popup.key}"]`);
    if (!element) {
      console.warn(`❌ Element with data-guidance="${popup.key}" not found on page`);
      console.log('💡 Available data-guidance elements:', 
        Array.from(document.querySelectorAll('[data-guidance]')).map(el => el.getAttribute('data-guidance'))
      );
      return;
    }

    console.log('✅ GuidanceTooltip: Found element:', element);

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

    // Wait for scroll to complete
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      setElementRect(rect);
      
      // Calculate popup position
      const popupWidth = 380;
      const popupHeight = 250; // Increased height to accommodate content
      const spacing = 30;
      
      // For step navigation bar, center the popup above or below
      const isStepNavigation = popup.key === 'step_navigation_bar';
      
      let top, left, arrowSide;
      
      if (isStepNavigation) {
        // Center popup above the navigation bar (preferred)
        left = (window.innerWidth / 2) - (popupWidth / 2);
        top = rect.top - popupHeight - spacing;
        arrowSide = 'bottom'; // Arrow at bottom of popup pointing down
        
        // If popup would go off top, position below instead
        if (top < 20) {
          top = rect.bottom + spacing;
          arrowSide = 'top'; // Arrow at top of popup pointing up
        }
        
        // Ensure popup stays within viewport horizontally
        if (left < 20) {
          left = 20;
        }
        if (left + popupWidth > window.innerWidth - 20) {
          left = window.innerWidth - popupWidth - 20;
        }
        
        // Calculate arrow position (center horizontally)
        const arrowLeft = rect.left + (rect.width / 2) - left;
        setArrowPosition({ side: arrowSide, top: null, left: arrowLeft });
      } else {
        // For other elements, use side positioning
        top = rect.top + (rect.height / 2) - (popupHeight / 2);
        left = rect.right + spacing;
        arrowSide = 'right';
        
        // If popup would go off right edge, position on left
        if (left + popupWidth > window.innerWidth - 20) {
          left = rect.left - popupWidth - spacing;
          arrowSide = 'left';
        }
        
        // If popup would go off left edge, position on right
        if (left < 20) {
          left = rect.right + spacing;
          arrowSide = 'right';
        }
        
        // Adjust vertical position if needed
        if (top < 20) {
          top = 20;
        }
        if (top + popupHeight > window.innerHeight - 20) {
          top = window.innerHeight - popupHeight - 20;
        }
        
        // Calculate arrow position (center of element relative to popup)
        const arrowTop = rect.top + (rect.height / 2) - top;
        setArrowPosition({ side: arrowSide, top: arrowTop, left: null });
      }
      
      setPosition({ top, left });
    }, 300);
  }, [popup]);

  if (!popup || !elementRect) {
    return null;
  }

  return (
    <>
      {/* Black dimmed overlay with cutout */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        {/* Top overlay */}
        {elementRect.top > 0 && (
          <div
            className="fixed bg-black bg-opacity-75 transition-opacity duration-300"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: `${elementRect.top}px`,
            }}
          />
        )}
        {/* Left overlay */}
        {elementRect.left > 0 && (
          <div
            className="fixed bg-black bg-opacity-75 transition-opacity duration-300"
            style={{
              top: `${elementRect.top}px`,
              left: 0,
              width: `${elementRect.left}px`,
              height: `${elementRect.height}px`,
            }}
          />
        )}
        {/* Right overlay */}
        {elementRect.right < window.innerWidth && (
          <div
            className="fixed bg-black bg-opacity-75 transition-opacity duration-300"
            style={{
              top: `${elementRect.top}px`,
              left: `${elementRect.right}px`,
              right: 0,
              height: `${elementRect.height}px`,
            }}
          />
        )}
        {/* Bottom overlay */}
        {elementRect.bottom < window.innerHeight && (
          <div
            className="fixed bg-black bg-opacity-75 transition-opacity duration-300"
            style={{
              top: `${elementRect.bottom}px`,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        )}
      </div>

      {/* Highlighted element with bright border and glow */}
      <div
        className="fixed z-[9999] pointer-events-none border-4 border-orange-500 rounded-lg transition-all duration-300"
        style={{
          top: elementRect.top - 4,
          left: elementRect.left - 4,
          width: elementRect.width + 8,
          height: elementRect.height + 8,
          boxShadow: `
            0 0 0 4px rgba(249, 115, 22, 0.4),
            0 0 0 8px rgba(249, 115, 22, 0.2),
            0 0 30px rgba(249, 115, 22, 0.6),
            inset 0 0 20px rgba(249, 115, 22, 0.1)
          `,
          backgroundColor: 'rgba(249, 115, 22, 0.05)',
        }}
      />
      
      {/* Pulse animation overlay on highlighted element */}
      <div
        className="fixed z-[9999] pointer-events-none border-4 border-orange-400 rounded-lg animate-pulse"
        style={{
          top: elementRect.top - 4,
          left: elementRect.left - 4,
          width: elementRect.width + 8,
          height: elementRect.height + 8,
          opacity: 0.5,
        }}
      />

      {/* Popup card with arrow pointing to element */}
      <div
        ref={popupRef}
        className="fixed z-[10000] animate-fade-in"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: '380px',
        }}
      >
        {/* Arrow pointing to highlighted element */}
        {arrowPosition.side === 'top' || arrowPosition.side === 'bottom' ? (
          // Vertical arrow (top or bottom) - for step navigation bar
          <div
            className="absolute z-[10001]"
            style={{
              // If arrow is 'bottom', place it at bottom of popup (pointing down)
              // If arrow is 'top', place it at top of popup (pointing up)
              [arrowPosition.side === 'bottom' ? 'bottom' : 'top']: '-12px',
              left: arrowPosition.left ? `${arrowPosition.left}px` : '50%',
              transform: arrowPosition.left ? 'none' : 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              // If arrow is 'bottom', borderBottom is colored (points down)
              // If arrow is 'top', borderTop is colored (points up)
              [arrowPosition.side === 'bottom' 
                ? 'borderBottom' 
                : 'borderTop']: '12px solid #f97316',
            }}
          />
        ) : (
          // Horizontal arrow (left or right) - for other elements
          <div
            className="absolute z-[10001]"
            style={{
              top: arrowPosition.top ? `${arrowPosition.top}px` : '50%',
              transform: arrowPosition.top ? 'none' : 'translateY(-50%)',
              [arrowPosition.side === 'right' ? 'left' : 'right']: '-12px',
              width: 0,
              height: 0,
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              [arrowPosition.side === 'right' 
                ? 'borderRight' 
                : 'borderLeft']: '12px solid #f97316',
            }}
          />
        )}
        
        <Card
          className="shadow-2xl relative"
          style={{
            borderRadius: '12px',
            border: '3px solid #f97316',
            backgroundColor: '#ffffff',
          }}
          bodyStyle={{ padding: '24px' }}
        >
          {/* Header with icon */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-bold text-sm">💡</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 m-0 pr-4">
                {popup.title || 'Guidance Tip'}
              </h3>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1 hover:bg-gray-100 rounded"
              aria-label="Close"
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Content */}
          <div className="mb-4">
            <p className="text-gray-700 text-sm leading-relaxed mb-2">
              {popup.text}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={onSkip}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors font-medium"
            >
              Don't show again
            </button>
            <Button
              type="primary"
              onClick={onNext}
              icon={isLast ? null : <ArrowRightOutlined />}
              className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 font-semibold"
              size="middle"
            >
              {isLast ? 'Got it!' : 'Next'}
            </Button>
          </div>

          {/* Progress indicator */}
          {popup.totalCount > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-300 rounded-full"
                    style={{
                      width: `${((popup.currentIndex + 1) / popup.totalCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                  {popup.currentIndex + 1} / {popup.totalCount}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default GuidanceTooltip;

