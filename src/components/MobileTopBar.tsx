import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../locales';

interface MobileTopBarProps {
  onSave: () => void;
}

export default function MobileTopBar({ onSave }: MobileTopBarProps) {
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);
  const t = TRANSLATIONS[language];

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-20">
      <div className="flex flex-col min-w-0">
        <h1 className="text-base font-bold text-slate-900 truncate">{t.appTitle}</h1>
        <div className="flex gap-2 mt-0.5">
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
      <button
        onClick={onSave}
        className="text-blue-600 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
      >
        Save
      </button>
    </div>
  );
}
