import React from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, BarChart2, User, LogOut } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      closeSidebar();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
    { name: 'Eventos', path: '/app/events', icon: Calendar },
    { name: 'Leaderboard', path: '/app/leaderboard', icon: BarChart2 },
    { name: 'Perfil', path: '/app/profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-center border-b border-gray-100 px-6">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Menu Principal</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive(item.path)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-500" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
