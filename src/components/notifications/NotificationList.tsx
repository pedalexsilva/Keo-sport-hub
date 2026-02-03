import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../types';
import { Bell, Calendar, Trophy, Info, Mail, CheckCheck, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationListProps {
    onClose: () => void;
}

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600) {
        const mins = Math.floor(diffInSeconds / 60);
        return `Há ${mins} min`;
    }
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Há ${hours}h`;
    }
    if (diffInSeconds < 172800) return 'Ontem';
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `Há ${days} dias`;
    }
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
};

export const NotificationList = ({ onClose }: NotificationListProps) => {
    const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    const handleClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead.mutate(notification.id);
        }

        // Navigation Logic based on type/metadata
        if (notification.type === 'event_invite' || notification.type === 'new_event') {
            if (notification.metadata?.event_id) {
                navigate('/app/events');
            } else {
                navigate('/app/events');
            }
        } else if (notification.type === 'challenge_alert') {
            navigate('/app/challenges');
        }

        onClose();
    };

    const getIconConfig = (type: string) => {
        switch (type) {
            case 'event_invite':
                return {
                    icon: Mail,
                    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
                    shadowColor: 'shadow-blue-500/30'
                };
            case 'event_update':
                return {
                    icon: Calendar,
                    bgColor: 'bg-gradient-to-br from-orange-500 to-amber-500',
                    shadowColor: 'shadow-orange-500/30'
                };
            case 'new_event':
                return {
                    icon: Calendar,
                    bgColor: 'bg-gradient-to-br from-emerald-500 to-green-500',
                    shadowColor: 'shadow-emerald-500/30'
                };
            case 'challenge_alert':
                return {
                    icon: Trophy,
                    bgColor: 'bg-gradient-to-br from-yellow-500 to-amber-500',
                    shadowColor: 'shadow-yellow-500/30'
                };
            case 'system':
                return {
                    icon: Info,
                    bgColor: 'bg-gradient-to-br from-gray-500 to-slate-500',
                    shadowColor: 'shadow-gray-500/30'
                };
            default:
                return {
                    icon: Bell,
                    bgColor: 'bg-gradient-to-br from-[#002D72] to-[#009CDE]',
                    shadowColor: 'shadow-blue-500/30'
                };
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center bg-white">
                <div className="w-8 h-8 border-3 border-[#009CDE] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-3 text-sm">A carregar notificações...</p>
            </div>
        );
    }

    if (!notifications || notifications.length === 0) {
        return (
            <div className="p-10 flex flex-col items-center justify-center bg-white">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Sem notificações</p>
                <p className="text-gray-400 text-sm mt-1">Está tudo em dia!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col max-h-[450px] bg-white">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#002D72] to-[#003d99] text-white">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Notificações</h3>
                            {unreadCount > 0 && (
                                <p className="text-xs text-blue-200">{unreadCount} por ler</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => onClose()}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Mark all as read button */}
            {unreadCount > 0 && (
                <button
                    onClick={() => markAllAsRead.mutate()}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 text-[#009CDE] hover:bg-blue-100 transition-colors text-sm font-medium border-b"
                >
                    <CheckCheck className="w-4 h-4" />
                    Marcar todas como lidas
                </button>
            )}

            {/* Notifications list */}
            <div className="overflow-y-auto flex-1 bg-white">
                {notifications.map((notification, index) => {
                    const iconConfig = getIconConfig(notification.type);
                    const IconComponent = iconConfig.icon;

                    return (
                        <div
                            key={notification.id}
                            onClick={() => handleClick(notification)}
                            className={`
                                group relative p-4 cursor-pointer transition-all duration-200
                                hover:bg-gray-50 border-b border-gray-100 last:border-b-0
                                ${!notification.read ? 'bg-gradient-to-r from-blue-50/80 to-transparent' : 'bg-white'}
                            `}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Unread indicator bar */}
                            {!notification.read && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#009CDE] to-[#002D72] rounded-r"></div>
                            )}

                            <div className="flex gap-3 pl-1">
                                {/* Icon with gradient background */}
                                <div className={`
                                    flex-shrink-0 w-10 h-10 rounded-xl ${iconConfig.bgColor} 
                                    flex items-center justify-center shadow-lg ${iconConfig.shadowColor}
                                    group-hover:scale-110 transition-transform duration-200
                                `}>
                                    <IconComponent className="w-5 h-5 text-white" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className={`text-sm leading-tight ${notification.read
                                            ? 'font-medium text-gray-700'
                                            : 'font-bold text-gray-900'
                                            }`}>
                                            {notification.title}
                                        </h4>
                                        {!notification.read && (
                                            <span className="flex-shrink-0 w-2.5 h-2.5 bg-[#009CDE] rounded-full animate-pulse shadow-lg shadow-blue-400/50"></span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-gray-400 font-medium">
                                            {formatRelativeTime(notification.created_at)}
                                        </span>
                                        {!notification.read && (
                                            <span className="text-[10px] px-2 py-0.5 bg-[#009CDE]/10 text-[#009CDE] rounded-full font-semibold uppercase tracking-wide">
                                                Nova
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer - View all link */}
            <div className="p-3 bg-gray-50 border-t">
                <button className="w-full py-2 text-center text-sm text-[#002D72] hover:text-[#009CDE] font-medium transition-colors flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Ver histórico completo
                </button>
            </div>
        </div>
    );
};
