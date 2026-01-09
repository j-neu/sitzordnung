# Development Tasks

## Phase 1: Project Initialization & Setup
- [ ] Initialize React + Vite project with TypeScript.
- [ ] Setup Tailwind CSS.
- [ ] Configure project structure (components, hooks, utils, types).
- [ ] Install necessary dependencies (e.g., `konva` or `react-konva` for canvas manipulation, `lucide-react` for icons).

## Phase 2: Core Data Structures
- [ ] Define TypeScript interfaces for:
  - `Student` (id, name, preferences, relationships)
  - `Seat` (id, x, y, type, occupantId, isLocked)
  - `Room` (dimensions, furniture, objects)
  - `Constraint` (type: lock, zone, relation)
- [ ] Create state management store (Zustand) to hold application state.

## Phase 3: Room Editor (Canvas/SVG)
- [x] Implement UI to set Room Dimensions (Width/Height).
- [ ] Implement scalable Canvas/Stage area.
- [ ] Create draggable components for:
  - Teacher's Desk
  - Whiteboard
  - Door/Window
  - Tables (1-seater, 2-seater)
- [ ] Implement logic to add/remove/rotate furniture.
- [ ] Implement collision detection (basic) to prevent overlapping furniture.

## Phase 4: Student Management UI
- [ ] Create Sidebar/Modal for student input.
- [ ] Implement bulk import (paste text).
- [ ] Implement manual add/edit/delete student.
- [ ] Implement "Unseated Students" list.

## Phase 5: Interaction & Constraints
- [ ] Implement Drag & Drop:
  - Student -> Seat (assign)
  - Seat -> Student (unassign)
- [ ] Implement Context Menu / UI for Seat properties:
  - Lock Seat (Empty/Occupied)
- [ ] Implement Context Menu / UI for Student properties:
  - Set Zone Preference (Front/Back)
  - Manage Relationships (Green/Red selector)

## Phase 6: Optimization Algorithm
- [ ] Design the Cost Function:
  - `Cost = (w1 * GreenDist) - (w2 * RedDist) + Penalties`
- [ ] Implement the Solver (e.g., Simulated Annealing):
  - Initial state generation (random valid placement).
  - Neighbor generation (swap two students, move student to empty seat).
  - Acceptance probability logic.
- [ ] Run solver in a Web Worker to prevent UI freezing.

## Phase 7: Polish & Visualization
- [ ] Visualize "Green" and "Red" lines on the map during review.
- [ ] Add "Generate" button with progress indicator.
- [ ] Add "Print" or "Export to Image" functionality.
