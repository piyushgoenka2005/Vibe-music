/**
 * Geometry helpers for the product gallery zoom/lens system.
 * Extracted from ProductGallery.tsx for separation of concerns.
 */

export const LENS_WIDTH_RATIO = 0.38;
export const PANE_WIDTH = 560;
export const PANE_MIN_WIDTH = 280;
export const PANE_EXTRA_HEIGHT = 120;
export const PANE_MAX_HEIGHT = 560;
export const PANE_GAP = 12;
export const HEADER_SAFE_TOP = 96;

export interface ImageMetrics {
  naturalWidth: number;
  naturalHeight: number;
}

export interface ImageRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const EMPTY_IMAGE_RECT: ImageRect = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
};

export function readCssScale(element: HTMLElement): number {
  const transform = getComputedStyle(element).transform;
  if (!transform || transform === "none") return 1;

  const matrix2d = transform.match(/^matrix\((.+)\)$/);
  if (matrix2d?.[1]) {
    const parts = matrix2d[1].split(",").map((value) => Number.parseFloat(value.trim()));
    const scale = Math.hypot(parts[0] ?? 0, parts[1] ?? 0);
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
  }

  const matrix3d = transform.match(/^matrix3d\((.+)\)$/);
  if (matrix3d?.[1]) {
    const parts = matrix3d[1].split(",").map((value) => Number.parseFloat(value.trim()));
    const scale = Math.hypot(parts[0] ?? 0, parts[1] ?? 0);
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
  }

  return 1;
}

export function measureRenderedImageRect(main: HTMLElement, photo: HTMLImageElement): ImageRect {
  if (photo.naturalWidth <= 0 || photo.naturalHeight <= 0) {
    return EMPTY_IMAGE_RECT;
  }

  const mainRect = main.getBoundingClientRect();
  const photoRect = photo.getBoundingClientRect();
  const style = getComputedStyle(photo);
  const padLeft = parseFloat(style.paddingLeft) || 0;
  const padTop = parseFloat(style.paddingTop) || 0;
  const padRight = parseFloat(style.paddingRight) || 0;
  const padBottom = parseFloat(style.paddingBottom) || 0;
  const scale = readCssScale(photo);

  const layoutWidth = photo.offsetWidth;
  const layoutHeight = photo.offsetHeight;
  const visualCenterX = (photoRect.left + photoRect.right) / 2 - mainRect.left;
  const visualCenterY = (photoRect.top + photoRect.bottom) / 2 - mainRect.top;
  const layoutLeft = visualCenterX - layoutWidth / 2;
  const layoutTop = visualCenterY - layoutHeight / 2;

  const contentWidth = Math.max(photo.clientWidth - padLeft - padRight, 0);
  const contentHeight = Math.max(photo.clientHeight - padTop - padBottom, 0);
  if (contentWidth <= 0 || contentHeight <= 0) {
    return EMPTY_IMAGE_RECT;
  }

  const imageAspect = photo.naturalWidth / photo.naturalHeight;
  const contentAspect = contentWidth / contentHeight;

  let width = contentWidth;
  let height = contentHeight;

  if (imageAspect > contentAspect) {
    height = contentWidth / imageAspect;
  } else {
    width = contentHeight * imageAspect;
  }

  const unscaledLeft = layoutLeft + padLeft + (contentWidth - width) / 2;
  const unscaledTop = layoutTop + padTop + (contentHeight - height) / 2;
  const originX = layoutLeft + layoutWidth / 2;
  const originY = layoutTop + layoutHeight / 2;
  const unscaledCenterX = unscaledLeft + width / 2;
  const unscaledCenterY = unscaledTop + height / 2;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const scaledCenterX = originX + (unscaledCenterX - originX) * scale;
  const scaledCenterY = originY + (unscaledCenterY - originY) * scale;

  return {
    left: scaledCenterX - scaledWidth / 2,
    top: scaledCenterY - scaledHeight / 2,
    width: scaledWidth,
    height: scaledHeight,
  };
}
