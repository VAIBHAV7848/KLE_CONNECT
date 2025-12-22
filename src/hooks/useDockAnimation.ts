import { useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';

interface DockAnimationConfig {
  baseSize: number;
  maxScale: number;
  maxDistance: number;
}

/**
 * Custom hook for macOS-style dock magnification animation
 * Uses GSAP for smooth, spring-like animations with proper ref handling
 */
export const useDockAnimation = (
  itemCount: number,
  config: DockAnimationConfig = {
    baseSize: 48,
    maxScale: 1.5,
    maxDistance: 120
  }
) => {
  const dockRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  /**
   * Calculate scale factor based on distance from cursor
   * Uses cosine function for smooth falloff like macOS dock
   */
  const calculateScale = useCallback((distance: number): number => {
    const { maxScale, maxDistance } = config;
    
    if (distance >= maxDistance) return 1;
    
    // Cosine-based scaling for natural falloff
    const normalizedDistance = distance / maxDistance;
    const cosValue = Math.cos((normalizedDistance * Math.PI) / 2);
    const scale = 1 + (maxScale - 1) * cosValue;
    
    return Math.max(1, Math.min(maxScale, scale));
  }, [config]);

  /**
   * Handle mouse movement over the dock
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const dock = dockRef.current;
    if (!dock) return;

    const dockRect = dock.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Check if mouse is near the dock vertically
    const distanceToBottom = window.innerHeight - mouseY;
    const dockHeight = dockRect.height + 50; // Add some buffer
    
    if (distanceToBottom > dockHeight + config.maxDistance) {
      // Reset all items if mouse is too far
      itemRefs.current.forEach((item) => {
        gsap.to(item, {
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: 'power3.out'
        });
      });
      return;
    }

    itemRefs.current.forEach((item, index) => {
      const itemRect = item.getBoundingClientRect();
      const itemCenterX = itemRect.left + itemRect.width / 2;
      
      // Calculate horizontal distance only for scaling
      const distance = Math.abs(mouseX - itemCenterX);
      const scale = calculateScale(distance);
      
      // Calculate upward movement based on scale
      const baseSize = config.baseSize;
      const yOffset = -((scale - 1) * baseSize * 0.5);

      gsap.to(item, {
        scale,
        y: yOffset,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });
  }, [calculateScale, config]);

  /**
   * Reset all items when mouse leaves dock area
   */
  const handleMouseLeave = useCallback(() => {
    itemRefs.current.forEach((item, index) => {
      gsap.to(item, {
        scale: 1,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)',
        delay: index * 0.015
      });
    });
  }, []);

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;

    dock.addEventListener('mousemove', handleMouseMove);
    dock.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      dock.removeEventListener('mousemove', handleMouseMove);
      dock.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return {
    dockRef,
    setItemRef
  };
};

export default useDockAnimation;
