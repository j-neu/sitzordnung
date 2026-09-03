import { describe, it, expect } from 'vitest';
import { generateLayout, LAYOUT_TEMPLATES } from './layouts';
import { SEAT_LAYOUTS, FURNITURE_DIMENSIONS } from '../constants';
import type { Furniture } from '../types';

function countSeats(furniture: Furniture[]): number {
  return furniture.reduce((total, item) => {
    const seats = SEAT_LAYOUTS[item.type];
    return total + (seats ? seats.length : 0);
  }, 0);
}

// Axis-aligned bounding box for a (possibly 90/270-rotated) piece of
// furniture, in room-space meters. Rotation pivots around the furniture's
// own center, so a 90/270 rotation swaps which dimension is "visual" width
// vs height (same math the seat hit-testing and drop handling rely on).
function aabb(item: Furniture) {
  const { width, height } = FURNITURE_DIMENSIONS[item.type];
  const cx = item.x + width / 2;
  const cy = item.y + height / 2;
  const rotated = Math.abs(item.rotation % 180) === 90;
  const halfW = (rotated ? height : width) / 2;
  const halfH = (rotated ? width : height) / 2;
  return { minX: cx - halfW, maxX: cx + halfW, minY: cy - halfH, maxY: cy + halfH };
}

function boxesOverlap(a: ReturnType<typeof aabb>, b: ReturnType<typeof aabb>): boolean {
  const EPS = 1e-6; // tables that merely touch edge-to-edge don't count as overlapping
  return a.minX < b.maxX - EPS && a.maxX > b.minX + EPS && a.minY < b.maxY - EPS && a.maxY > b.minY + EPS;
}

function findOverlappingPairs(furniture: Furniture[]): [Furniture, Furniture][] {
  const tables = furniture.filter(f => f.type.startsWith('table'));
  const boxes = tables.map(aabb);
  const pairs: [Furniture, Furniture][] = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxesOverlap(boxes[i], boxes[j])) pairs.push([tables[i], tables[j]]);
    }
  }
  return pairs;
}

describe('generateLayout', () => {
  const roomSizes: [number, number][] = [
    [8, 10],   // default room size
    [6, 6],    // a small room
    [14, 16],  // a large room
    [4, 4],    // a very small room
    [3, 20],   // a very narrow room
    [20, 3],   // a very short room
  ];

  for (const type of LAYOUT_TEMPLATES) {
    it(`"${type}" always targets 24 seats, regardless of room size`, () => {
      for (const [w, h] of roomSizes) {
        const furniture = generateLayout(type, w, h);
        expect(countSeats(furniture)).toBe(24);
      }
    });

    it(`"${type}" never places overlapping tables, regardless of room size`, () => {
      for (const [w, h] of roomSizes) {
        const furniture = generateLayout(type, w, h);
        const overlaps = findOverlappingPairs(furniture);
        expect(overlaps, `overlaps at room ${w}x${h}: ${JSON.stringify(overlaps)}`).toEqual([]);
      }
    });
  }
});
