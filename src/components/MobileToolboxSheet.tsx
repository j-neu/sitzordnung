import { useState } from 'react';
import { Armchair, Users, Link, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../locales';
import { NavButton, FurniturePanel, StudentsPanel, RelationsPanel, OptimizePanel, type Tab } from './Sidebar';

export default function MobileToolboxSheet() {
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const pendingAssignment = useStore(state => state.pendingAssignment);
  const language = useStore(state => state.language);
  const t = TRANSLATIONS[language];

  // Force the sheet collapsed while a student is armed for placement, so the
  // canvas (and its seats) is visible to tap. Derived rather than synced via
  // an effect, so it can't cause a cascading render.
  const displayedTab = pendingAssignment ? null : activeTab;

  const selectTab = (tab: Tab) => {
    setActiveTab(current => (current === tab ? null : tab));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
      {displayedTab && (
        <div className="max-h-[45vh] overflow-y-auto border-b border-gray-100">
          {displayedTab === 'furniture' && <FurniturePanel />}
          {displayedTab === 'students' && <StudentsPanel />}
          {displayedTab === 'relations' && <RelationsPanel />}
          {displayedTab === 'optimize' && <OptimizePanel />}
        </div>
      )}

      <div className="flex p-1.5 gap-1">
        <NavButton
          active={displayedTab === 'furniture'}
          onClick={() => selectTab('furniture')}
          label={t.tabs.furniture}
          icon={<Armchair size={16} />}
        />
        <NavButton
          active={displayedTab === 'students'}
          onClick={() => selectTab('students')}
          label={t.tabs.students}
          icon={<Users size={16} />}
        />
        <NavButton
          active={displayedTab === 'relations'}
          onClick={() => selectTab('relations')}
          label={t.tabs.relations}
          icon={<Link size={16} />}
        />
        <NavButton
          active={displayedTab === 'optimize'}
          onClick={() => selectTab('optimize')}
          label={t.tabs.optimize}
          icon={<Settings size={16} />}
        />
      </div>
    </div>
  );
}
