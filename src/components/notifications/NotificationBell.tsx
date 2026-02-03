import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationList } from './NotificationList';

interface NotificationBellProps {
    className?: string;
    iconClassName?: string;
}

export const NotificationBell = ({ className, iconClassName }: NotificationBellProps) => {
    const { unreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, right: 0 });

    // Calculate position when opening
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node) &&
                panelRef.current &&
                !panelRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);

    // Update position on scroll/resize
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + 8,
                    right: window.innerWidth - rect.right,
                });
            }
        };

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const notificationPanel = isOpen ? createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-[9998]"
                onClick={() => setIsOpen(false)}
                style={{ backdropFilter: 'blur(2px)' }}
            />

            {/* Notification panel */}
            <div
                ref={panelRef}
                className="fixed w-[90vw] sm:w-[380px] max-w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden animate-dropdown-in"
                style={{
                    top: position.top,
                    right: Math.max(16, position.right),
                    backgroundColor: '#ffffff',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                }}
            >
                <NotificationList onClose={() => setIsOpen(false)} />
            </div>
        </>,
        document.body
    ) : null;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={className || `
                    relative p-2.5 rounded-full transition-all duration-300
                    text-white/80 hover:text-white hover:bg-white/10
                    ${isOpen ? 'bg-white/20 text-white' : ''}
                    ${unreadCount > 0 ? 'animate-subtle-bounce' : ''}
                `}
                aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
            >
                <Bell className={iconClassName || "w-6 h-6"} />

                {/* Badge for unread count */}
                {unreadCount > 0 && (
                    <span className="
                        absolute -top-0.5 -right-0.5 
                        min-w-[20px] h-5 px-1.5
                        bg-gradient-to-br from-red-500 to-rose-600 
                        text-white text-[11px] font-bold 
                        flex items-center justify-center 
                        rounded-full 
                        border-2 border-[#002D72]
                        shadow-lg shadow-red-500/40
                        animate-badge-pop
                    ">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}

                {/* Ping animation for new notifications */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-400 animate-ping opacity-75"></span>
                )}
            </button>

            {notificationPanel}

            {/* CSS for custom animations */}
            <style>{`
                @keyframes dropdown-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                
                @keyframes badge-pop {
                    0% {
                        transform: scale(0);
                    }
                    50% {
                        transform: scale(1.2);
                    }
                    100% {
                        transform: scale(1);
                    }
                }

                @keyframes subtle-bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-2px);
                    }
                }
                
                .animate-dropdown-in {
                    animation: dropdown-in 0.2s ease-out forwards;
                }
                
                .animate-badge-pop {
                    animation: badge-pop 0.3s ease-out forwards;
                }

                .animate-subtle-bounce {
                    animation: subtle-bounce 2s ease-in-out infinite;
                }
            `}</style>
        </>
    );
};
