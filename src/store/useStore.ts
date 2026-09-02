import { create } from 'zustand';
import type { Furniture, RoomState, Student, FurnitureType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getAbsoluteSeatPositions } from '../utils/geometry';
import SolverWorker from '../workers/solver.worker?worker';
import type { Language } from '../locales';

interface StoreState extends RoomState {
  language: Language;
  isOptimizing: boolean;
  optimizationStats: { cost: number; iteration: number } | null;
  optimizationReport: { movedCount: number; initialCost: number; finalCost: number; iterations: number } | null;

  // Interaction State for Relationships
  interactionMode: 'none' | 'green' | 'red' | 'define';
  relationSelection: { type: 'single'; id: string } | { type: 'pair'; a: string; b: string } | null;

  // Interaction State for tap-to-place student assignment (mouse + touch)
  pendingAssignment: string | null;

  // Actions
  setLanguage: (lang: Language) => void;
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
  
  // Interaction Actions
  setInteractionMode: (mode: 'none' | 'green' | 'red' | 'define') => void;
  handleRelationClick: (studentId: string) => void;
  clearRelationSelection: () => void;
  
  setPendingAssignment: (studentId: string | null) => void;
  assignPendingStudentToSeat: (seatId: string) => void;

  assignStudent: (studentId: string, seatId: string) => void;
  unassignStudent: (studentId: string) => void;
  clearAssignments: () => void;
  randomFill: () => void;
  loadState: (newState: RoomState) => void;
  applyLayout: (furniture: Furniture[]) => void;
  
  startOptimization: () => void;
  stopOptimization: () => void;
  clearOptimizationReport: () => void;
}

const DEFAULT_ROOM_WIDTH = 8; // meters
const DEFAULT_ROOM_HEIGHT = 10; // meters

let worker: Worker | null = null;

