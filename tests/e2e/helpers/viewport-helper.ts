/**
 * Viewport and responsive helper for E2E tests.
 * Allows simulating mobile (<640px, <768px), tablet, and desktop viewports.
 */

export const VIEWPORTS = {
  mobileSmall: 375, // iPhone SE / Mini
  mobileStandard: 412, // Pixel / iPhone 15
  mobileThreshold: 639, // Max mobile < 640px
  tabletPortrait: 767, // Max tablet portrait < 768px
  tabletLandscape: 820, // iPad Air
  desktopStandard: 1280, // Standard desktop
  desktopWide: 1440, // Wide screen
} as const;

export function setTestViewportWidth(width: number): void {
  (globalThis as unknown as { __TEST_VIEWPORT_WIDTH__: number }).__TEST_VIEWPORT_WIDTH__ = width;
}

export function resetTestViewport(): void {
  (globalThis as unknown as { __TEST_VIEWPORT_WIDTH__: number }).__TEST_VIEWPORT_WIDTH__ =
    VIEWPORTS.desktopStandard;
}

/**
 * Validates WCAG mobile touch target floor (min 44px height).
 */
export function meetsTouchTargetFloor(computedMinHeightPx: number): boolean {
  return computedMinHeightPx >= 44;
}

/**
 * Validates Z-index stacking order contract:
 * Cart Drawer (390) and Wishlist Drawer (390) must NOT be covered by Account Mobile Nav (must be hidden or below 390).
 */
export function validateZIndexContract(layers: {
  accountNavZIndex: number;
  cartDrawerZIndex: number;
  isAccountNavHiddenWhenDrawerOpen: boolean;
}): boolean {
  if (layers.isAccountNavHiddenWhenDrawerOpen) {
    return true;
  }
  return layers.accountNavZIndex < layers.cartDrawerZIndex;
}
