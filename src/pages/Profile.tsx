import React, { useState } from 'react';
import { User, ActivityType } from '../types';
import Button from '../components/Button';
import { Camera, Edit2, Save, X, Medal, Clock, Map, Zap, CheckCircle, Calendar, Activity, RefreshCw } from 'lucide-react';
import { ConnectStravaButton } from '../features/strava/components/ConnectStravaButton';
import { syncStravaActivities } from '../features/strava/services/strava';

interface ProfileProps {
  user: User;
  updateUser: (updates: Partial<User>) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, updateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    avatar: user.avatar
  });

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setFormData({ name: user.name, avatar: user.avatar });
    setIsEditing(false);
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMsg('');
    try {
      const result = await syncStravaActivities(user.id);
      setSyncMsg(result.message || 'Sincronização concluída!');
      // Refresh user data after 2 seconds to show new activities
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error(error);
      setSyncMsg('Erro ao sincronizar.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Stats Calculations
  const totalDistance = user.activities.reduce((acc, act) => acc + act.distance, 0);
  const totalDuration = user.activities.reduce((acc, act) => acc + act.duration, 0);
  const runCount = user.activities.filter(a => a.type === ActivityType.RUN).length;
  const rideCount = user.activities.filter(a => a.type === ActivityType.RIDE).length;

  // Mock Achievements based on stats
  const achievements = [
    { id: 1, name: 'Início de Jornada', desc: 'Primeira atividade registada', icon: '🚀', earned: user.activities.length > 0 },
    { id: 2, name: 'Maratonista', desc: '50km totais corridos', icon: '🏃', earned: totalDistance >= 50 },
    { id: 3, name: 'Dedicado', desc: '10 atividades completas', icon: '🔥', earned: user.activities.length >= 10 },
    { id: 4, name: 'Ciclista', desc: '5 voltas de bicicleta', icon: '🚴', earned: rideCount >= 5 },
    { id: 5, name: 'Elite Keo', desc: '1000 pontos acumulados', icon: '🏆', earned: user.totalPoints >= 1000 },
    { id: 6, name: 'Explorador', desc: 'Registo de Caminhada', icon: '🥾', earned: user.activities.some(a => a.type === ActivityType.HIKE) },
  ];

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="relative overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        <div className="px-6 pb-6">
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end -mt-12 mb-4 gap-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
                <img src={formData.avatar} alt="Profile" className="h-full w-full object-cover" />
              </div>
              {isEditing && (
                <div className="absolute bottom-0 right-0 bg-gray-900/50 p-1.5 rounded-full text-white cursor-pointer hover:bg-gray-900/75" title="Alterar URL do Avatar">
                  <Camera size={14} />
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="space-y-3 max-w-md pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome Completo</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">URL do Avatar</label>
                    <input
                      type="text"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 text-gray-600"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-1">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.isConnectedToStrava ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.isConnectedToStrava ? 'Conectado ao Strava' : 'Strava Não Conectado'}
                    </span>
                    {user.isConnectedToStrava && (
                      <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar (7 dias)'}
                      </button>
                    )}
                    {syncMsg && <span className="text-xs text-blue-600 font-medium animate-pulse">{syncMsg}</span>}
                    <span className="text-gray-400 text-sm">• Membro desde 2023</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEdit} className="flex-1 md:flex-none">
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} className="flex-1 md:flex-none">
                    <Save className="w-4 h-4 mr-1" /> Guardar
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="flex-1 md:flex-none">
                  <Edit2 className="w-4 h-4 mr-1" /> Editar Perfil
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Percorrido', value: `${totalDistance.toFixed(1)} km`, icon: Map, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Tempo Total', value: `${(totalDuration / 60).toFixed(1)} h`, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Atividades', value: user.activities.length, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Rank Atual', value: `#${user.rank}`, icon: Medal, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map((stat, i) => (
          <div key={i} className="flex flex-col items-center justify-center p-5 bg-white rounded-xl border border-gray-100 shadow-sm text-center transition-transform hover:scale-105">
            <div className={`p-3 rounded-full mb-3 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</div>
            <div className="text-xs text-gray-500 uppercase font-bold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Medal className="text-yellow-500" />
            Conquistas e Medalhas
          </h2>
          <span className="text-sm text-gray-500">
            {achievements.filter(a => a.earned).length} / {achievements.length} Desbloqueadas
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {achievements.map((achievement) => (
            <div key={achievement.id} className={`group relative flex flex-col items-center text-center p-4 rounded-xl border transition-all ${achievement.earned ? 'bg-gradient-to-b from-yellow-50 to-white border-yellow-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}`}>
              {achievement.earned && <div className="absolute top-2 right-2 text-green-500"><CheckCircle size={16} /></div>}
              <div className="text-4xl mb-3 transform transition-transform group-hover:scale-110">{achievement.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{achievement.name}</h3>
              <p className="text-xs text-gray-500 leading-snug">{achievement.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity History Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-blue-500" />
            Histórico de Atividades
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Atividade</th>
                <th className="px-6 py-3 text-right">Distância</th>
                <th className="px-6 py-3 text-right">Duração</th>
                <th className="px-6 py-3 text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {user.activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Ainda não há atividades registadas.
                  </td>
                </tr>
              ) : (
                [...user.activities]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((act) => (
                    <tr key={act.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(act.date).toLocaleDateString('pt-PT')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{act.title}</div>
                        <div className="text-xs text-gray-400">{act.type}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {act.distance.toFixed(1)} km
                      </td>
                      <td className="px-6 py-4 text-right">
                        {act.duration} min
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                          +{act.points} pts
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Profile;