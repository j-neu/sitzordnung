import { Stage, Layer, Rect, Text, Group, Circle, Line } from 'react-konva';
import { useStore } from '../store/useStore';
import type { Furniture, Student } from '../types';
import { useState, useMemo, useRef, useEffect, type RefObject, type ReactElement } from 'react';
import { Plus, Minus } from 'lucide-react';
import ContextMenu from './ContextMenu';
import { PIXELS_PER_METER, GRID_SIZE_METERS, FURNITURE_DIMENSIONS, SEAT_LAYOUTS, MIN_ZOOM, MAX_ZOOM } from '../constants';
import { getAbsoluteSeatPositions } from '../utils/geometry';
import { decideSeatClickAction } from '../utils/interaction';
import { computeFitScale, computeZoomTransform, type CameraTransform } from '../utils/camera';
import Konva from 'konva';
import { TRANSLATIONS } from '../locales';

interface RoomCanvasProps {
  stageRef: RefObject<Konva.Stage | null>;
}

export default function RoomCanvas({ stageRef }: RoomCanvasProps) {
  const {
    width, height, furniture, updateFurniture,
    assignments, students, unassignStudent, removeFurniture, relationships,
    interactionMode, handleRelationClick, relationSelection, language,
    pendingAssignment, setPendingAssignment, assignPendingStudentToSeat
  } = useStore();

  const t = TRANSLATIONS[language];
  const stageWidth = width * PIXELS_PER_METER;
  const stageHeight = height * PIXELS_PER_METER;
  const PADDING = 60;

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; furnitureId: string; seatId?: string } | null>(null);

  // --- Pan/zoom camera ---
  // The Stage is sized to fill its container (not the room's content size);
  // stage.scale()/stage.position() act as a camera over the room, mutated
  // imperatively (same pattern as FurnitureItem's onDragEnd) so gestures
  // don't churn React state.
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const hasFitRef = useRef(false);
  const lastFittedRoomSizeRef = useRef({ w: width, h: height });
  const pinchRef = useRef<{ dist: number; center: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width: w, height: h } = entry.contentRect;
      setContainerSize({ width: w, height: h });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return;
    const stage = stageRef.current;
    if (!stage) return;

    const roomChanged = lastFittedRoomSizeRef.current.w !== width || lastFittedRoomSizeRef.current.h !== height;
    if (hasFitRef.current && !roomChanged) return;

    const contentSize = { width: stageWidth + PADDING * 2, height: stageHeight + PADDING * 2 };
    const fit = computeFitScale(containerSize, contentSize);
    stage.scale({ x: fit.scale, y: fit.scale });
    stage.position({ x: fit.x, y: fit.y });
    stage.batchDraw();

    hasFitRef.current = true;
    lastFittedRoomSizeRef.current = { w: width, h: height };
  }, [containerSize, width, height, stageWidth, stageHeight, stageRef]);

  const applyZoom = (pointer: { x: number; y: number }, scaleBy: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    const current: CameraTransform = { scale: stage.scaleX(), x: stage.x(), y: stage.y() };
    const next = computeZoomTransform(current, pointer, scaleBy, { min: MIN_ZOOM, max: MAX_ZOOM });
    stage.scale({ x: next.scale, y: next.scale });
    stage.position({ x: next.x, y: next.y });
    stage.batchDraw();
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    if (e.evt.ctrlKey || e.evt.metaKey) {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const scaleBy = Math.exp(-e.evt.deltaY * 0.01);
      applyZoom(pointer, scaleBy);
    } else {
      stage.position({ x: stage.x() - e.evt.deltaX, y: stage.y() - e.evt.deltaY });
      stage.batchDraw();
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length !== 2) return;
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const box = stage.container().getBoundingClientRect();
    const t0 = touches[0];
    const t1 = touches[1];
    const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
    const center = {
      x: (t0.clientX + t1.clientX) / 2 - box.left,
      y: (t0.clientY + t1.clientY) / 2 - box.top,
    };

    if (pinchRef.current) {
      const scaleBy = dist / pinchRef.current.dist;
      applyZoom(center, scaleBy);
    }

    pinchRef.current = { dist, center };
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length < 2) {
      pinchRef.current = null;
    }
  };

  const zoomAtCenter = (scaleBy: number) => {
    if (containerSize.width === 0 || containerSize.height === 0) return;
    applyZoom({ x: containerSize.width / 2, y: containerSize.height / 2 }, scaleBy);
  };

  // Calculate seat positions for lines
  const seatPositions = useMemo(() => {
    return getAbsoluteSeatPositions(furniture);
  }, [furniture]);

  const relationshipLines = useMemo(() => {
    const lines: ReactElement[] = [];
    
    // Map studentId -> seatId
    const studentToSeat = new Map<string, string>();
    Object.entries(assignments).forEach(([seatId, studentId]) => {
        if (studentId) studentToSeat.set(studentId, seatId);
    });

    relationships.forEach(rel => {
        const seatAId = studentToSeat.get(rel.studentAId);
        const seatBId = studentToSeat.get(rel.studentBId);

        if (seatAId && seatBId) {
            const posA = seatPositions.find(p => p.id === seatAId);
            const posB = seatPositions.find(p => p.id === seatBId);

            if (posA && posB) {
                const color = rel.type === 'green' ? '#22C55E' : '#EF4444'; // Green-500 : Red-500
                lines.push(
                    <Line
                        key={rel.id}
                        points={[
                            posA.x * PIXELS_PER_METER, 
                            posA.y * PIXELS_PER_METER, 
                            posB.x * PIXELS_PER_METER, 
                            posB.y * PIXELS_PER_METER
                        ]}
                        stroke={color}
                        strokeWidth={2}
                        dash={rel.type === 'red' ? [10, 5] : undefined}
                        opacity={0.6}
                        tension={0.5}
                    />
                );
            }
        }
    });
    return lines;
  }, [assignments, relationships, seatPositions]);

  // Dot Grid Generation
  const dots = [];
  const gridStep = GRID_SIZE_METERS * PIXELS_PER_METER;
  
  for (let x = 0; x <= stageWidth; x += gridStep) {
    for (let y = 0; y <= stageHeight; y += gridStep) {
      dots.push(
        <Circle 
          key={`${x}-${y}`} 
          x={x} 
          y={y} 
          radius={1.5} 
          fill="#CBD5E1" // Slate-300
        />
      );
    }
  }

  const getStudentForSeat = (seatId: string) => {
    const studentId = assignments[seatId];
    return students.find(s => s.id === studentId);
  };

  const pendingStudent = students.find(s => s.id === pendingAssignment);

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>, furnitureId: string, seatId?: string) => {
    e.evt.preventDefault();
    setContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      furnitureId,
      seatId
    });
  };

  const getContextMenuOptions = () => {
    if (!contextMenu) return [];
    
    const item = furniture.find(f => f.id === contextMenu.furnitureId);
    if (!item) return [];

    const options = [];

    // If specific seat clicked
    if (contextMenu.seatId) {
        const student = getStudentForSeat(contextMenu.seatId);
        if (student) {
             options.push({
                label: `${t.canvas.context.unassign} ${student.name}`,
                action: () => unassignStudent(student.id)
             });
        }
    }

    // Rotate
    options.push({
      label: t.canvas.context.rotate,
      action: () => updateFurniture(item.id, { rotation: ((item.rotation || 0) + 90) % 360 })
    });

    // Lock/Unlock
    options.push({
      label: item.isLocked ? t.canvas.context.unlock : t.canvas.context.lock,
      action: () => updateFurniture(item.id, { isLocked: !item.isLocked })
    });

    // Delete
    options.push({
      label: t.canvas.context.delete,
      action: () => {
          // Cleanup assignments for this furniture
          // Ideally useStore should handle this, but for now we manually unassign?
          // No, useStore's removeFurniture handles clean up of assignments if we implement it right, 
          // or we can iterate seats here.
          // For now, simple remove.
          removeFurniture(item.id);
      },
      danger: true
    });

    return options;
  };

  return (
    <div
      className="h-full w-full overflow-hidden bg-gray-50 relative"
      onClick={() => setContextMenu(null)}
    >
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={getContextMenuOptions()}
          onClose={() => setContextMenu(null)}
        />
      )}

      {pendingStudent && (
        <PlacementBanner
          studentName={pendingStudent.name}
          onCancel={() => setPendingAssignment(null)}
        />
      )}

      {/* Zoom Controls */}
      <div className="absolute left-4 top-4 flex flex-col gap-2 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); zoomAtCenter(1.2); }}
          className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); zoomAtCenter(1 / 1.2); }}
          className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50"
        >
          <Minus size={18} />
        </button>
      </div>

      <div ref={containerRef} className="absolute inset-0 p-4">
        {containerSize.width > 0 && containerSize.height > 0 && (
          <Stage
            ref={stageRef}
            width={containerSize.width}
            height={containerSize.height}
            draggable
            onWheel={handleWheel}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Layer x={PADDING} y={PADDING}>

              <Rect 
                width={stageWidth} 
                height={stageHeight} 
                fill="rgba(255,255,255,0.8)"
                stroke="#E2E8F0"
                strokeWidth={2}
                cornerRadius={24}
              />

              {/* Dot Grid */}
              <Group opacity={0.5}>
                {dots}
              </Group>
              
              {/* Relationship Lines */}
              <Group>
                {relationshipLines}
              </Group>

              {/* Front Row Label */}

              {furniture.map((item) => (
                <FurnitureItem 
                  key={item.id} 
                  item={item} 
                  assignments={assignments}
                  students={students}
                  roomWidth={width}
                  roomHeight={height}
                  updateFurniture={updateFurniture}
                  onContextMenu={handleContextMenu}
                  handleRelationClick={handleRelationClick}
                  interactionMode={interactionMode}
                  relationSelection={relationSelection}
                  language={language}
                  pendingAssignment={pendingAssignment}
                  assignPendingStudentToSeat={assignPendingStudentToSeat}
                />
              ))}
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
}

export function PlacementBanner({ studentName, onCancel }: { studentName: string; onCancel: () => void }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 max-w-[90%] bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-2xl shadow-lg">
      <span className="truncate">Placing: {studentName} — tap a seat</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
        className="shrink-0 text-white/70 hover:text-white font-bold"
      >
        Cancel
      </button>
    </div>
  );
}

