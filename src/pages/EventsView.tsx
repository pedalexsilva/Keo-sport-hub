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

// Helper to determine if an event is in the past
const isPastEvent = (date: string) => new Date(date) < new Date();

const EventsView: React.FC<EventsViewProps> = ({ events, onJoin, user }) => {
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pastEvents = events.filter(e => new Date(e.date) < now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const displayedEvents = tab === 'upcoming' ? upcomingEvents : pastEvents;

    if (selectedEvent) {
        const isPast = isPastEvent(selectedEvent.date);
        const joined = selectedEvent.participants.some(p => p.id === user.id);

        return (
            <div className="bg-white min-h-full pb-24 animate-fade-in relative z-20">
                <div className="relative h-64">
                    <img src={selectedEvent.image} className="w-full h-full object-cover" alt="Event" />
                    <div className="absolute inset-0 bg-black/40"></div>
                    <button
                        onClick={() => setSelectedEvent(null)}
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
                            <h3 className="text-lg font-bold text-[#002D72] mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" /> Classificação (Simulada)
                            </h3>
                            <div className="space-y-3">
                                <p className="text-gray-500 italic text-sm">Os resultados detalhados ainda não estão disponíveis.</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {selectedEvent.description || "Junta-te aos teus colegas para este evento desportivo da KEO. Fortalece o espírito de equipa e melhora a tua saúde!"}
                            </p>

                            {/* Stages Carousel */}
                            <EventStagesCarousel eventId={selectedEvent.id} />

                            <h3 className="text-lg font-bold text-[#002D72] mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" /> Participantes ({selectedEvent.participants.length})
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

                            <div className="fixed bottom-24 left-6 right-6 md:absolute md:bottom-6 md:w-auto">
                                <button
                                    onClick={() => onJoin(selectedEvent.id)}
                                    className={`w-full py-4 rounded-2xl text-lg font-bold shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${joined ? 'bg-green-500 text-white' : 'bg-[#002D72] text-white'}`}
                                >
                                    {joined ? <><CheckCircle2 className="w-5 h-5" /> Inscrito</> : 'Inscrever no Evento'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 pb-24 pt-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-[#002D72] mb-4">Eventos KEO</h2>

            <div className="flex p-1 bg-gray-200 rounded-xl mb-6">
                <button
                    onClick={() => setTab('upcoming')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${tab === 'upcoming' ? 'bg-white text-[#002D72] shadow-sm' : 'text-gray-500'}`}
                >
                    Próximos
                </button>
                <button
                    onClick={() => setTab('past')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${tab === 'past' ? 'bg-white text-[#002D72] shadow-sm' : 'text-gray-500'}`}
                >
                    Passados
                </button>
            </div>

            <div className="space-y-6">
                {displayedEvents.map((event) => (
                    <div key={event.id} onClick={() => setSelectedEvent(event)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer active:scale-98 transition-transform">
                        <div className="relative h-32">
                            <img src={event.image || 'https://images.unsplash.com/photo-1552674605-5d28c4e1902c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-[#002D72] shadow-sm">{event.type}</div>
                            {tab === 'past' && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="border-2 border-white text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Concluído</span>
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
                                    <span className="text-xs font-bold text-[#009CDE]">Ver detalhes →</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {displayedEvents.length === 0 && (
                    <div className="text-center p-8 text-gray-400 text-sm">Não há eventos para mostrar.</div>
                )}
            </div>
        </div>
    );
};

export default EventsView;
