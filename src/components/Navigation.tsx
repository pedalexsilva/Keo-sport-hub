import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home,
    Calendar,
    ShoppingBag,
    Users,
    User,
    Menu,
    Settings,
    Bell,
    MessageSquare,
    LifeBuoy
} from 'lucide-react';
import { useAppMenu } from '../hooks/useCMS';

const ICON_MAP: Record<string, any> = {
    Home,
    Calendar,
    ShoppingBag,
    Users,
    User,
    Menu,
    Settings,
    Bell,
    MessageSquare,
    LifeBuoy
};

const Navigation: React.FC = () => {
    const { data: menuItems } = useAppMenu();

    // Default fallback while loading or if empty
    const tabs = menuItems || [
        { id: 'home', label: 'Início', path: '/app/home', icon: 'Home' },
        { id: 'events', label: 'Eventos', path: '/app/events', icon: 'Calendar' },
        { id: 'store', label: 'Loja', path: '/app/store', icon: 'ShoppingBag' },
        { id: 'social', label: 'Social', path: '/app/social', icon: 'Users' },
        { id: 'profile', label: 'Perfil', path: '/app/profile', icon: 'User' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-between items-center z-50 md:max-w-md md:mx-auto md:rounded-b-3xl">
            {tabs.map((tab) => {
                const Icon = ICON_MAP[tab.icon] || Home; // Fallback icon
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
