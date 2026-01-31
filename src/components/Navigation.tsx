import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home,
    Calendar,
    ShoppingBag,
    Users,
    User
} from 'lucide-react';

const Navigation: React.FC = () => {
    const tabs = [
        { id: 'home', icon: Home, label: 'Início', path: '/app/home' },
        { id: 'events', icon: Calendar, label: 'Eventos', path: '/app/events' },
        { id: 'store', icon: ShoppingBag, label: 'Loja', path: '/app/store' },
        { id: 'social', icon: Users, label: 'Social', path: '/app/social' },
        { id: 'profile', icon: User, label: 'Perfil', path: '/app/profile' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-between items-center z-50 md:max-w-md md:mx-auto md:rounded-b-3xl">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                    <NavLink
                        key={tab.id}
                        to={tab.path}
                        className={({ isActive }) => `flex flex-col items-center space-y-1 transition-colors duration-200 w-1/5 ${isActive ? 'text-[#002D72]' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{tab.label}</span>
                            </>
                        )}
                    </NavLink>
                );
            })}
        </div>
    );
};

export default Navigation;
