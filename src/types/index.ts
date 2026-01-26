export type Position = {
  x: number;
  y: number;
};

export type Dimensions = {
  width: number;
  height: number;
};

export type FurnitureType = 
  | 'table-single' 
  | 'table-double' 
  | 'teacher-desk' 
  | 'whiteboard' 
  | 'door' 
  | 'window';

export interface Furniture {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  rotation: number; // in degrees
  isLocked?: boolean;
}

export type ZonePreference = 'front' | 'back' | null;

export interface Student {
  id: string;
  name: string;
  zonePreference: ZonePreference;
  lockedSeatId: string | null; // If set, student must sit here
}

export interface Relationship {
  id: string;
  studentAId: string;
  studentBId: string;
  type: 'green' | 'red';
}

export interface Seat {
  id: string;
  furnitureId: string; // The table this seat belongs to
  offset: Position; // Relative to the furniture's position
  isLocked: boolean; // If true, seat stays empty (unless a student is specifically locked to it? Or maybe just 'blocked')
}

// Derived/computed placement of a seat in the room
export interface SeatLocation {
  id: string; // matches Seat.id
  x: number;
  y: number;
}

export type MeasurementUnit = 'meters' | 'feet';

export interface RoomState {
  width: number; // in meters
  height: number; // in meters
  unit: MeasurementUnit;
  furniture: Furniture[];
  students: Student[];
  relationships: Relationship[];
  assignments: Record<string, string | null>; // seatId -> studentId
}
