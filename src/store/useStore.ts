import { create } from 'zustand';
import type { Furniture, RoomState, Student, FurnitureType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StoreState extends RoomState {
  // Actions
  setRoomDimensions: (width: number, height: number) => void;
  setUnit: (unit: 'meters' | 'feet') => void;
  
  addFurniture: (type: FurnitureType, x: number, y: number) => void;
  updateFurniture: (id: string, updates: Partial<Furniture>) => void;
  removeFurniture: (id: string) => void;
  
  addStudent: (name: string) => void;
  importStudents: (names: string[]) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  removeStudent: (id: string) => void;
  
  addRelationship: (studentAId: string, studentBId: string, type: 'green' | 'red') => void;
  removeRelationship: (id: string) => void;
  
  assignStudent: (studentId: string, seatId: string) => void;
  unassignStudent: (studentId: string) => void;
  clearAssignments: () => void;
}

const DEFAULT_ROOM_WIDTH = 10; // meters
const DEFAULT_ROOM_HEIGHT = 8; // meters

export const useStore = create<StoreState>((set) => ({
  width: DEFAULT_ROOM_WIDTH,
  height: DEFAULT_ROOM_HEIGHT,
  unit: 'meters',
  furniture: [],
  students: [],
  relationships: [],
  assignments: {},

  setRoomDimensions: (width, height) => set({ width, height }),
  setUnit: (unit) => set({ unit }),

  addFurniture: (type, x, y) => set((state) => ({
    furniture: [
      ...state.furniture,
      {
        id: uuidv4(),
        type,
        x,
        y,
        rotation: 0
      }
    ]
  })),

  updateFurniture: (id, updates) => set((state) => ({
    furniture: state.furniture.map((f) => f.id === id ? { ...f, ...updates } : f)
  })),

  removeFurniture: (id) => set((state) => ({
    furniture: state.furniture.filter((f) => f.id !== id),
    // Also remove assignments for seats on this furniture? 
    // Complexity: Seat IDs need to be derived from furniture. 
    // For now, we'll handle cleanup later or in the component logic.
  })),

  addStudent: (name) => set((state) => ({
    students: [
      ...state.students,
      {
        id: uuidv4(),
        name,
        zonePreference: null,
        lockedSeatId: null
      }
    ]
  })),

  importStudents: (names) => set((state) => ({
    students: [
      ...state.students,
      ...names.map(name => ({
        id: uuidv4(),
        name,
        zonePreference: null,
        lockedSeatId: null
      } as Student))
    ]
  })),

  updateStudent: (id, updates) => set((state) => ({
    students: state.students.map((s) => s.id === id ? { ...s, ...updates } : s)
  })),

  removeStudent: (id) => set((state) => ({
    students: state.students.filter((s) => s.id !== id),
    relationships: state.relationships.filter(r => r.studentAId !== id && r.studentBId !== id),
    // Remove from assignments
    assignments: Object.fromEntries(
      Object.entries(state.assignments).filter(([_, sId]) => sId !== id)
    )
  })),

  addRelationship: (studentAId, studentBId, type) => set((state) => ({
    relationships: [
      ...state.relationships,
      { id: uuidv4(), studentAId, studentBId, type }
    ]
  })),

  removeRelationship: (id) => set((state) => ({
    relationships: state.relationships.filter((r) => r.id !== id)
  })),

  assignStudent: (studentId, seatId) => set((state) => {
    // Remove student from any previous seat
    const newAssignments = Object.fromEntries(
      Object.entries(state.assignments).filter(([_, sId]) => sId !== studentId)
    );
    // Assign to new seat
    newAssignments[seatId] = studentId;
    return { assignments: newAssignments };
  }),

  unassignStudent: (studentId) => set((state) => ({
    assignments: Object.fromEntries(
      Object.entries(state.assignments).filter(([_, sId]) => sId !== studentId)
    )
  })),

  clearAssignments: () => set({ assignments: {} })
}));
