import type { Furniture } from '../types';
import { FURNITURE_DIMENSIONS, SEAT_LAYOUTS } from '../constants';

export type SeatPosition = {
  id: string;
  x: number;
  y: number;
};

export function getAbsoluteSeatPositions(furniture: Furniture[]): SeatPosition[] {
  const positions: SeatPosition[] = [];

  furniture.forEach(item => {
    // Only tables have seats
    if (!item.type.startsWith('table')) return;

    const dims = FURNITURE_DIMENSIONS[item.type];
    const layouts = SEAT_LAYOUTS[item.type];
    if (!layouts) return;

    // Center of furniture in Room Coordinates
    const cx = item.x + dims.width / 2;
    const cy = item.y + dims.height / 2;

    const rad = (item.rotation || 0) * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    layouts.forEach(layout => {
      // Local center of the seat relative to the furniture top-left
      const localSeatCx = layout.x + layout.width / 2;
      const localSeatCy = layout.y + layout.height / 2;

      // Vector from Furniture Center to Seat Center (unrotated)
      // Furniture Center is at (dims.width/2, dims.height/2) in local coords
      const dx = localSeatCx - (dims.width / 2);
      const dy = localSeatCy - (dims.height / 2);

      // Rotate vector
      const rotatedDx = dx * cos - dy * sin;
      const rotatedDy = dx * sin + dy * cos;

      // Absolute position
      positions.push({
        id: item.id + layout.idSuffix,
        x: cx + rotatedDx,
        y: cy + rotatedDy
      });
    });
  });

  return positions;
}
