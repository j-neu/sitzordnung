import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  options: {
    label: string;
    action: () => void;
    danger?: boolean;
  }[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, options, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // Use capture to handle the click that might have triggered a close elsewhere
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-lg py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
      style={{ top: y, left: x }}
    >
      {options.map((option, index) => (
        <button
          key={index}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
            option.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
          }`}
          onClick={() => {
            option.action();
            onClose();
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
