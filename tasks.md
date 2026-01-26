# Development Tasks

## Phase 1: Project Initialization & Setup
- [x] Initialize React + Vite project with TypeScript.
- [x] Setup Tailwind CSS.
- [x] Configure project structure (components, hooks, utils, types).
- [x] Install necessary dependencies (e.g., `konva` or `react-konva` for canvas manipulation, `lucide-react` for icons).

## Phase 2: Core Data Structures
- [x] Define TypeScript interfaces for:
  - `Student` (id, name, preferences, relationships)
  - `Seat` (id, x, y, type, occupantId, isLocked)
  - `Room` (dimensions, furniture, objects)
  - `Constraint` (type: lock, zone, relation)
- [x] Create state management store (Zustand) to hold application state.

## Phase 3: Room Editor (Canvas/SVG)
- [x] Implement UI to set Room Dimensions (Width/Height).
- [x] Implement scalable Canvas/Stage area.
- [x] Create draggable components for:
  - Teacher's Desk
  - Whiteboard
  - Door/Window
  - Tables (1-seater, 2-seater)
- [x] Implement logic to add/remove/rotate furniture.
- [x] Implement collision detection (basic) to prevent overlapping furniture.

## Phase 4: Student Management UI
- [x] Create Sidebar/Modal for student input.
- [x] Implement bulk import (paste text).
- [x] Implement manual add/edit/delete student.
- [x] Implement "Unseated Students" list.

## Phase 5: Interaction & Constraints
- [x] Implement Drag & Drop:
  - Student -> Seat (assign)
- [x] Seat -> Student (unassign)
- [x] Implement Context Menu / UI for Seat properties:
  - Lock Seat (Empty/Occupied)
  - Delete Furniture
- [x] Implement Context Menu / UI for Student properties:
  - Set Zone Preference (Front/Back)
  - Manage Relationships (Green/Red selector)
- [x] Support Double Tables (2 seats).

## Phase 6: Optimization Algorithm
- [x] Implement "Random Fill" feature (assign unseated students to random empty seats).
- [x] Design the Cost Function:
  - `Cost = (w1 * GreenDist) - (w2 * RedDist) + Penalties`
- [x] Implement the Solver (e.g., Simulated Annealing):
  - Initial state generation (random valid placement).
  - Neighbor generation (swap two students, move student to empty seat).
  - Acceptance probability logic.
- [x] Run solver in a Web Worker to prevent UI freezing.

## Phase 7: Polish & Visualization
- [X] Visualize "Green" and "Red" lines on the map during review.
- [X] Add "Generate" button with progress indicator.
- [X] Add "Print" or "Export to Image" functionality.

## Phase 8: Persistence
- [x] Implement Save Room Layout to JSON.
- [x] Implement Load Room Layout from JSON.
