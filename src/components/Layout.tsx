import Sidebar from './Sidebar';
import RoomCanvas from './RoomCanvas';
import MobileTopBar from './MobileTopBar';
import MobileToolboxSheet from './MobileToolboxSheet';
import { useRef } from 'react';
import Konva from 'konva';
import { useIsMobile } from '../hooks/useIsMobile';
import { useStore } from '../store/useStore';

const Layout = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const isMobile = useIsMobile();
  const width = useStore(state => state.width);
  const height = useStore(state => state.height);
  const unit = useStore(state => state.unit);
  const furniture = useStore(state => state.furniture);

  const handleExportImage = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'classroom-plan.png';
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSaveLayout = () => {
    const data = { width, height, unit, furniture, students: [], relationships: [], assignments: {} };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'classroom-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <MobileTopBar title="Classroom Plan" onSave={handleSaveLayout} />
        <div className="flex-1 relative overflow-hidden bg-gray-50">
          <RoomCanvas stageRef={stageRef} />
        </div>
        <MobileToolboxSheet />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="bg-white border-r border-gray-200 shadow-md z-10 flex flex-col">
        <Sidebar onExportImage={handleExportImage} />
      </div>
      <div className="flex-1 bg-gray-50 relative overflow-hidden">
        <RoomCanvas stageRef={stageRef} />
      </div>
    </div>
  );
};

export default Layout;
