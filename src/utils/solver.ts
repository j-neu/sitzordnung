import type { Student, Relationship } from '../types';

export type SeatPosition = {
  id: string;
  x: number;
  y: number;
};

export type SolverConfig = {
  maxIterations: number;
  weights: {
    green: number; // Distance minimization for friends
    red: number;   // Distance maximization for enemies
    zone: number;  // Penalty for wrong zone
  };
};

export type SolverResult = {
  assignments: Record<string, string | null>;
  cost: number;
  iterations: number;
};

export function runOptimization(
  students: Student[],
  seats: SeatPosition[],
  initialAssignments: Record<string, string | null>,
  relationships: Relationship[],
  roomHeight: number,
  config: SolverConfig,
  lockedSeatIds: string[] = [],
  onProgress?: (result: SolverResult) => void
): SolverResult {
  // Current state: Map<seatId, studentId | null>
  let currentAssignments = { ...initialAssignments };

  // Pre-calculate Seat positions Map for O(1) access
  const seatPosMap = new Map<string, {x: number, y: number}>();
  seats.forEach(s => seatPosMap.set(s.id, { x: s.x, y: s.y }));

  // Pre-process relationships for faster lookup
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

    const placedStudents = new Map<string, string>(); // studentId -> seatId
    for (const [seatId, studentId] of Object.entries(assigns)) {
        if (studentId) placedStudents.set(studentId, seatId);
    }

    // 1. Zone Preferences
    students.forEach(s => {
        const seatId = placedStudents.get(s.id);
        if (!seatId) return;

        const pos = seatPosMap.get(seatId);
        if (!pos) return;

        if (s.zonePreference) {
            const isFront = pos.y < roomHeight / 2;

            if (s.zonePreference === 'front' && !isFront) cost += config.weights.zone;
            if (s.zonePreference === 'back' && isFront) cost += config.weights.zone;
        }
    });

    // 2. Relationships
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
                cost += dist * config.weights.green;
            } else {
                cost += (config.weights.red * 10) / (distSq + 0.1);
            }
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

  // Locked seats are excluded from the swap-candidate pool entirely, so
  // their assignment can never be picked as idx1/idx2 below and therefore
  // never changes for the duration of the run.
  const lockedSet = new Set(lockedSeatIds);
  const seatIds = seats.map(s => s.id).filter(id => !lockedSet.has(id));

  let iteration = 0;

  while (temperature > absoluteZero && iteration < config.maxIterations) {
    const newAssignments = { ...currentAssignments };

    const idx1 = Math.floor(Math.random() * seatIds.length);
    const idx2 = Math.floor(Math.random() * seatIds.length);

    const seat1 = seatIds[idx1];
    const seat2 = seatIds[idx2];

    if (seat1 !== undefined && seat2 !== undefined && seat1 !== seat2) {
        const student1 = newAssignments[seat1];
        const student2 = newAssignments[seat2];

        newAssignments[seat1] = student2;
        newAssignments[seat2] = student1;

        const newCost = calculateCost(newAssignments);
        const delta = newCost - currentCost;

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

    if (onProgress && iteration % 500 === 0) {
        onProgress({ assignments: currentAssignments, cost: currentCost, iterations: iteration });
    }
  }

  return { assignments: bestAssignments, cost: bestCost, iterations: iteration };
}
