import { useState } from 'react';
import { X, Heart, Ban, Trash2, User, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Student, ZonePreference } from '../types';
import clsx from 'clsx';

interface StudentEditModalProps {
  student: Student;
  onClose: () => void;
}

export default function StudentEditModal({ student, onClose }: StudentEditModalProps) {
  const { students, updateStudent, relationships, addRelationship, removeRelationship } = useStore();
  
  const [name, setName] = useState(student.name);
  const [zone, setZone] = useState<ZonePreference>(student.zonePreference);
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [relType, setRelType] = useState<'green' | 'red'>('green');

  // Filter relationships involving this student
  const myRelationships = relationships.filter(
    r => r.studentAId === student.id || r.studentBId === student.id
  );

  const handleSave = () => {
    updateStudent(student.id, { name, zonePreference: zone });
    onClose();
  };

  const handleAddRelationship = () => {
    if (targetStudentId && targetStudentId !== student.id) {
      // Check if already exists
      const exists = relationships.some(
        r => (r.studentAId === student.id && r.studentBId === targetStudentId) ||
             (r.studentAId === targetStudentId && r.studentBId === student.id)
      );
      
      if (!exists) {
        addRelationship(student.id, targetStudentId, relType);
        setTargetStudentId('');
      }
    }
  };

  const otherStudents = students.filter(s => s.id !== student.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User className="text-blue-500" size={20} />
            Edit Student
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Zone Preference */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seating Preference</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['front', 'back', null] as const).map((z) => (
                <button
                  key={String(z)}
                  onClick={() => setZone(z)}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize",
                    zone === z ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {z === null ? 'No Preference' : `${z} Row`}
                </button>
              ))}
            </div>
          </div>

          {/* Relationships */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Relationships</label>
            
            {/* Add New */}
            <div className="flex gap-2 mb-3">
              <select
                value={targetStudentId}
                onChange={(e) => setTargetStudentId(e.target.value)}
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">Select student...</option>
                {otherStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button 
                   onClick={() => setRelType('green')}
                   className={clsx(
                     "p-2 rounded-lg transition-all",
                     relType === 'green' ? "bg-white text-green-500 shadow-sm" : "text-slate-400 hover:text-green-500"
                   )}
                 >
                   <Heart size={16} fill={relType === 'green' ? "currentColor" : "none"} />
                 </button>
                 <button 
                   onClick={() => setRelType('red')}
                   className={clsx(
                     "p-2 rounded-lg transition-all",
                     relType === 'red' ? "bg-white text-red-500 shadow-sm" : "text-slate-400 hover:text-red-500"
                   )}
                 >
                   <Ban size={16} />
                 </button>
              </div>

              <button 
                onClick={handleAddRelationship}
                disabled={!targetStudentId}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* List */}
            <div className="space-y-2">
              {myRelationships.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-2">No relationships set.</p>
              )}
              {myRelationships.map(r => {
                const otherId = r.studentAId === student.id ? r.studentBId : r.studentAId;
                const other = students.find(s => s.id === otherId);
                if (!other) return null;
                
                return (
                  <div key={r.id} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      {r.type === 'green' ? (
                        <Heart size={14} className="text-green-500" fill="currentColor" />
                      ) : (
                        <Ban size={14} className="text-red-500" />
                      )}
                      <span className="text-sm font-semibold text-slate-700">{other.name}</span>
                    </div>
                    <button 
                      onClick={() => removeRelationship(r.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
