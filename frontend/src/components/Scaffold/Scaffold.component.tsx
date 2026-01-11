import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

import type { ScaffoldType } from './Scaffold.type';

export const Scaffold = ({ children, title }: ScaffoldType) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-zinc-100 min-h-dvh">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b px-4 py-3 flex items-center">
        <button
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 ml-2">{title}</h1>
      </div>
      {children}
    </div>
  );
};
