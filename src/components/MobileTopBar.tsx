interface MobileTopBarProps {
  title: string;
  onSave: () => void;
}

export default function MobileTopBar({ title, onSave }: MobileTopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-20">
      <h1 className="text-base font-bold text-slate-900 truncate">{title}</h1>
      <button
        onClick={onSave}
        className="text-blue-600 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
      >
        Save
      </button>
    </div>
  );
}
