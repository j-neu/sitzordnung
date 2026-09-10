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

    it(`"${type}" places the whiteboard at the bottom wall, regardless of room size`, () => {
      for (const [w, h] of roomSizes) {
        const furniture = generateLayout(type, w, h);
        const whiteboard = furniture.find(f => f.type === 'whiteboard')!;
        const { height } = FURNITURE_DIMENSIONS['whiteboard'];
        expect(whiteboard.y).toBeCloseTo(h - height, 5);
      }
    });

    it(`"${type}" never places a table overlapping the whiteboard, regardless of room size`, () => {
      for (const [w, h] of roomSizes) {
        const furniture = generateLayout(type, w, h);
        const whiteboard = furniture.find(f => f.type === 'whiteboard')!;
        const tableWbOverlaps = furniture
          .filter(f => f.type.startsWith('table'))
          .filter(t => boxesOverlap(aabb(t), aabb(whiteboard)));
        expect(tableWbOverlaps, `table/whiteboard overlap at room ${w}x${h}`).toEqual([]);
      }
    });

  }

  // Only "u-shape" gets a strict containment check: it's the one template
  // whose geometry was reworked in this change (vertical gaps derived from
  // available room height, bottom row centered on the room's own width) -
  // the other three templates have pre-existing containment gaps at very
  // small room sizes that are unrelated to this change and out of scope here.
  it('"u-shape" keeps every item within the room\'s walls for reasonably-sized rooms', () => {
    // Excludes 6x6 along with the deliberately extreme sizes (4x4, 3x20,
    // 20x3) covered by the overlap/seat-count tests above: 4 stacked
    // double-tables alone need 7.2m of height, so a 6m-tall room can't fit
    // this template's fixed 24-seat structure at any gap - a pre-existing
    // (and worse, before this change) limit, not something introduced here.
    for (const [w, h] of [[8, 10], [14, 16]] as [number, number][]) {
      const furniture = generateLayout('u-shape', w, h);
      for (const item of furniture) {
        const box = aabb(item);
        expect(box.minX, `${item.type} left edge outside room at ${w}x${h}`).toBeGreaterThanOrEqual(-1e-6);
        expect(box.minY, `${item.type} top edge outside room at ${w}x${h}`).toBeGreaterThanOrEqual(-1e-6);
        expect(box.maxX, `${item.type} right edge outside room at ${w}x${h}`).toBeLessThanOrEqual(w + 1e-6);
        expect(box.maxY, `${item.type} bottom edge outside room at ${w}x${h}`).toBeLessThanOrEqual(h + 1e-6);
      }
    }
  });
});
