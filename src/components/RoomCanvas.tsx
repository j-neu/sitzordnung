import { Stage, Layer, Rect, Text, Group, Circle, Line } from 'react-konva';
import { useStore } from '../store/useStore';
import type { Furniture, Student } from '../types';
import { useState, useMemo, type RefObject, type ReactElement } from 'react';
import ContextMenu from './ContextMenu';
import { PIXELS_PER_METER, GRID_SIZE_METERS, FURNITURE_DIMENSIONS, SEAT_LAYOUTS } from '../constants';
import { getAbsoluteSeatPositions } from '../utils/geometry';
import Konva from 'konva';
import { TRANSLATIONS } from '../locales';

interface RoomCanvasProps {
  stageRef: RefObject<Konva.Stage | null>;
}

export default function RoomCanvas({ stageRef }: RoomCanvasProps) {
  const { 
    width, height, furniture, updateFurniture, 
    assignments, students, assignStudent, unassignStudent, removeFurniture, relationships,
    interactionMode, handleRelationClick, relationSelection, language
  } = useStore();
  
  const t = TRANSLATIONS[language];
  const stageWidth = width * PIXELS_PER_METER;
  const stageHeight = height * PIXELS_PER_METER;
  const PADDING = 60;

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; furnitureId: string; seatId?: string } | null>(null);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData('studentId');
    if (!studentId) return;

    const stageContainer = document.getElementById('room-stage-container');
    if (!stageContainer) return;
    
    const rect = stageContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - PADDING;
    const y = e.clientY - rect.top - PADDING;
    
    const roomX = x / PIXELS_PER_METER;
    const roomY = y / PIXELS_PER_METER;
    
    // Find target furniture and seat
    for (const f of furniture) {
        if (f.isLocked) continue;
        if (!f.type.startsWith('table')) continue;

        const dims = FURNITURE_DIMENSIONS[f.type];
        const isRotated = (f.rotation || 0) % 180 === 90;
        const effectiveWidth = isRotated ? dims.height : dims.width;
        const effectiveHeight = isRotated ? dims.width : dims.height;

        // Bounding box check for furniture
        if (roomX >= f.x && roomX <= f.x + effectiveWidth &&
            roomY >= f.y && roomY <= f.y + effectiveHeight) {
            
            // It's in this furniture. Now find which seat.
            // Transform point to furniture local space
            // This is complex due to rotation.
            // Simplified: If double table, check if closer to start or end?
            // Correct approach: Inverse rotate the point relative to furniture origin.
            
            // Center of furniture
            const cx = f.x + effectiveWidth / 2;
            const cy = f.y + effectiveHeight / 2;

            // Translate point to origin
            const dx = roomX - cx;
            const dy = roomY - cy;

            // Rotate point backwards
            const rad = - (f.rotation || 0) * Math.PI / 180;
            const localX_centered = dx * Math.cos(rad) - dy * Math.sin(rad);
            const localY_centered = dx * Math.sin(rad) + dy * Math.cos(rad);

            // Translate back to local top-left
            const localX = localX_centered + dims.width / 2;
            const localY = localY_centered + dims.height / 2;

            // Check seats
            const seats = SEAT_LAYOUTS[f.type] || SEAT_LAYOUTS['table-single'];
            
            for (const seat of seats!) {
                if (localX >= seat.x && localX <= seat.x + seat.width &&
                    localY >= seat.y && localY <= seat.y + seat.height) {
                    
                    assignStudent(studentId, f.id + seat.idSuffix);
                    return;
                }
            }
        }
    }
  };

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
      className="h-full w-full overflow-auto bg-gray-50 custom-scrollbar relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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

      <div className="min-w-fit min-h-fit p-16 flex justify-center items-center">
        <div 
            id="room-stage-container"
            className="bg-white/50 rounded-3xl overflow-hidden backdrop-blur-sm border border-white/20 shadow-xl"
        >
          <Stage ref={stageRef} width={stageWidth + PADDING * 2} height={stageHeight + PADDING * 2}>
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
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
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
}

function FurnitureItem({ 
    item, assignments, students, roomWidth, roomHeight, updateFurniture, onContextMenu,
    handleRelationClick, interactionMode, relationSelection, language
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
                        if (student) {
                            e.cancelBubble = true;
                            handleRelationClick(student.id);
                        }
                    }}
                    onTap={(e) => { // Mobile support
                        if (student) {
                            e.cancelBubble = true;
                            handleRelationClick(student.id);
                        }
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