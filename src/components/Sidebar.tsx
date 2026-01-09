import { useState } from 'react';
import { Users, Armchair, Settings, Plus, Search, GripVertical, User, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import clsx from 'clsx';

type Tab = 'furniture' | 'students' | 'optimize';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('students');
  
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-sm z-10 w-96">
      {/* Header / Tabs */}
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Classroom Editor</h1>
        
        <div className="flex p-1 bg-slate-100 rounded-xl mb-2">
          <NavButton 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')} 
            label="Students"
            icon={<Users size={16} />}
          />
          <NavButton 
            active={activeTab === 'furniture'} 
            onClick={() => setActiveTab('furniture')} 
            label="Furniture" 
            icon={<Armchair size={16} />}
          />
          <NavButton 
            active={activeTab === 'optimize'} 
            onClick={() => setActiveTab('optimize')} 
            label="Auto-Fill" 
            icon={<Settings size={16} />}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'furniture' && <FurniturePanel />}
        {activeTab === 'students' && <StudentsPanel />}
        {activeTab === 'optimize' && <OptimizePanel />}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all",
        active ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StudentsPanel() {
  const students = useStore(state => state.students);
  const assignments = useStore(state => state.assignments);
  const addStudent = useStore(state => state.addStudent);
  const removeStudent = useStore(state => state.removeStudent);
  const [newName, setNewName] = useState('');

  // Count unassigned
  const unassignedStudents = students.filter(s => !Object.values(assignments).includes(s.id));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addStudent(newName.trim());
      setNewName('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Search & Add */}
      <div className="p-4 bg-white border-b border-gray-100 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search students..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
        
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add new student..."
            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
          />
          <button type="submit" className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            <Plus size={20} />
          </button>
        </form>
      </div>

      {/* List Header */}
      <div className="px-5 py-3 flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unassigned Students</h3>
        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {unassignedStudents.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
        {unassignedStudents.map(student => (
          <div key={student.id} className="group flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold border border-orange-200">
              {student.name.substring(0, 2).toUpperCase()}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800 truncate">{student.name}</h4>
              <p className="text-[10px] font-medium text-slate-400 truncate">High Priority • Front Row</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 text-gray-300">
               <button 
                  onClick={() => removeStudent(student.id)}
                  className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
               </button>
               <GripVertical size={16} className="cursor-grab hover:text-slate-400" />
            </div>
          </div>
        ))}

        {unassignedStudents.length === 0 && (
          <div className="text-center py-12 opacity-50">
            <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">All students assigned!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FurniturePanel() {
  const width = useStore(state => state.width);
  const height = useStore(state => state.height);
  const unit = useStore(state => state.unit);
  const setRoomDimensions = useStore(state => state.setRoomDimensions);
  const setUnit = useStore(state => state.setUnit);
  const addFurniture = useStore(state => state.addFurniture);

  // Constants for conversion
  const FEET_PER_METER = 3.28084;
  const displayWidth = unit === 'meters' ? width : width * FEET_PER_METER;
  const displayHeight = unit === 'meters' ? height : height * FEET_PER_METER;

  const handleDimensionChange = (dim: 'width' | 'height', value: number) => {
    const meters = unit === 'meters' ? value : value / FEET_PER_METER;
    if (dim === 'width') setRoomDimensions(meters, height);
    else setRoomDimensions(width, meters);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
      {/* Room Dimensions */}
      <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dimensions</h3>
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setUnit('meters')}
              className={clsx(
                "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                unit === 'meters' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
              )}
            >
              M
            </button>
            <button
              onClick={() => setUnit('feet')}
              className={clsx(
                "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                unit === 'feet' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
              )}
            >
              FT
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">WIDTH</label>
            <input
              type="number"
              value={Number(displayWidth.toFixed(1))}
              onChange={(e) => handleDimensionChange('width', Number(e.target.value))}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">HEIGHT</label>
            <input
              type="number"
              value={Number(displayHeight.toFixed(1))}
              onChange={(e) => handleDimensionChange('height', Number(e.target.value))}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Furniture Library */}
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Library</h3>
        <div className="grid grid-cols-2 gap-3">
          <FurnitureButton onClick={() => addFurniture('table-single', 1, 1)} label="Single Desk" />
          <FurnitureButton onClick={() => addFurniture('table-double', 1, 1)} label="Double Desk" />
          <FurnitureButton onClick={() => addFurniture('teacher-desk', 1, 1)} label="Teacher's Desk" />
          <FurnitureButton onClick={() => addFurniture('whiteboard', 2, 0.1)} label="Whiteboard" />
          <FurnitureButton onClick={() => addFurniture('door', 0.1, 2)} label="Door" />
          <FurnitureButton onClick={() => addFurniture('window', 4, 0.1)} label="Window" />
        </div>
      </section>
    </div>
  );
}

function FurnitureButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all group"
    >
      <div className="w-10 h-6 bg-slate-100 rounded border border-slate-300 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors" />
      <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">{label}</span>
    </button>
  );
}

function OptimizePanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
        <Settings className="text-blue-500" size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">Auto-Arrange</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-8">
        Use our smart algorithm to automatically seat students based on their preferences and constraints.
      </p>
      <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all transform active:scale-95">
        Start Auto-Fill
      </button>
    </div>
  );
}