import Sidebar from './Sidebar';
import RoomCanvas from './RoomCanvas';

const Layout = () => {
  return (
    <div className="flex h-full">
      <div className="w-80 bg-white border-r border-gray-200 shadow-md z-10 flex flex-col">
        <Sidebar />
      </div>
      <div className="flex-1 bg-gray-50 relative overflow-hidden">
        <RoomCanvas />
      </div>
    </div>
  );
};

export default Layout;