import type { Language } from '../locales';

interface FurnitureItemProps {
  item: Furniture;
  assignments: Record<string, string | null>;
  students: Student[];
  roomWidth: number;
  roomHeight: number;
  updateFurniture: (id: string, updates: Partial<Furniture>) => void;
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>, furnitureId: string, seatId?: string) => void;
  handleRelationClick: (studentId: string) => void;
  interactionMode: 'none' | 'green' | 'red' | 'define';
  relationSelection: { type: 'single'; id: string } | { type: 'pair'; a: string; b: string } | null;
  language: Language;
  pendingAssignment: string | null;
  assignPendingStudentToSeat: (seatId: string) => void;
}

function FurnitureItem({
    item, assignments, students, roomWidth, roomHeight, updateFurniture, onContextMenu,
    handleRelationClick, interactionMode, relationSelection, language,
    pendingAssignment, assignPendingStudentToSeat
}: FurnitureItemProps) {
  const t = TRANSLATIONS[language];
  const { width, height, color } = FURNITURE_DIMENSIONS[item.type];
  const pixelWidth = width * PIXELS_PER_METER;
  const pixelHeight = height * PIXELS_PER_METER;
  
  const isLocked = !!item.isLocked;
  const isTable = item.type.startsWith('table');
  
  // Get Seats
  const seatLayouts = isTable ? (SEAT_LAYOUTS[item.type] || SEAT_LAYOUTS['table-single']) : [];

  return (
    <Group
      x={(item.x * PIXELS_PER_METER) + (pixelWidth / 2)}
      y={(item.y * PIXELS_PER_METER) + (pixelHeight / 2)}
      offsetX={pixelWidth / 2}
      offsetY={pixelHeight / 2}
      rotation={item.rotation || 0}
      draggable={!isLocked}
      onContextMenu={(e) => onContextMenu(e, item.id)}
      onDblClick={() => {
        if (!isLocked) {
          updateFurniture(item.id, {
            rotation: ((item.rotation || 0) + 90) % 360
          });
        }
      }}
      onDragEnd={(e) => {
        const node = e.target;
        const newCenterX = node.x();
        const newCenterY = node.y();
        
        let newStoreX = (newCenterX - pixelWidth / 2) / PIXELS_PER_METER;
        let newStoreY = (newCenterY - pixelHeight / 2) / PIXELS_PER_METER;
        
        // Snap
        newStoreX = Math.round(newStoreX * 10) / 10;
        newStoreY = Math.round(newStoreY * 10) / 10;

        const isRotated = (node.rotation() % 180) === 90;
        const effectiveWidthM = isRotated ? height : width;
        const effectiveHeightM = isRotated ? width : height;

        newStoreX = Math.max(0, Math.min(newStoreX, roomWidth - effectiveWidthM));
        newStoreY = Math.max(0, Math.min(newStoreY, roomHeight - effectiveHeightM));

        updateFurniture(item.id, { x: newStoreX, y: newStoreY });
        
        node.position({
          x: (newStoreX * PIXELS_PER_METER) + (pixelWidth / 2),
          y: (newStoreY * PIXELS_PER_METER) + (pixelHeight / 2)
        });
      }}
    >
        {/* Main Furniture Body */}
        {/* If it's a double table, we might want to render two rects visually? 
            Or just one big rect with a line? 
            Let's stick to one big rect for the furniture itself.
        */}
        <Rect
            width={pixelWidth}
            height={pixelHeight}
            fill={isLocked ? '#FEF2F2' : color}
            stroke={isLocked ? '#EF4444' : '#E2E8F0'}
            strokeWidth={1}
            cornerRadius={16}
            shadowColor="#0f172a"
            shadowBlur={5}
            shadowOpacity={0.05}
            shadowOffset={{ x: 0, y: 4 }}
        />

        {/* Seats (Only for Tables) */}
        {seatLayouts?.map((layout) => {
            const seatId = item.id + layout.idSuffix;
            const studentId = assignments[seatId];
            const student = students.find(s => s.id === studentId);
            const isOccupied = !!student;
            
            const isSelected = student && relationSelection?.type === 'single' && relationSelection.id === student.id;
            
            // Highlight color based on tool mode
            let strokeColor = isOccupied ? '#3B82F6' : (isLocked ? '#EF4444' : '#E2E8F0');
            let strokeWidth = isOccupied ? 2 : 1;
            
            if (isSelected) {
                strokeWidth = 3;
                if (interactionMode === 'green') strokeColor = '#22C55E';
                else if (interactionMode === 'red') strokeColor = '#EF4444';
                else strokeColor = '#3B82F6';
            }

            const seatPixelX = layout.x * PIXELS_PER_METER;
            const seatPixelY = layout.y * PIXELS_PER_METER;
            const seatPixelW = layout.width * PIXELS_PER_METER;
            const seatPixelH = layout.height * PIXELS_PER_METER;

            const handleSeatTap = () => {
                const action = decideSeatClickAction({
                    interactionMode,
                    hasStudent: !!student,
                    hasPendingAssignment: !!pendingAssignment,
                });

                if (action === 'relation' && student) {
                    handleRelationClick(student.id);
                } else if (action === 'assign') {
                    assignPendingStudentToSeat(seatId);
                }
            };

            return (
                <Group
                    key={layout.idSuffix}
                    x={seatPixelX}
                    y={seatPixelY}
                    width={seatPixelW}
                    height={seatPixelH}
                    onContextMenu={(e) => {
                        e.cancelBubble = true; // Stop bubbling to furniture
                        onContextMenu(e, item.id, seatId);
                    }}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        handleSeatTap();
                    }}
                    onTap={(e) => { // Mobile support
                        e.cancelBubble = true;
                        handleSeatTap();
                    }}
                >
                    {/* Seat Visual Area */}
                     <Rect
                        width={seatPixelW}
                        height={seatPixelH}
                        fill="transparent"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        dash={(!isOccupied && !isLocked) ? [6, 4] : undefined}
                        cornerRadius={12}
                    />

                    {/* Content */}
                    <Group x={8} y={8} width={seatPixelW - 16}>
                         <Text 
                            text={t.canvas.desk} 
                            fontSize={9} 
                            fontFamily="Inter" 
                            fontStyle="bold"
                            fill={isLocked ? "#EF4444" : "#94A3B8"} 
                         />
                          <Text 
                            y={14}
                            text={isLocked ? t.canvas.locked : (student ? student.name : t.canvas.open)} 
                            fontSize={student ? 13 : 11}
                            fontFamily="Inter"
                            fontStyle="bold"
                            fill={student ? "#1E293B" : (isLocked ? "#EF4444" : "#CBD5E1")}
                            width={seatPixelW - 16}
                            ellipsis={true}
                            wrap="none"
                          />
                          {student && (
                            <Circle
                                x={seatPixelW - 24}
                                y={seatPixelH - 24}
                                radius={4}
                                fill="#22C55E"
                            />
                          )}
                           {!student && !isLocked && (
                                <Group y={28}>
                                     <Circle radius={10} fill="#F1F5F9" x={10} y={10} />
                                     <Text text="+" x={4} y={3} fontSize={14} fill="#94A3B8" fontStyle="bold" />
                                </Group>
                           )}
                    </Group>
                </Group>
            );
        })}

        {!isTable && (
            <Text 
                text={t.furniture.items[item.type as keyof typeof t.furniture.items]?.toUpperCase() || item.type.toUpperCase()} 
                width={pixelWidth} 
                align="center" 
                y={pixelHeight / 2 - 6} 
                fontSize={10} 
                fontFamily="Inter"
                fontStyle="bold"
                fill="rgba(0,0,0,0.3)" 
            />
        )}
    </Group>
  );
}