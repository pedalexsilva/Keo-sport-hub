import React from 'react';
import { MapPin, Bell, Zap } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: {
    name: string;
    location?: string;
  };
  points: number;
}

const Header: React.FC<HeaderProps> = ({ user, points }) => (
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

    <div key={points} className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#009CDE] to-blue-400 flex items-center justify-center shadow-lg">
          <Zap className="w-5 h-5 text-white fill-white" />
        </div>
        <div>
          <p className="text-xs text-blue-100">Saldo Atual</p>
          <p className="font-bold text-white text-lg">{points.toLocaleString()} <span className="text-xs font-normal">pts</span></p>
        </div>
      </div>
      <div className="text-right">
        <button className="bg-white text-[#002D72] px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-50 transition cursor-pointer">
          + Ganhar
        </button>
      </div>
    </div>
  </div>
);

export default Header;
