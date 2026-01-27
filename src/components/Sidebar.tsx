import { Users, Armchair, Settings, Plus, Search, GripVertical, User, Trash2, Edit, Download, Upload, Shuffle, Heart, Ban, Link, Image as ImageIcon, Layout } from 'lucide-react';
import { useStore } from '../store/useStore';
import clsx from 'clsx';
import StudentEditModal from './StudentEditModal';
import type { Student } from '../types';
import { useRef, useState } from 'react';
import { TRANSLATIONS } from '../locales';
import { generateLayout, LAYOUT_TEMPLATES, type LayoutType } from '../utils/layouts';

type Tab = 'furniture' | 'students' | 'optimize' | 'relations';

interface SidebarProps {
  onExportImage: () => void;
}

export default function Sidebar({ onExportImage }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('furniture');
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const width = useStore(state => state.width);
  const height = useStore(state => state.height);
  const unit = useStore(state => state.unit);
  const furniture = useStore(state => state.furniture);
  const students = useStore(state => state.students);
  const relationships = useStore(state => state.relationships);
  const assignments = useStore(state => state.assignments);
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);
  
  const t = TRANSLATIONS[language];

  const loadState = useStore(state => state.loadState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const performSave = (type: 'full' | 'furniture') => {
    const data = {
      width,
      height,
      unit,
      furniture,
      students: type === 'full' ? students : [],
      relationships: type === 'full' ? relationships : [],
      assignments: type === 'full' ? assignments : {}
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'full' ? 'classroom-layout.json' : 'furniture-template.json';
    a.click();
    URL.revokeObjectURL(url);
    setShowSaveModal(false);
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        loadState(json);
      } catch (err) {
        console.error('Failed to load file', err);
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };
  
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-sm z-10 w-[480px] relative transition-[width] duration-300">
      {/* Save Modal */}
      {showSaveModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs border border-gray-100 ring-1 ring-black/5 animate-in zoom-in-95">
                 <h3 className="text-lg font-bold text-slate-800 mb-2">{t.saveModal.title}</h3>
                 <p className="text-sm text-slate-500 mb-6">{t.saveModal.description}</p>
                 
                 <div className="space-y-3">
                     <button 
                        onClick={() => performSave('full')}
                        className="w-full flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group text-left shadow-sm"
                     >
                        <div className="p-2 bg-white rounded-lg border border-slate-100 text-blue-600 group-hover:scale-110 transition-transform">
                            <Users size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-700 text-sm">{t.saveModal.fullLayout}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">{t.saveModal.fullLayoutDesc}</div>
                        </div>
                     </button>

                     <button 
                        onClick={() => performSave('furniture')}
                        className="w-full flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all group text-left shadow-sm"
                     >
                        <div className="p-2 bg-white rounded-lg border border-slate-100 text-orange-500 group-hover:scale-110 transition-transform">
                            <Armchair size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-700 text-sm">{t.saveModal.furnitureOnly}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">{t.saveModal.furnitureOnlyDesc}</div>
                        </div>
                     </button>
                 </div>

                 <button 
                    onClick={() => setShowSaveModal(false)}
                    className="w-full mt-6 py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
                 >
                    {t.saveModal.cancel}
                 </button>
             </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleLoad} 
        accept=".json" 
        className="hidden" 
      />

      {/* Header / Tabs */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.appTitle}</h1>
                {/* Language Toggle */}
                <div className="flex gap-2 mt-1">
                    <button 
                        onClick={() => setLanguage('de')} 
                        className={clsx("text-[10px] font-bold transition-colors", language === 'de' ? "text-blue-600" : "text-slate-400 hover:text-slate-600")}
                    >
                        DE
                    </button>
                    <span className="text-[10px] text-slate-300">|</span>
                    <button 
                        onClick={() => setLanguage('en')} 
                        className={clsx("text-[10px] font-bold transition-colors", language === 'en' ? "text-blue-600" : "text-slate-400 hover:text-slate-600")}
                    >
                        EN
                    </button>
                </div>
            </div>
            <div className="flex gap-1">
                <button 
                    onClick={onExportImage}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={t.exportImage}
                >
                    <ImageIcon size={18} />
                </button>
                <button 
                    onClick={() => setShowSaveModal(true)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={t.saveLayout}
                >
                    <Download size={18} />
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={t.loadLayout}
                >
                    <Upload size={18} />
                </button>
            </div>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-xl mb-2">
          <NavButton 
            active={activeTab === 'furniture'} 
            onClick={() => setActiveTab('furniture')} 
            label={t.tabs.furniture} 
            icon={<Armchair size={16} />}
          />
          <NavButton 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')} 
            label={t.tabs.students}
            icon={<Users size={16} />}
          />
          <NavButton 
            active={activeTab === 'relations'} 
            onClick={() => setActiveTab('relations')} 
            label={t.tabs.relations} 
            icon={<Link size={16} />}
          />
          <NavButton 
            active={activeTab === 'optimize'} 
            onClick={() => setActiveTab('optimize')} 
            label={t.tabs.optimize} 
            icon={<Settings size={16} />}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'furniture' && <FurniturePanel />}
        {activeTab === 'students' && <StudentsPanel />}
        {activeTab === 'relations' && <RelationsPanel />}
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

function RelationsPanel() {
    const students = useStore(state => state.students);
    const relationships = useStore(state => state.relationships);
    const addRelationship = useStore(state => state.addRelationship);
    const removeRelationship = useStore(state => state.removeRelationship);
    
    // Global interaction state
    const interactionMode = useStore(state => state.interactionMode);
    const setInteractionMode = useStore(state => state.setInteractionMode);
    const relationSelection = useStore(state => state.relationSelection);
    const handleRelationClick = useStore(state => state.handleRelationClick);
    const clearRelationSelection = useStore(state => state.clearRelationSelection);
    const language = useStore(state => state.language);
    
    const t = TRANSLATIONS[language];

    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Derived state for UI
    const selectedId = relationSelection?.type === 'single' ? relationSelection.id : null;
    const pendingPair = relationSelection?.type === 'pair' ? relationSelection : null;

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            
            {/* Toolbar */}
            <div className="bg-white p-4 border-b border-gray-100 shadow-sm z-10">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.relations.title}</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                        onClick={() => setInteractionMode('none')}
                        className={clsx(
                            "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                            interactionMode === 'none' ? "bg-slate-800 text-white shadow-md" : "bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        <Search size={16} /> {t.relations.view}
                    </button>
                    <button
                        onClick={() => setInteractionMode('define')}
                        className={clsx(
                            "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                            interactionMode === 'define' ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-100" : "bg-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        )}
                    >
                        <Link size={16} /> {t.relations.define}
                    </button>
                    <button
                        onClick={() => setInteractionMode('green')}
                        className={clsx(
                            "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                            interactionMode === 'green' ? "bg-green-500 text-white shadow-md ring-2 ring-green-100" : "bg-slate-100 text-slate-400 hover:text-green-600 hover:bg-green-50"
                        )}
                    >
                        <Heart size={16} fill="currentColor" /> {t.relations.like}
                    </button>
                    <button
                        onClick={() => setInteractionMode('red')}
                        className={clsx(
                            "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                            interactionMode === 'red' ? "bg-red-500 text-white shadow-md ring-2 ring-red-100" : "bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        )}
                    >
                        <Ban size={16} /> {t.relations.dislike}
                    </button>
                </div>
                
                {/* Search */}
                <div className="mt-4 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t.relations.searchPlaceholder}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>

                {/* Instruction Text */}
                <div className="mt-3 text-[10px] text-slate-400 text-center font-medium h-4">
                    {interactionMode === 'none' && t.relations.instructions.none}
                    {interactionMode !== 'none' && !selectedId && t.relations.instructions.selectFirst}
                    {interactionMode !== 'none' && selectedId && t.relations.instructions.selectSecond}
                </div>
            </div>

            {/* Students Grid */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-2">
                    {filteredStudents.map(student => {
                        const isSelected = selectedId === student.id;
                        // Count relationships
                        const rels = relationships.filter(r => r.studentAId === student.id || r.studentBId === student.id);
                        const green = rels.filter(r => r.type === 'green').length;
                        const red = rels.filter(r => r.type === 'red').length;

                        let borderClass = "border-gray-100 hover:border-blue-300 hover:shadow-md";
                        if (isSelected) {
                            if (interactionMode === 'green') borderClass = "border-green-500 ring-1 ring-green-500 bg-green-50";
                            else if (interactionMode === 'red') borderClass = "border-red-500 ring-1 ring-red-500 bg-red-50";
                            else borderClass = "border-blue-500 ring-1 ring-blue-500 bg-blue-50";
                        }

                        return (
                            <button
                                key={student.id}
                                onClick={() => handleRelationClick(student.id)}
                                disabled={interactionMode === 'none'}
                                className={clsx(
                                    "p-3 rounded-xl border text-left transition-all relative overflow-hidden group bg-white",
                                    borderClass,
                                    interactionMode === 'none' && "opacity-60 cursor-default hover:border-gray-100 hover:shadow-none"
                                )}
                            >
                                <div className="text-sm font-bold text-slate-700 truncate">{student.name}</div>
                                {(green > 0 || red > 0) && (
                                    <div className="flex gap-1 mt-1">
                                        {green > 0 && <div className="flex items-center text-[10px] text-green-500 font-bold bg-green-50 px-1 rounded"><Heart size={8} fill="currentColor" className="mr-0.5"/> {green}</div>}
                                        {red > 0 && <div className="flex items-center text-[10px] text-red-500 font-bold bg-red-50 px-1 rounded"><Ban size={8} className="mr-0.5"/> {red}</div>}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                
                {/* Existing Relationships List (Mini) */}
                {relationships.length > 0 && (
                    <div className="mt-8 mb-20">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.relations.existingLinks}</h3>
                        <div className="space-y-2">
                            {relationships.map(r => {
                                const sA = students.find(s => s.id === r.studentAId);
                                const sB = students.find(s => s.id === r.studentBId);
                                if (!sA || !sB) return null;
                                return (
                                    <div key={r.id} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg text-xs font-semibold text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate max-w-[80px]">{sA.name}</span>
                                            {r.type === 'green' ? <Heart size={12} className="text-green-500" fill="currentColor"/> : <Ban size={12} className="text-red-500"/>}
                                            <span className="truncate max-w-[80px]">{sB.name}</span>
                                        </div>
                                        <button onClick={() => removeRelationship(r.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Popup for Define Tool */}
            {pendingPair && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                     <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-xs border border-gray-100 ring-1 ring-black/5 animate-in zoom-in-95">
                         <h4 className="text-center font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">{t.relations.popup.title}</h4>
                         <div className="flex gap-3">
                             <button 
                                onClick={() => {
                                    addRelationship(pendingPair.a, pendingPair.b, 'green');
                                    clearRelationSelection();
                                }}
                                className="flex-1 flex flex-col items-center gap-2 p-4 bg-green-50 text-green-600 rounded-xl font-bold hover:bg-green-100 hover:scale-105 transition-all shadow-sm border border-green-100"
                             >
                                <Heart size={28} fill="currentColor" />
                                <span className="text-xs">{t.relations.popup.workWell}</span>
                             </button>
                             <button 
                                onClick={() => {
                                    addRelationship(pendingPair.a, pendingPair.b, 'red');
                                    clearRelationSelection();
                                }}
                                className="flex-1 flex flex-col items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 hover:scale-105 transition-all shadow-sm border border-red-100"
                             >
                                <Ban size={28} />
                                <span className="text-xs">{t.relations.popup.keepApart}</span>
                             </button>
                         </div>
                         <button 
                            onClick={() => clearRelationSelection()}
                            className="w-full mt-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg"
                         >
                            {t.relations.popup.cancel}
                         </button>
                     </div>
                </div>
            )}
        </div>
    );
}

function StudentsPanel() {
  const students = useStore(state => state.students);
  const assignments = useStore(state => state.assignments);
  const addStudent = useStore(state => state.addStudent);
  const importStudents = useStore(state => state.importStudents);
  const removeStudent = useStore(state => state.removeStudent);
  const relationships = useStore(state => state.relationships);
  const randomFill = useStore(state => state.randomFill);
  const language = useStore(state => state.language);
  
  const t = TRANSLATIONS[language];
  
  const [newName, setNewName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Count unassigned
  const unassignedStudents = students.filter(s => !Object.values(assignments).includes(s.id));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addStudent(newName.trim());
      setNewName('');
    }
  };

  const handleImport = () => {
    if (importText.trim()) {
      const names = importText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
      if (names.length > 0) {
        importStudents(names);
        setImportText('');
        setIsImporting(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {editingStudent && (
        <StudentEditModal 
          student={editingStudent} 
          onClose={() => setEditingStudent(null)} 
        />
      )}

      {/* Search & Add */}
      <div className="p-4 bg-white border-b border-gray-100 space-y-3">
        {!isImporting ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder={t.students.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t.students.addPlaceholder}
                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
              />
              <button type="submit" className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                <Plus size={20} />
              </button>
            </form>
            <div className="flex gap-2">
                <button 
                  onClick={() => setIsImporting(true)}
                  className="flex-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                >
                  {t.students.importButton}
                </button>
                <button 
                  onClick={randomFill}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-100 py-2 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  title="Assign random seats to unseated students"
                >
                  <Shuffle size={14} /> {t.students.randomFill}
                </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-bold text-slate-700">{t.students.importTitle}</h3>
               <button onClick={() => setIsImporting(false)} className="text-xs text-slate-400 hover:text-slate-600">{t.students.cancel}</button>
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={t.students.importPlaceholder}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 min-h-[100px]"
            />
            <button 
              onClick={handleImport}
              className="w-full py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            >
              {t.students.importAction}
            </button>
          </div>
        )}
      </div>

      {/* List Header */}
      <div className="px-5 py-3 flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.students.unassignedTitle}</h3>
        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {unassignedStudents.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
        {unassignedStudents.map(student => {
          const studentRels = relationships.filter(r => r.studentAId === student.id || r.studentBId === student.id);
          const greenCount = studentRels.filter(r => r.type === 'green').length;
          const redCount = studentRels.filter(r => r.type === 'red').length;

          return (
            <div key={student.id} className="group flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold border border-orange-200">
                {student.name.substring(0, 2).toUpperCase()}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 truncate">{student.name}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-medium text-slate-400 truncate">
                    {student.zonePreference ? `${student.zonePreference === 'front' ? 'Front' : 'Back'} ${t.students.zoneRow}` : t.students.noPreference}
                  </p>
                  {(greenCount > 0 || redCount > 0) && (
                    <div className="flex gap-1 ml-auto mr-1">
                      {greenCount > 0 && (
                        <span className="flex items-center text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-full">
                          <Heart size={10} className="mr-0.5" fill="currentColor" /> {greenCount}
                        </span>
                      )}
                      {redCount > 0 && (
                        <span className="flex items-center text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                          <Ban size={10} className="mr-0.5" /> {redCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 text-gray-300">
                <button 
                    onClick={() => setEditingStudent(student)}
                    className="p-1.5 hover:bg-blue-50 hover:text-blue-500 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                </button>
                <button 
                    onClick={() => removeStudent(student.id)}
                    className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                </button>
                <div 
                    className="p-1.5 cursor-grab hover:text-slate-400"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('studentId', student.id);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                >
                  <GripVertical size={16} />
                </div>
              </div>
            </div>
          );
        })}

        {unassignedStudents.length === 0 && (
          <div className="text-center py-12 opacity-50">
            <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">{t.students.allAssigned}</p>
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
  const applyLayout = useStore(state => state.applyLayout);
  const language = useStore(state => state.language);
  
  const t = TRANSLATIONS[language];

  // Constants for conversion
  const FEET_PER_METER = 3.28084;
  const displayWidth = unit === 'meters' ? width : width * FEET_PER_METER;
  const displayHeight = unit === 'meters' ? height : height * FEET_PER_METER;

  const handleDimensionChange = (dim: 'width' | 'height', value: number) => {
    const meters = unit === 'meters' ? value : value / FEET_PER_METER;
    if (dim === 'width') setRoomDimensions(meters, height);
    else setRoomDimensions(width, meters);
  };

  const handleApplyLayout = (type: LayoutType) => {
      if (confirm('This will clear all current furniture. Continue?')) {
          const newFurniture = generateLayout(type, width, height);
          applyLayout(newFurniture);
      }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
      {/* Room Dimensions */}
      <section className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.furniture.dimensions}</h3>
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
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">{t.furniture.width}</label>
            <input
              type="number"
              value={Number(displayWidth.toFixed(1))}
              onChange={(e) => handleDimensionChange('width', Number(e.target.value))}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5">{t.furniture.height}</label>
            <input
              type="number"
              value={Number(displayHeight.toFixed(1))}
              onChange={(e) => handleDimensionChange('height', Number(e.target.value))}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Quick Layouts */}
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">{t.furniture.layouts}</h3>
        <div className="grid grid-cols-2 gap-3 mb-8">
            {LAYOUT_TEMPLATES.map(type => (
                <button 
                    key={type}
                    onClick={() => handleApplyLayout(type)}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                    <Layout size={20} className="text-slate-400 group-hover:text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-600 text-center">{t.furniture.layoutItems[type]}</span>
                </button>
            ))}
        </div>
      </section>

      {/* Furniture Library */}
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">{t.furniture.library}</h3>
        <div className="grid grid-cols-2 gap-3">
          <FurnitureButton onClick={() => addFurniture('table-single', 1, 1)} label={t.furniture.items['table-single']} />
          <FurnitureButton onClick={() => addFurniture('table-double', 1, 1)} label={t.furniture.items['table-double']} />
          <FurnitureButton onClick={() => addFurniture('teacher-desk', 1, 1)} label={t.furniture.items['teacher-desk']} />
          <FurnitureButton onClick={() => addFurniture('whiteboard', 2, 0.1)} label={t.furniture.items['whiteboard']} />
          <FurnitureButton onClick={() => addFurniture('door', 0.1, 2)} label={t.furniture.items['door']} />
          <FurnitureButton onClick={() => addFurniture('window', 4, 0.1)} label={t.furniture.items['window']} />
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
  const randomFill = useStore(state => state.randomFill);
  const startOptimization = useStore(state => state.startOptimization);
  const stopOptimization = useStore(state => state.stopOptimization);
  const isOptimizing = useStore(state => state.isOptimizing);
  const stats = useStore(state => state.optimizationStats);
  const report = useStore(state => state.optimizationReport);
  const clearReport = useStore(state => state.clearOptimizationReport);
  const language = useStore(state => state.language);
  
  const t = TRANSLATIONS[language];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
      <div className={clsx(
          "w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100 transition-all",
          isOptimizing && "animate-pulse ring-4 ring-blue-100"
      )}>
        <Settings className={clsx("text-blue-500", isOptimizing && "animate-spin")} size={32} />
      </div>
      
      <h3 className="text-lg font-bold text-slate-800 mb-2">
          {isOptimizing ? t.optimize.optimizing : (report ? t.optimize.complete : t.optimize.title)}
      </h3>
      
      {!report && (
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
            {isOptimizing 
                ? t.optimize.descriptionOptimizing
                : t.optimize.description}
        </p>
      )}

      {/* Progress Stats */}
      {isOptimizing && stats && (
          <div className="w-full mb-6 bg-white p-4 rounded-xl border border-blue-100 shadow-sm text-left">
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                  <span>{t.optimize.stats.iteration}</span>
                  <span>{stats.iteration.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>{t.optimize.stats.cost}</span>
                  <span className="text-blue-600">{stats.cost.toFixed(1)}</span>
              </div>
          </div>
      )}

      {/* Final Report */}
      {!isOptimizing && report && (
           <div className="w-full mb-6 bg-white p-5 rounded-2xl border border-green-100 shadow-sm text-left animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t.optimize.stats.moved}</div>
                      <div className="text-xl font-bold text-slate-800">{report.movedCount}</div>
                  </div>
                  <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t.optimize.stats.iterations}</div>
                      <div className="text-xl font-bold text-slate-800">{report.iterations.toLocaleString()}</div>
                  </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-end mb-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{t.optimize.stats.reduction}</div>
                      <div className="text-green-600 font-bold text-sm">
                          {((report.initialCost - report.finalCost)).toFixed(1)}
                      </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-medium text-slate-400">
                      <span>{report.initialCost.toFixed(1)}</span>
                      <span>{report.finalCost.toFixed(1)}</span>
                  </div>
              </div>
           </div>
      )}
      
      <div className="w-full space-y-3">
        {!isOptimizing && (
            <>
                <button 
                    onClick={() => {
                        if (report) clearReport();
                        startOptimization();
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all transform active:scale-95"
                >
                    {report ? t.optimize.runAgain : t.optimize.start}
                </button>
                
                {!report && (
                    <button 
                        onClick={randomFill}
                        className="w-full py-3 bg-white border border-gray-200 text-slate-700 font-bold rounded-xl shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                        <Shuffle size={18} />
                        {t.students.randomFill}
                    </button>
                )}
            </>
        )}
        
        {isOptimizing && (
            <button 
                onClick={stopOptimization}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all"
            >
                {t.optimize.stop}
            </button>
        )}
      </div>
    </div>
  );
}