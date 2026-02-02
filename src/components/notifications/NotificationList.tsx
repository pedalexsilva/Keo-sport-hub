import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../types';
import { Bell, Calendar, Trophy, Info, AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationListProps {
    onClose: () => void;
}

export const NotificationList = ({ onClose }: NotificationListProps) => {
    const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    const handleClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead.mutate(notification.id);
        }

        // Navigation Logic based on type/metadata
        if (notification.type === 'event_invite' || notification.type === 'new_event') {
            if (notification.metadata?.event_id) {
                navigate('/app/events'); // Ideally to specific event if possible
            } else {
                navigate('/app/events');
            }
        } else if (notification.type === 'challenge_alert') {
            navigate('/app/challenges');
        }

        onClose();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'event_invite': return <Mail className="w-5 h-5 text-blue-500" />;
            case 'event_update': return <Calendar className="w-5 h-5 text-orange-500" />;
            case 'new_event': return <Calendar className="w-5 h-5 text-green-500" />;
            case 'challenge_alert': return <Trophy className="w-5 h-5 text-yellow-500" />;
            case 'system': return <Info className="w-5 h-5 text-gray-500" />;
            default: return <Bell className="w-5 h-5 text-gray-400" />;
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center text-gray-400">A carregar...</div>;
    }

    if (!notifications || notifications.length === 0) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                <Bell className="w-8 h-8 mb-2 opacity-50" />
                <p>Sem notificações</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col max-h-[400px]">
            <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700">Notificações</h3>
                <button
                    onClick={() => markAllAsRead.mutate()}
                    className="text-xs text-[#009CDE] hover:underline font-medium"
                >
                    Marcar todas como lidas
                </button>
            </div>
            <div className="overflow-y-auto flex-1">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        onClick={() => handleClick(notification)}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition flex gap-3 ${notification.read ? 'bg-white' : 'bg-blue-50/50'}`}
                    >
                        <div className="mt-1 flex-shrink-0">
                            {getIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                            <h4 className={`text-sm ${notification.read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
                                {notification.title}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1 leading-snug">
                                {notification.message}
                            </p>
                            <span className="text-xs text-gray-400 mt-2 block">
                                {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
