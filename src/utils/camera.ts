export interface Size {
  width: number;
  height: number;
}

export interface CameraTransform {
  scale: number;
  x: number;
  y: number;
}

/**
 * Computes a scale + centered position that fits `content` inside
 * `container`, without ever upscaling past 1 (so a room that already fits
 * a large desktop viewport is shown at true size, not blown up).
 */
export function computeFitScale(container: Size, content: Size): CameraTransform {
  if (content.width <= 0 || content.height <= 0 || container.width <= 0 || container.height <= 0) {
    return { scale: 1, x: 0, y: 0 };
  }

  const scale = Math.min(container.width / content.width, container.height / content.height, 1);

  return {
    scale,
    x: (container.width - content.width * scale) / 2,
    y: (container.height - content.height * scale) / 2,
  };
}

/**
 * Standard "zoom toward a point" transform: keeps the room-space point under
 * `pointer` visually fixed while scale changes by `scaleBy`, clamped to
 * [min, max]. Used for wheel-zoom, pinch-zoom, and the +/- buttons alike.
 */
export function computeZoomTransform(
  current: CameraTransform,
  pointer: { x: number; y: number },
  scaleBy: number,
  { min, max }: { min: number; max: number }
): CameraTransform {
  const newScale = Math.min(max, Math.max(min, current.scale * scaleBy));

  const pointTo = {
    x: (pointer.x - current.x) / current.scale,
    y: (pointer.y - current.y) / current.scale,
  };

  return {
    scale: newScale,
    x: pointer.x - pointTo.x * newScale,
    y: pointer.y - pointTo.y * newScale,
  };
}
