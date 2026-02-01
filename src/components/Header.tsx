import React from 'react';
import { MapPin, Bell } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: {
    name: string;
    location?: string;
  };
}

const Header: React.FC<HeaderProps> = ({ user }) => (
  <div className="pt-12 pb-6 px-6 bg-[#002D72] text-white rounded-b-[2rem] shadow-lg relative overflow-hidden transition-all duration-300">
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#009CDE] rounded-full opacity-20 -mr-10 -mt-10 blur-xl"></div>
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 rounded-full opacity-20 -ml-10 -mb-10 blur-xl"></div>

    <div className="relative z-10 flex justify-between items-start mb-6">
      <div>
        <p className="text-blue-200 text-sm font-medium">Olá, {user.name}</p>
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-blue-300" />
          <span className="text-xs text-blue-300">{user.location || 'Porto Office'}</span>
        </div>
      </div>
      <div className="flex gap-3">
        <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-sm relative cursor-pointer">
          <Bell className="w-5 h-5 text-white" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#002D72]"></span>
        </button>
      </div>
    </div>
  </div>
);

export default Header;
