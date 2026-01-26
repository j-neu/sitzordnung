import type { Student, Relationship } from '../types';

// Simplified types for the worker to avoid importing large files
type SeatPosition = {
  id: string;
  x: number;
  y: number;
};

type SolverConfig = {
  maxIterations: number;
  weights: {
    green: number; // Distance minimization for friends
    red: number;   // Distance maximization for enemies
    zone: number;  // Penalty for wrong zone
  };
};

type SolverMessage = {
  type: 'START';
  payload: {
    students: Student[];
    seats: SeatPosition[];
    assignments: Record<string, string | null>;
    relationships: Relationship[];
    roomHeight: number; // For zone calc
    config: SolverConfig;
  };
};

self.onmessage = (e: MessageEvent<SolverMessage>) => {
  if (e.data.type === 'START') {
    const { students, seats, assignments, relationships, roomHeight, config } = e.data.payload;
    runOptimization(students, seats, assignments, relationships, roomHeight, config);
  }
};

function runOptimization(
  students: Student[],
  seats: SeatPosition[],
  initialAssignments: Record<string, string | null>,
  relationships: Relationship[],
  roomHeight: number,
  config: SolverConfig
) {
  // 1. Parse Initial State
  // We need a map of studentId -> seatId and seatId -> studentId for fast lookups
  // Actually, standard simulated annealing usually works with an array or map of assignments.
  
  // Current state: Map<seatId, studentId | null>
  // Filter out seats that are not in the 'seats' array (locked furniture not passed? or handle locked seats)
  // We assume 'seats' contains ALL valid seats.
  
  // Create a working copy of assignments
  let currentAssignments = { ...initialAssignments };
  
  // Helper: map studentId -> seatId (reverse lookup)
  // We'll rebuild this when needed or maintain it.
  // For cost calc, we need to know where students are.
  
  // Pre-calculate Seat positions Map for O(1) access
  const seatPosMap = new Map<string, {x: number, y: number}>();
  seats.forEach(s => seatPosMap.set(s.id, { x: s.x, y: s.y }));

  // Pre-process relationships for faster lookup
  // Map<studentId, { friends: string[], enemies: string[] }>
  const studentRels = new Map<string, { friends: string[], enemies: string[] }>();
  students.forEach(s => studentRels.set(s.id, { friends: [], enemies: [] }));
  
  relationships.forEach(r => {
    const sA = studentRels.get(r.studentAId);
    const sB = studentRels.get(r.studentBId);
    if (sA) {
        if (r.type === 'green') sA.friends.push(r.studentBId);
        else sA.enemies.push(r.studentBId);
    }
    if (sB) {
        if (r.type === 'green') sB.friends.push(r.studentAId);
        else sB.enemies.push(r.studentAId);
    }
  });

  // Cost Function
  const calculateCost = (assigns: Record<string, string | null>) => {
    let cost = 0;
    
    // We iterate through all students to find their positions
    // Optimization: Only iterate assigned students
    const placedStudents = new Map<string, string>(); // studentId -> seatId
    for (const [seatId, studentId] of Object.entries(assigns)) {
        if (studentId) placedStudents.set(studentId, seatId);
    }

    // 1. Zone Preferences
    students.forEach(s => {
        const seatId = placedStudents.get(s.id);
        if (!seatId) return; // Unseated students don't contribute to placement cost (or huge penalty?)
        // For now, we only optimize PLACED students.

        const pos = seatPosMap.get(seatId);
        if (!pos) return;

        if (s.zonePreference) {
            // Front row = smaller Y (assuming 0,0 is top-left)
            // Back row = larger Y
            // Threshold: roomHeight / 2
            const isFront = pos.y < roomHeight / 2;
            
            if (s.zonePreference === 'front' && !isFront) cost += config.weights.zone;
            if (s.zonePreference === 'back' && isFront) cost += config.weights.zone;
        }
    });

    // 2. Relationships
    // We only need to check each pair once.
    // Iterate relationships directly.
    relationships.forEach(r => {
        const seatA = placedStudents.get(r.studentAId);
        const seatB = placedStudents.get(r.studentBId);
        
        if (seatA && seatB) {
            const posA = seatPosMap.get(seatA)!;
            const posB = seatPosMap.get(seatB)!;
            
            const dx = posA.x - posB.x;
            const dy = posA.y - posB.y;
            const distSq = dx*dx + dy*dy;
            const dist = Math.sqrt(distSq);

            if (r.type === 'green') {
                // Minimize distance
                // Cost increases as distance increases
                cost += dist * config.weights.green;
            } else {
                // Maximize distance (Red)
                // Cost increases as distance decreases
                // Use inverse square law or simple threshold
                // Avoid division by zero (shouldn't happen if seats distinct)
                cost += (config.weights.red * 10) / (distSq + 0.1); 
            }
        } else {
            // Penalty for broken relationship? (One unseated)
            // Maybe slight penalty to encourage seating friends together if possible
        }
    });

    return cost;
  };

  // Simulated Annealing Loop
  let currentCost = calculateCost(currentAssignments);
  let bestAssignments = { ...currentAssignments };
  let bestCost = currentCost;
  
  let temperature = 100.0;
  const coolingRate = 0.995;
  const absoluteZero = 0.001;

  // Identify movable students/seats
  // Locked students/seats should be excluded from moves?
  // We assume the input 'seats' and 'students' lists passed to us are valid/moveable 
  // OR we need to check constraints.
  // For simplicity V1: All students in the assignment map are movable.
  // We need a list of all seat IDs.
  const seatIds = seats.map(s => s.id);

  let iteration = 0;

  while (temperature > absoluteZero && iteration < config.maxIterations) {
    // Generate Neighbor
    const newAssignments = { ...currentAssignments };
    
    // Pick random move type: 
    // 0: Swap two occupied seats
    // 1: Move student to empty seat
    // 2: Swap occupied and empty (same as 1)
    
    // Simplified: Pick two random seats.
    const idx1 = Math.floor(Math.random() * seatIds.length);
    const idx2 = Math.floor(Math.random() * seatIds.length);
    
    const seat1 = seatIds[idx1];
    const seat2 = seatIds[idx2];

    if (seat1 !== seat2) {
        const student1 = newAssignments[seat1];
        const student2 = newAssignments[seat2];
        
        // Swap
        newAssignments[seat1] = student2;
        newAssignments[seat2] = student1; // Handle nulls correctly

        // Calculate new cost
        const newCost = calculateCost(newAssignments);
        const delta = newCost - currentCost;

        // Acceptance Probability
        if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
            currentAssignments = newAssignments;
            currentCost = newCost;
            
            if (currentCost < bestCost) {
                bestCost = currentCost;
                bestAssignments = { ...currentAssignments };
            }
        }
    }

    temperature *= coolingRate;
    iteration++;

    // Report progress every 100 iterations
    if (iteration % 500 === 0) {
        self.postMessage({
            type: 'PROGRESS',
            payload: {
                currentCost,
                assignments: currentAssignments,
                iteration
            }
        });
    }
  }

  // Final Result
  self.postMessage({
    type: 'DONE',
    payload: {
        currentCost: bestCost,
        assignments: bestAssignments,
        iteration
    }
  });
}
