import React from 'react';
import { ArrowRight, Calendar, MapPin, Loader2 } from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { Link } from 'react-router-dom';

const UpcomingEvents: React.FC = () => {
    const { data: events, isLoading } = useEvents();

    const upcomingEvents = (events || [])
        .filter(event => event.status === 'open' && new Date(event.date) >= new Date()) // Only open and future events
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    return (
        <section id="eventos" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-[#002D72] mb-4">Próximos Eventos</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">Inscreve-te através da App e garante o teu lugar nas atividades exclusivas para colaboradores KEO.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-[#002D72]" />
                    </div>
                ) : upcomingEvents.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-8">
                        {upcomingEvents.map((event) => {
                            const eventDate = new Date(event.date);
                            const day = eventDate.getDate();
                            const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();

                            return (
                                <div key={event.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition duration-300 group flex flex-col h-full">
                                    <div className="relative h-48 overflow-hidden shrink-0">
                                        <img
                                            src={event.image || `https://placehold.co/600x400/e2e8f0/1e293b?text=${encodeURIComponent(event.title)}`}
                                            alt={event.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                        />
                                        <div className="absolute top-4 right-4 bg-[#009CDE] text-white font-bold py-1 px-3 rounded-lg text-sm text-center shadow-md">
                                            <div className="text-lg leading-none">{day}</div>
                                            <div className="text-[10px] leading-none mt-1">{month}</div>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase mb-2">
                                            <MapPin className="w-3 h-3" />
                                            <span className="line-clamp-1">{event.location}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{event.description}</p>

                                        <div className="pt-4 mt-auto border-t border-gray-100">
                                            <Link to="/login" className="inline-flex items-center text-[#002D72] font-semibold hover:text-[#009CDE] transition-colors group/link">
                                                Ver detalhes <ArrowRight className="ml-2 w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">Sem eventos agendados</h3>
                        <p className="text-gray-500">Fica atento, novidades em breve!</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default UpcomingEvents;
