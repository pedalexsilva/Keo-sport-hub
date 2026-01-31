import React from 'react';
import { Trophy, Bell, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  userPoints: number;
  userAvatar: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, userPoints, userAvatar }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden p-2 hover:bg-gray-100 rounded-md">
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-2 font-bold text-xl text-blue-700">
          <Trophy className="h-6 w-6" />
          <span>Keo Sports</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
          <span className="text-yellow-600 font-bold">★ {userPoints} pts</span>
        </div>
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden">
          <img
            src={userAvatar || `https://ui-avatars.com/api/?name=User&background=random`}
            alt="User"
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = 'https://ui-avatars.com/api/?name=User&background=random';
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
