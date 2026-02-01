import React from 'react';
import { Flame, Route, RefreshCw, AlertCircle, Calendar, MapPin, ChevronRight } from 'lucide-react';
import OfficeBattleWidget from '../components/OfficeBattleWidget';
import { useNavigate } from 'react-router-dom';
import { Event } from '../types';

interface HomeViewProps {
    user: any;
    stats: {
        distance: number;
        calories: number;
    };
    events: Event[];
    stravaConnected: boolean;
    isSyncing: boolean;
    onSync: () => void;
    onConnect: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ user, stats, events, stravaConnected, isSyncing, onSync, onConnect }) => {
    const navigate = useNavigate();

    const myUpcomingEvents = events
        .filter(e => e.participants.includes(user.id) && new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="px-6 pb-24 pt-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#002D72]">Resumo Diário</h2>
                <button
                    onClick={stravaConnected ? onSync : onConnect}
                    disabled={isSyncing}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${stravaConnected
                        ? 'bg-blue-50 text-[#002D72] hover:bg-blue-100'
                        : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                        }`}
                >
                    {isSyncing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : stravaConnected ? (
                        <><RefreshCw className="w-3.5 h-3.5" /> Sincronizar</>
                    ) : (
                        <><AlertCircle className="w-3.5 h-3.5" /> Conectar Strava</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                        <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                    <span className="text-2xl font-bold text-gray-800 transition-all">{stats.calories}</span>
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Kcal</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-2 relative overflow-hidden">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center z-10">
                        <Route className="w-6 h-6 text-[#009CDE]" />
                    </div>
                    <span className="text-2xl font-bold text-gray-800 z-10 transition-all">{stats.distance}</span>
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider z-10">Km</span>
                    <div className="absolute bottom-0 left-0 h-1 bg-[#009CDE] w-[70%]"></div>
                </div>
            </div>

            <OfficeBattleWidget />

            {myUpcomingEvents.length > 0 && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-[#002D72]">Os meus Eventos</h3>
                        <span
                            onClick={() => navigate('/app/events')}
                            className="text-xs text-[#009CDE] font-bold cursor-pointer"
                        >
                            Ver todos
                        </span>
                    </div>
                    <div className="space-y-4">
                        {myUpcomingEvents.slice(0, 3).map(event => (
                            <div
                                key={event.id}
                                onClick={() => navigate('/app/events')}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1">{event.title}</h4>
                                        <div className="flex items-center text-xs text-gray-500 gap-3">
                                            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-[#009CDE]" /> {new Date(event.date).toLocaleDateString()}</span>
                                            <span className="flex items-center"><MapPin className="w-3 h-3 mr-1 text-[#009CDE]" /> {event.location}</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-[#002D72]">Destaques da Loja</h3>
                <span
                    onClick={() => navigate('/app/store')}
                    className="text-xs text-[#009CDE] font-bold cursor-pointer"
                >
                    Ver Loja
                </span>
            </div>
            <div className="bg-gradient-to-r from-gray-900 to-[#002D72] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden mb-8">
                <div className="relative z-10 w-2/3">
                    <span className="bg-[#009CDE] text-[10px] font-bold px-2 py-1 rounded text-white mb-2 inline-block">NOVO</span>
                    <h4 className="font-bold text-lg leading-tight mb-2">Hoodie KEO 2026</h4>
                    <p className="text-xs text-gray-300 mb-3">Edição limitada para os atletas mais dedicados.</p>
                    <button onClick={() => navigate('/app/store')} className="text-xs font-bold border-b border-white pb-0.5 cursor-pointer">Ver detalhes</button>
                </div>
                <img src="https://images.unsplash.com/photo-1556906781-9a412961d289?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" className="absolute -right-4 -bottom-4 w-32 h-32 object-cover rounded-full border-4 border-white/20" alt="Hoodie" />
            </div>
        </div>
    );
};

export default HomeView;
