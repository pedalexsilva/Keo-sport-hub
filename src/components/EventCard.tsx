import React from 'react';
import { Event, User } from '../types';
import { Calendar, MapPin, Users, ChevronDown, ChevronUp, Trophy, ExternalLink } from 'lucide-react';
import Button from './Button';
import { formatDateTime } from '../utils/dateUtils';
import { EventStagesCarousel } from './EventStagesCarousel';

interface EventCardProps {
    evt: Event;
    user: User;
    isExpanded: boolean;
    toggleExpand: (id: string) => void;
    isPast: boolean;
    handleJoin: (eventId: string, currentParticipants: any[]) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ evt, user, isExpanded, toggleExpand, isPast, handleJoin }) => {
    const isParticipant = evt.participants.some(p => p.id === user.id);

    return (
        <div className={`group overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md ${isExpanded ? 'ring-2 ring-blue-100' : ''} ${isPast ? 'opacity-90' : ''}`}>
            <div
                className="relative h-48 w-full overflow-hidden cursor-pointer"
                onClick={() => toggleExpand(evt.id)}
            >
                <img src={evt.image} alt={evt.title} className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isPast ? 'grayscale-[50%]' : ''}`} />
                <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-800 backdrop-blur-sm shadow-sm">
                    {evt.type}
                </div>
                {isPast && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold border border-white/20 backdrop-blur-md">
                            Evento Terminado
                        </span>
                    </div>
                )}
            </div>

            <div className="p-5">
                <div className="mb-3 flex items-center text-sm text-gray-500">
                    <Calendar className="mr-1.5 h-4 w-4" />
                    {formatDateTime(evt.date)}
                </div>

                <h3
                    className="mb-2 text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => toggleExpand(evt.id)}
                >
                    {evt.title}
                </h3>

                <p className={`mb-4 text-sm text-gray-600 transition-all ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {evt.description}
                </p>

                {!isExpanded && (
                    <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                            <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                            <span className="truncate max-w-[150px]">{evt.location}</span>
                        </div>
                        <div className="flex items-center">
                            <Users className="mr-1.5 h-4 w-4 text-gray-400" />
                            {evt.participants.length}
                        </div>
                    </div>
                )}

                {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            {evt.location}
                        </div>

                        {/* Stage Carousel Integration */}
                        <EventStagesCarousel eventId={evt.id} />

                        {/* Leaderboard Logic for Past Events */}
                        {isPast ? (
                            <div className="space-y-6">
                                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm italic">
                                    Os resultados do evento serão processados brevemente.
                                </div>

                                {/* Map Section */}
                                <div>
                                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3 flex items-center gap-2">
                                        <MapPin className="h-3 w-3 text-red-500" />
                                        Localização
                                    </h4>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block group/map relative h-32 w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100 transition-all hover:shadow-md hover:border-blue-300"
                                    >
                                        <div className="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Open_Street_Map_Chile_Relief.png/640px-Open_Street_Map_Chile_Relief.png')] bg-cover bg-center grayscale group-hover/map:grayscale-0 transition-all duration-500"></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent"></div>

                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm text-xs font-bold text-gray-700 flex items-center gap-2 group-hover/map:scale-105 transition-transform">
                                                <MapPin size={14} className="text-red-500" />
                                                Ver {evt.location} no Mapa
                                                <ExternalLink size={12} className="text-gray-400" />
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        ) : (
                            /* Participants List for Future Events */
                            <div>
                                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3 flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    Participantes ({evt.participants.length})
                                </h4>
                                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {evt.participants.length > 0 ? evt.participants.map(participant => (
                                        <div key={participant.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {participant.avatar && participant.avatar.startsWith('http') ? (
                                                    <img src={participant.avatar} alt={participant.name} className="h-8 w-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                        {participant.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {participant.id === user.id ? 'Você' : participant.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{participant.office}</span>
                                                </div>
                                            </div>
                                            {participant.id === evt.creatorId && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Host</span>}
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-400 italic">Seja o primeiro a participar!</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 flex gap-2">
                    {!isPast && (
                        <Button
                            variant={isParticipant ? "outline" : "primary"}
                            className="flex-1"
                            onClick={() => handleJoin(evt.id, evt.participants)}
                        >
                            {isParticipant ? "Sair do Evento" : "Participar Agora"}
                        </Button>
                    )}
                    {isPast && (
                        <Button variant="secondary" className="flex-1 cursor-default" disabled>
                            <Trophy className="w-4 h-4 mr-2" />
                            Evento Concluído
                        </Button>
                    )}
                    <button
                        onClick={() => toggleExpand(evt.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        title={isExpanded ? "Ver menos" : "Ver detalhes"}
                    >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
