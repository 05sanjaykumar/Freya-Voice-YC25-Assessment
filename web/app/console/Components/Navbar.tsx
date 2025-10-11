// web/app/console/Components/Navbar.tsx
import { Bot, LogOut } from 'lucide-react';

interface NavbarProps {
  onLogout: () => void;
}

export default function Navbar({ onLogout }: NavbarProps) {
  return (
    <nav className="bg-white border-b shadow-sm px-8 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Bot className="w-6 h-6 text-blue-600" />
        <span className="font-semibold text-lg tracking-tight">Agent Console</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Connected</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}
