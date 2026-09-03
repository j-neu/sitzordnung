import { describe, it, expect } from 'vitest';
import { generateLayout, LAYOUT_TEMPLATES } from './layouts';
import { SEAT_LAYOUTS } from '../constants';

function countSeats(furniture: ReturnType<typeof generateLayout>): number {
  return furniture.reduce((total, item) => {
    const seats = SEAT_LAYOUTS[item.type];
    return total + (seats ? seats.length : 0);
  }, 0);
}

describe('generateLayout', () => {
  const roomSizes: [number, number][] = [
    [8, 10],   // default room size
    [6, 6],    // a small room
    [14, 16],  // a large room
  ];

  for (const type of LAYOUT_TEMPLATES) {
    it(`"${type}" always targets 24 seats, regardless of room size`, () => {
      for (const [w, h] of roomSizes) {
        const furniture = generateLayout(type, w, h);
        expect(countSeats(furniture)).toBe(24);
      }
    });
  }
});
