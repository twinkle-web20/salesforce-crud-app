import { useState, useRef, useEffect } from 'react';

const OBJECTS = [
  { name: 'Account',     icon: '🏢' },
  { name: 'Opportunity', icon: '💰' },
  { name: 'Lead',        icon: '🎯' },
  { name: 'Contact',     icon: '👤' },
  { name: 'Case',        icon: '📋' },
];

export default function ObjectDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = OBJECTS.find(o => o.name === value) || OBJECTS[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-red-400 hover:shadow-md transition-all min-w-[180px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
      >
        <span className="text-lg">{selected.icon}</span>
        <span className="flex-1 text-left">{selected.name}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="py-1">
            {OBJECTS.map((obj) => (
              <button
                key={obj.name}
                type="button"
                onClick={() => {
                  onChange(obj.name);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  value === obj.name
                    ? 'bg-red-50 text-red-700 font-semibold'
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <span className="text-lg">{obj.icon}</span>
                <span className="flex-1 text-left">{obj.name}</span>
                {value === obj.name && (
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}