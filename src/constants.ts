import type { FurnitureType } from './types';

export const PIXELS_PER_METER = 100;
export const GRID_SIZE_METERS = 0.5;
export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 4;

export const FURNITURE_DIMENSIONS: Record<FurnitureType, { width: number; height: number; color: string }> = {
  'table-single': { width: 1.0, height: 0.8, color: '#FFFFFF' }, 
  'table-double': { width: 1.8, height: 0.8, color: '#FFFFFF' },
  'teacher-desk': { width: 1.6, height: 0.8, color: '#EFF6FF' },
  'whiteboard': { width: 3.0, height: 0.2, color: '#E5E7EB' },
  'door': { width: 1.0, height: 1.0, color: '#E5E7EB' },
  'window': { width: 1.5, height: 0.1, color: '#34D399' },
};

export const SEAT_LAYOUTS: Partial<Record<FurnitureType, { idSuffix: string; x: number; y: number; width: number; height: number }[]>> = {
  'table-single': [
    { idSuffix: '', x: 0, y: 0, width: 1.0, height: 0.8 }
  ],
  'table-double': [
    { idSuffix: '-L', x: 0, y: 0, width: 0.9, height: 0.8 },
    { idSuffix: '-R', x: 0.9, y: 0, width: 0.9, height: 0.8 }
  ]
};
