import React from 'react';
import { Award, Activity, ShoppingBag, Calendar, Clock, MapPin, Zap } from 'lucide-react';

interface ProfileViewProps {
    user: any;
    points: number;
    inventory: any[];
    stravaConnected: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, points, inventory, stravaConnected, onConnect, onDisconnect }) => (
    <div className="px-6 pb-24 pt-6 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
                <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-white shadow-xl bg-gray-100 object-cover"
                />
                <div className="absolute bottom-0 right-0 bg-[#009CDE] p-1.5 rounded-full border-2 border-white text-white"><Award className="w-4 h-4" /></div>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.role || 'Membro KEO'}</p>
        </div>

        {/* Integrations Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-[#002D72]">Aplicações Conectadas</h3>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Integrações</span>
            </div>
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stravaConnected ? 'bg-[#FC4C02]' : 'bg-gray-100'}`}>
                            <Activity className={`w-6 h-6 ${stravaConnected ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-gray-800">Strava</p>
                            <p className={`text-xs ${stravaConnected ? 'text-green-500 font-bold' : 'text-gray-400'}`}>
                                {stravaConnected ? '● Conectado' : '○ Desconectado'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={stravaConnected ? onDisconnect : onConnect}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${stravaConnected ? 'border-red-100 text-red-500 hover:bg-red-50' : 'bg-gray-900 text-white border-transparent hover:bg-black'}`}
                    >
                        {stravaConnected ? 'Desconectar' : 'Conectar'}
                    </button>
                </div>
            </div>
        </div>

        {/* Activity History Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-[#002D72]">Histórico de Atividades</h3>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recentes</span>
            </div>

            {!stravaConnected ? (
                // Empty State: Not Connected
                <div className="p-8 text-center bg-gray-50/50">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Activity className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Conecta o Strava</p>
                    <p className="text-xs text-gray-500 max-w-[200px] mx-auto mb-4">
                        Conecta a tua conta para veres aqui o teu histórico de atividades.
                    </p>
                    <button
                        onClick={onConnect}
                        className="text-xs font-bold bg-[#FC4C02] text-white px-4 py-2 rounded-lg hover:bg-[#e34402] transition-colors"
                    >
                        Conectar Agora
                    </button>
                </div>
            ) : user.activities && user.activities.length > 0 ? (
                // List of Activities
                <div className="divide-y divide-gray-50">
                    {user.activities.slice(0, 5).map((activity: any) => (
                        <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                            {/* Icon based on Type */}
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-[#009CDE]">
                                {activity.type === 'Run' ? <Activity className="w-5 h-5" /> :
                                    activity.type === 'Ride' ? <Zap className="w-5 h-5" /> :
                                        <Activity className="w-5 h-5" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate">{activity.title}</h4>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(activity.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {(activity.distance / 1000).toFixed(1)} km
                                    </span>
                                    <span className="flex items-center gap-1 text-[#FC4C02] font-semibold bg-orange-50 px-1.5 py-0.5 rounded">
                                        +{activity.points} pts
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="p-3 text-center border-t border-gray-50">
                        <button className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">Ver todas</button>
                    </div>
                </div>
            ) : (
                // Connected but No Activities
                <div className="p-8 text-center">
                    <p className="text-sm text-gray-500">Nenhuma atividade recente encontrada.</p>
                </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl text-center"><span className="block text-2xl font-bold text-[#002D72]">{points}</span><span className="text-xs text-blue-400 uppercase font-bold">Saldo</span></div>
            <div className="bg-orange-50 p-4 rounded-xl text-center"><span className="block text-2xl font-bold text-orange-600">{inventory.length}</span><span className="text-xs text-orange-400 uppercase font-bold">Prémios</span></div>
        </div>

        <h3 className="text-lg font-bold text-[#002D72] mb-4">Inventário</h3>
        {inventory.length === 0 ? (
            <div className="text-center p-6 bg-white border border-dashed border-gray-300 rounded-2xl mb-8"><ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">Sem itens ainda.</p></div>
        ) : (
            <div className="space-y-3 mb-8">{inventory.map((item, idx) => <div key={idx} className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100"><img src={item.image} className="w-10 h-10 rounded-lg mr-3 object-cover" /><p className="font-bold text-sm text-gray-800">{item.name}</p></div>)}</div>
        )}
    </div>
);

export default ProfileView;
