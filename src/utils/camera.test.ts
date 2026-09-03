import { describe, it, expect } from 'vitest';
import { computeFitScale, computeZoomTransform } from './camera';

describe('computeFitScale', () => {
  it('scales down to fit when width is the constraining dimension', () => {
    // container 400x1000, content 800x800 -> width ratio 0.5, height ratio 1.25 -> scale 0.5
    const result = computeFitScale({ width: 400, height: 1000 }, { width: 800, height: 800 });
    expect(result.scale).toBeCloseTo(0.5);
    expect(result.x).toBeCloseTo((400 - 800 * 0.5) / 2);
    expect(result.y).toBeCloseTo((1000 - 800 * 0.5) / 2);
  });

  it('scales down to fit when height is the constraining dimension', () => {
    // container 1000x400, content 800x800 -> width ratio 1.25, height ratio 0.5 -> scale 0.5
    const result = computeFitScale({ width: 1000, height: 400 }, { width: 800, height: 800 });
    expect(result.scale).toBeCloseTo(0.5);
  });

  it('never upscales past 1 when content already fits the container', () => {
    const result = computeFitScale({ width: 2000, height: 2000 }, { width: 800, height: 800 });
    expect(result.scale).toBe(1);
    expect(result.x).toBeCloseTo((2000 - 800) / 2);
    expect(result.y).toBeCloseTo((2000 - 800) / 2);
  });

  it('falls back to an identity transform for degenerate (zero) sizes', () => {
    expect(computeFitScale({ width: 0, height: 0 }, { width: 800, height: 800 })).toEqual({ scale: 1, x: 0, y: 0 });
    expect(computeFitScale({ width: 400, height: 400 }, { width: 0, height: 0 })).toEqual({ scale: 1, x: 0, y: 0 });
  });
});

describe('computeZoomTransform', () => {
  it('keeps the room-space point under the pointer visually fixed while zooming in', () => {
    const current = { scale: 1, x: 0, y: 0 };
    const pointer = { x: 150, y: 80 };
    const roomPointBefore = {
      x: (pointer.x - current.x) / current.scale,
      y: (pointer.y - current.y) / current.scale,
    };

    const next = computeZoomTransform(current, pointer, 2, { min: 0.1, max: 4 });

    const roomPointAfter = {
      x: (pointer.x - next.x) / next.scale,
      y: (pointer.y - next.y) / next.scale,
    };

    expect(roomPointAfter.x).toBeCloseTo(roomPointBefore.x);
    expect(roomPointAfter.y).toBeCloseTo(roomPointBefore.y);
    expect(next.scale).toBeCloseTo(2);
  });

  it('clamps the result to the given max', () => {
    const next = computeZoomTransform({ scale: 3.5, x: 0, y: 0 }, { x: 0, y: 0 }, 2, { min: 0.1, max: 4 });
    expect(next.scale).toBe(4);
  });

  it('clamps the result to the given min', () => {
    const next = computeZoomTransform({ scale: 0.2, x: 0, y: 0 }, { x: 0, y: 0 }, 0.1, { min: 0.15, max: 4 });
    expect(next.scale).toBe(0.15);
  });
});
