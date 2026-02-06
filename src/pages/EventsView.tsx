import React, { useState } from 'react';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Trophy,
    Users,
    CheckCircle2,
    Medal
} from 'lucide-react';
import { Event } from '../types';
import { formatDate } from '../utils/dateUtils';
import { EventStagesCarousel } from '../components/EventStagesCarousel';

interface EventsViewProps {
    events: Event[];
    onJoin: (eventId: string) => void;
    user: any;
}

// Add missing imports
import { useEventLeaderboard } from '../hooks/useEventLeaderboard';
import { useAuth } from '../features/auth/AuthContext';

const EventResultsSummary = ({ eventId }: { eventId: string }) => {
    const { data: leaderboard, isLoading } = useEventLeaderboard(eventId, 'gc');
    const { user } = useAuth();

    if (isLoading) return <div className="text-sm text-gray-500">Loading results...</div>;

    if (!leaderboard || leaderboard.length === 0) {
        return (
            <div>
                <h3 className="text-lg font-bold text-[#002D72] mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gray-400" /> Leaderboard
                </h3>
                <p className="text-gray-500 italic text-sm">Official results are not yet available.</p>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <h3 className="text-lg font-bold text-[#002D72] mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Official Leaderboard
            </h3>

            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                {leaderboard.slice(0, 3).map((result) => (
                    <div key={result.user_id} className={`flex items-center justify-between ${result.rank === 1 ? 'font-bold text-[#002D72]' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${result.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
                                {result.rank}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{result.user?.full_name || 'Athlete'}</span>
                                {result.user_id === user?.id && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">YOU</span>}
                            </div>
                        </div>
                        <span className="font-mono text-sm">
                            {result.rank === 1 ?
                                new Date(result.total_time_seconds * 1000).toISOString().substr(11, 8) :
                                `+ ${new Date(result.gap_seconds! * 1000).toISOString().substr(11, 8)}`
                            }
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-right">
                <a href="/leaderboard" className="text-sm font-bold text-[#009CDE] hover:underline">View full leaderboard →</a>
            </div>
        </div>
    );
};

// Helper to determine if an event is in the past
// Uses endDate if available, otherwise falls back to date
const isPastEvent = (date: string, endDate?: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventEndDate = new Date(endDate || date);
    eventEndDate.setHours(0, 0, 0, 0);
    return eventEndDate < today;
};

const EventsView: React.FC<EventsViewProps> = ({ events, onJoin, user }) => {
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    // Derive selectedEvent from props to ensure reactivity
    const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) || null : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Normalize event dates to midnight for comparison
    // Use endDate if available to determine if event is still ongoing
    const upcomingEvents = events.filter(e => {
        const eventEndDate = new Date(e.endDate || e.date);
        eventEndDate.setHours(0, 0, 0, 0);
        return eventEndDate >= today;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pastEvents = events.filter(e => {
        const eventEndDate = new Date(e.endDate || e.date);
        eventEndDate.setHours(0, 0, 0, 0);
        return eventEndDate < today;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const displayedEvents = tab === 'upcoming' ? upcomingEvents : pastEvents;

    if (selectedEvent) {
        const isPast = isPastEvent(selectedEvent.date, selectedEvent.endDate);
        const joined = selectedEvent.participants.some(p => p.id === user.id);

        return (
            <div className="bg-white min-h-full pb-24 animate-fade-in relative z-20">
                <div className="relative h-64">
                    <img src={selectedEvent.image} className="w-full h-full object-cover" alt="Event" />
                    <div className="absolute inset-0 bg-black/40"></div>
                    <button
                        onClick={() => setSelectedEventId(null)}
                        className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 cursor-pointer"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-6 left-6 text-white">
                        <span className="bg-[#009CDE] px-2 py-1 rounded text-xs font-bold mb-2 inline-block">{selectedEvent.type}</span>
                        <h2 className="text-3xl font-bold leading-tight">{selectedEvent.title}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-200">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(selectedEvent.date)}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedEvent.location}</span>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-6">
                    {isPast ? (
                        <div>
                            <EventResultsSummary eventId={selectedEvent.id} />
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {selectedEvent.description || "Join your colleagues for this KEO sports event. Strengthen team spirit and improve your health!"}
                            </p>

                            {/* Stages Carousel */}
                            <EventStagesCarousel eventId={selectedEvent.id} />

                            <h3 className="text-lg font-bold text-[#002D72] mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" /> Participants ({selectedEvent.participants.length})
                            </h3>

                            <div className="space-y-3 mb-8">
                                {selectedEvent.participants.map((participant, idx) => (
                                    <div key={idx} className="flex items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#002D72] font-bold mr-3 text-xs overflow-hidden">
                                            {participant.avatar ? (
                                                <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
                                            ) : (
                                                participant.name.slice(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{participant.name}</p>
                                            <p className="text-xs text-gray-500">{participant.office} • KEO Athlete</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="fixed bottom-24 left-6 right-6 md:absolute md:bottom-6 md:w-auto flex flex-col gap-3">
                                {joined ? (
                                    <>
                                        <button
                                            disabled
                                            className="w-full py-3 rounded-2xl text-lg font-bold bg-green-100 text-green-700 flex items-center justify-center gap-2 cursor-default border border-green-200"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            Registered
                                        </button>
                                        <button
                                            onClick={() => onJoin(selectedEvent.id)}
                                            className="w-full py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            Cancel Registration
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => onJoin(selectedEvent.id)}
                                        className="w-full py-4 rounded-2xl text-lg font-bold shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer bg-[#002D72] text-white hover:bg-[#002359]"
                                    >
                                        Register for Event
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 pb-24 pt-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-[#002D72] mb-4">KEO Events</h2>

            <div className="flex p-1 bg-gray-200 rounded-xl mb-6">
                <button
                    onClick={() => setTab('upcoming')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${tab === 'upcoming' ? 'bg-white text-[#002D72] shadow-sm' : 'text-gray-500'}`}
                >
                    Upcoming
                </button>
                <button
                    onClick={() => setTab('past')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${tab === 'past' ? 'bg-white text-[#002D72] shadow-sm' : 'text-gray-500'}`}
                >
                    Past
                </button>
            </div>

            <div className="space-y-6">
                {displayedEvents.map((event) => (
                    <div key={event.id} onClick={() => setSelectedEventId(event.id)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer active:scale-98 transition-transform">
                        <div className="relative h-32">
                            <img src={event.image || 'https://images.unsplash.com/photo-1552674605-5d28c4e1902c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-[#002D72] shadow-sm">{event.type}</div>
                            {tab === 'past' && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="border-2 border-white text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Completed</span>
                                </div>
                            )}
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">{event.title}</h3>
                                {tab === 'past' && <Trophy className="w-5 h-5 text-yellow-500" />}
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-gray-500 text-sm"><Calendar className="w-4 h-4 mr-2 text-[#009CDE]" />{formatDate(event.date)}</div>
                                <div className="flex items-center text-gray-500 text-sm"><MapPin className="w-4 h-4 mr-2 text-[#009CDE]" />{event.location}</div>
                            </div>

                            {tab === 'upcoming' && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                                    <div className="flex -space-x-2">
                                        {event.participants?.slice(0, 3).map((p, i) => (
                                            <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-800 overflow-hidden">
                                                {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : p.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        ))}
                                        {(event.participants?.length > 3) && (
                                            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                +{event.participants.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-[#009CDE]">View details →</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {displayedEvents.length === 0 && (
                    <div className="text-center p-8 text-gray-400 text-sm">No events to show.</div>
                )}
            </div>
        </div>
    );
};

export default EventsView;