export const useStore = create<StoreState>((set, get) => ({
  width: DEFAULT_ROOM_WIDTH,
  height: DEFAULT_ROOM_HEIGHT,
  unit: 'meters',
  language: 'en',
  furniture: [],
  students: [],
  relationships: [],
  assignments: {},
  isOptimizing: false,
  optimizationStats: null,
  optimizationReport: null,
  interactionMode: 'none',
  relationSelection: null,
  pendingAssignment: null,

  setLanguage: (lang) => set({ language: lang }),
  setRoomDimensions: (width, height) => set({ width, height }),
  setUnit: (unit) => set({ unit }),

  setInteractionMode: (mode) => set({ interactionMode: mode, relationSelection: null, pendingAssignment: null }),
  
  clearRelationSelection: () => set({ relationSelection: null }),

  handleRelationClick: (id) => set((state) => {
    if (state.interactionMode === 'none') return {};

    const selection = state.relationSelection;

    // If nothing selected, select first
    if (!selection) {
        return { relationSelection: { type: 'single', id } };
    }

    // If single selected
    if (selection.type === 'single') {
        if (selection.id === id) {
            // Deselect if same
            return { relationSelection: null };
        }

        // Second student clicked
        const studentAId = selection.id;
        const studentBId = id;

        // Check exists
        const exists = state.relationships.some(r => 
            (r.studentAId === studentAId && r.studentBId === studentBId) ||
            (r.studentAId === studentBId && r.studentBId === studentAId)
        );

        if (exists) {
            // Maybe notify user? For now just clear selection
            return { relationSelection: null };
        }

        if (state.interactionMode === 'define') {
            return { relationSelection: { type: 'pair', a: studentAId, b: studentBId } };
        } else {
            // Green or Red - add immediately
            const newRel = {
                id: uuidv4(),
                studentAId,
                studentBId,
                type: state.interactionMode as 'green' | 'red'
            };
            return {
                relationships: [...state.relationships, newRel],
                relationSelection: null
            };
        }
    }

    return {};
  }),

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
    // Cleanup assignments: remove any seat starting with the furniture ID
    assignments: Object.fromEntries(
      Object.entries(state.assignments).filter(([seatId]) => !seatId.startsWith(id))
    )
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
      Object.entries(state.assignments).filter(([, sId]) => sId !== id)
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

  setPendingAssignment: (studentId) => set((state) => ({
    pendingAssignment: state.pendingAssignment === studentId ? null : studentId
  })),

  assignPendingStudentToSeat: (seatId) => {
    const { pendingAssignment, assignStudent } = get();
    if (!pendingAssignment) return;
    assignStudent(pendingAssignment, seatId);
    set({ pendingAssignment: null });
  },

  assignStudent: (studentId, seatId) => set((state) => {
    // Remove student from any previous seat
    const newAssignments = Object.fromEntries(
      Object.entries(state.assignments).filter(([, sId]) => sId !== studentId)
    );
    // Assign to new seat
    newAssignments[seatId] = studentId;
    return { assignments: newAssignments };
  }),

  unassignStudent: (studentId) => set((state) => ({
    assignments: Object.fromEntries(
      Object.entries(state.assignments).filter(([, sId]) => sId !== studentId)
    )
  })),

  clearAssignments: () => set({ assignments: {} }),

  randomFill: () => set((state) => {
    // 1. Get unassigned students
    const assignedStudentIds = new Set(Object.values(state.assignments).filter(Boolean));
    const unassignedStudents = state.students.filter(s => !assignedStudentIds.has(s.id));
    
    if (unassignedStudents.length === 0) return {};

    // 2. Get available seats
    const occupiedSeats = new Set(Object.keys(state.assignments));
    const availableSeats: string[] = [];
    
    state.furniture.forEach(f => {
      // Logic matching RoomCanvas for seat IDs
      if (f.type === 'table-single') {
        const sid = f.id;
        if (!occupiedSeats.has(sid)) availableSeats.push(sid);
      } else if (f.type === 'table-double') {
        const s1 = f.id + '-L';
        const s2 = f.id + '-R';
        if (!occupiedSeats.has(s1)) availableSeats.push(s1);
        if (!occupiedSeats.has(s2)) availableSeats.push(s2);
      }
    });

    if (availableSeats.length === 0) return {};

    // 3. Shuffle
    const shuffledStudents = [...unassignedStudents].sort(() => Math.random() - 0.5);
    const newAssignments = { ...state.assignments };
    
    // 4. Assign
    for (const student of shuffledStudents) {
      if (availableSeats.length === 0) break;
      const seatIndex = Math.floor(Math.random() * availableSeats.length);
      const seatId = availableSeats[seatIndex];
      
      newAssignments[seatId] = student.id;
      availableSeats.splice(seatIndex, 1);
    }
    
    return { assignments: newAssignments };
  }),

  loadState: (newState) => set(() => ({
    width: newState.width,
    height: newState.height,
    unit: newState.unit,
    furniture: newState.furniture,
    students: newState.students,
    relationships: newState.relationships,
    assignments: newState.assignments
  })),

  applyLayout: (newFurniture) => set(() => ({
    furniture: newFurniture,
    assignments: {} // Clear assignments as furniture IDs change
  })),

  clearOptimizationReport: () => set({ optimizationReport: null }),

  startOptimization: () => {
    const state = get();
    if (state.isOptimizing) return;

    // Terminate existing worker if any
    if (worker) worker.terminate();

    const initialAssignments = { ...state.assignments };
    let initialCost = 0;

    worker = new SolverWorker();
    
    // Calculate Absolute Seat Positions
    const seats = getAbsoluteSeatPositions(state.furniture);
    
    worker.postMessage({
        type: 'START',
        payload: {
            students: state.students,
            furniture: state.furniture, // Not really used in worker anymore
            assignments: state.assignments,
            relationships: state.relationships,
            width: state.width,
            height: state.height,
            seats: seats,
            roomHeight: state.height,
            config: {
                maxIterations: 100000,
                weights: {
                    green: 1.0,
                    red: 50.0,
                    zone: 50.0
                }
            }
        }
    });

    set({ isOptimizing: true, optimizationReport: null });

    worker.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'PROGRESS') {
             if (payload.iteration === 0) initialCost = payload.currentCost;
            set({ 
                assignments: payload.assignments,
                optimizationStats: { cost: payload.currentCost, iteration: payload.iteration }
            });
        } else if (type === 'DONE') {
            const finalAssignments = payload.assignments;
            
            // Calculate Moved Count
            let movedCount = 0;
            const allStudents = state.students;
            
            // Create maps: studentId -> seatId
            const initialMap = new Map<string, string>();
            Object.entries(initialAssignments).forEach(([seat, student]) => {
                if (student) initialMap.set(student, seat);
            });
            
            const finalMap = new Map<string, string>();
            Object.entries(finalAssignments).forEach(([seat, student]) => {
                 if (student && typeof student === 'string') finalMap.set(student, seat);
            });

            allStudents.forEach(s => {
                const startSeat = initialMap.get(s.id);
                const endSeat = finalMap.get(s.id);
                if (startSeat !== endSeat) movedCount++;
            });

            set({ 
                assignments: finalAssignments,
                isOptimizing: false,
                optimizationStats: { cost: payload.currentCost, iteration: payload.iteration },
                optimizationReport: {
                    movedCount,
                    initialCost,
                    finalCost: payload.currentCost,
                    iterations: payload.iteration
                }
            });
            worker?.terminate();
            worker = null;
        }
    };
  },

  stopOptimization: () => {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    set({ isOptimizing: false });
  }
}));
