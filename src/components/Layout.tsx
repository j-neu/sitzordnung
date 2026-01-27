import Sidebar from './Sidebar';
import RoomCanvas from './RoomCanvas';
import { useRef } from 'react';
import Konva from 'konva';

const Layout = () => {
  const stageRef = useRef<Konva.Stage>(null);

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
