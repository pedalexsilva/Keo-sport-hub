import React, { useState } from 'react';
import { Award, Activity, ShoppingBag, Calendar, Clock, MapPin, Zap, Settings, LogOut, ChevronRight, Trophy, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateTicket } from '../hooks/useTickets';
import { useLogout } from '../hooks/useLogout';
import SyncStravaButton from '../components/SyncStravaButton';
import ProfileActivityHistory from '../components/ProfileActivityHistory';
import { getStravaAuthUrl } from '../features/strava/services/strava';

interface ProfileViewProps {
    user: any;
    points: number;
    inventory: any[];
    stravaConnected: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, points, inventory, stravaConnected, onConnect, onDisconnect }) => {
    const navigate = useNavigate();
    const logout = useLogout();
    const createTicket = useCreateTicket();
    const [showSupport, setShowSupport] = useState(false);
    const [ticket, setTicket] = useState({ subject: '', description: '', priority: 'normal' });

    const handleSubmitTicket = async () => {
        if (!ticket.subject || !ticket.description) return;
        await createTicket.mutateAsync({
            subject: ticket.subject,
            description: ticket.description,
            priority: ticket.priority as any
        });
        alert("Ticke criado com sucesso!");
        setShowSupport(false);
        setTicket({ subject: '', description: '', priority: 'normal' });
    };

    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnectStrava = async () => {
        if (isConnecting) return;
        setIsConnecting(true);
        try {
            const url = await getStravaAuthUrl();
            if (url) window.location.href = url;
        } catch (error) {
            console.error("Failed to initiate connection", error);
            alert("Erro ao iniciar conexão com Strava. Verifique se o servidor está configurado.");
            setIsConnecting(false);
        }
    };

    return (
        <div className="px-6 pb-24 pt-6 animate-fade-in">
            <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                    <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`}
                        alt="Profile"
                        className="w-24 h-24 rounded-full border-4 border-white shadow-xl bg-gray-100 object-cover"
                    />
                    {stravaConnected && (
                        <div className="absolute bottom-0 right-0 bg-[#FC4C02] text-white p-1.5 rounded-full border-2 border-white" title="Connected to Strava">
                            <Activity className="w-4 h-4" />
                        </div>
                    )}
                </div>
                <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-gray-500 text-sm font-medium">{user.role || 'Member'} • {user.department || 'General'}</p>

                <div className="mt-4">
                    <SyncStravaButton />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
                    <div className="bg-yellow-50 p-2 rounded-full text-yellow-600 mb-2"><Trophy className="w-5 h-5" /></div>
                    <span className="text-xl font-bold text-[#002D72]">{points}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Pontos</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
                    <div className="bg-blue-50 p-2 rounded-full text-blue-600 mb-2"><Zap className="w-5 h-5" /></div>
                    <span className="text-xl font-bold text-[#002D72]">{user.activities?.length || 0}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Atividades</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
                    <div className="bg-purple-50 p-2 rounded-full text-purple-600 mb-2"><ShoppingBag className="w-5 h-5" /></div>
                    <span className="text-xl font-bold text-[#002D72]">{inventory?.length || 0}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Items</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div
                    className="p-4 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setShowSupport(true)}
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><AlertCircle className="w-5 h-5" /></div>
                        <span className="font-bold text-gray-700">Suporte KEO</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => { }} // Placeholder for now, or link to settings page
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-50 p-2 rounded-lg text-gray-600"><Settings className="w-5 h-5" /></div>
                        <span className="font-bold text-gray-700">Definições</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* Connected Apps Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[#002D72]">Aplicações Conectadas</h3>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">INTEGRAÇÕES</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${stravaConnected ? 'bg-[#FC4C02] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-[#002D72]">Strava</p>
                            {stravaConnected ? (
                                <p className="text-sm font-medium text-green-500 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Conectado
                                </p>
                            ) : (
                                <p className="text-sm font-medium text-gray-400 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full border border-gray-400"></span>
                                    Desconectado
                                </p>
                            )}
                        </div>
                    </div>

                    {stravaConnected ? (
                        <button
                            onClick={onDisconnect}
                            className="px-4 py-2 rounded-lg border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition"
                        >
                            Desconectar
                        </button>
                    ) : (
                        <button
                            onClick={handleConnectStrava}
                            disabled={isConnecting}
                            className={`bg-[#0F172A] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-black transition shadow-sm ${isConnecting ? 'opacity-75 cursor-wait' : ''}`}
                        >
                            {isConnecting ? 'A Conectar...' : 'Conectar'}
                        </button>
                    )}
                </div>
            </div>

            <ProfileActivityHistory activities={user.activities || []} />

            {/* Support Modal */}
            {showSupport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in">
                        <h3 className="text-xl font-bold text-[#002D72] mb-4">Novo Pedido de Suporte</h3>
                        <p className="text-sm text-gray-500 mb-4">Descreva o problema ou sugestão. Responderemos o mais breve possível.</p>

                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Assunto (Ex: Erro no Strava)"
                                className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#009CDE]"
                                value={ticket.subject}
                                onChange={e => setTicket({ ...ticket, subject: e.target.value })}
                            />
                            <textarea
                                placeholder="Descrição detalhada..."
                                className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#009CDE] h-32 resize-none"
                                value={ticket.description}
                                onChange={e => setTicket({ ...ticket, description: e.target.value })}
                            />
                            <select
                                className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none"
                                value={ticket.priority}
                                onChange={e => setTicket({ ...ticket, priority: e.target.value })}
                            >
                                <option value="low">Prioridade Baixa</option>
                                <option value="normal">Prioridade Normal</option>
                                <option value="high">Prioridade Alta</option>
                            </select>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowSupport(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold">Cancelar</button>
                            <button onClick={handleSubmitTicket} className="flex-1 py-3 bg-[#002D72] text-white rounded-xl font-bold hover:bg-blue-900">Enviar</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Logout Button */}
            <div className="mt-8 mb-20 px-4">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition shadow-sm"
                >
                    <LogOut className="w-5 h-5" />
                    Terminar Sessão
                </button>
            </div>
        </div>
    );
};

export default ProfileView;
