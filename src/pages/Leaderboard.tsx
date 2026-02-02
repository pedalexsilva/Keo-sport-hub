import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Medal, Trophy, Mountain, Timer, AlertCircle } from 'lucide-react';
import { useEventLeaderboard } from '../hooks/useEventLeaderboard';
import { useEvents } from '../hooks/useEvents';

interface LeaderboardProps {
  currentUser: User;
}

const formatTime = (seconds?: number) => {
  if (seconds === undefined) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatGap = (seconds?: number) => {
  if (!seconds || seconds === 0) return '-';
  return `+ ${formatTime(seconds)}`;
};

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser }) => {
  const { data: events, isLoading: eventsLoading } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [classificationType, setClassificationType] = useState<'gc' | 'mountain'>('gc');

  // Auto-select most relevant event
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      // Prefer 'open' events, else most recent
      const active = events.find(e => e.status === 'open' && e.mode === 'competitive') || events[0];
      setSelectedEventId(active.id);
    }
  }, [events]);

  const { data: leaderboardData, isLoading: lbLoading } = useEventLeaderboard(selectedEventId || '', classificationType);

  if (eventsLoading) return <div className="p-8 text-center text-gray-500">Loading Events...</div>;
  if (!selectedEventId) return <div className="p-8 text-center text-gray-500">Nenhum evento ativo com classificações.</div>;

  const rankedUsers = leaderboardData || [];
  const selectedEvent = events?.find(e => e.id === selectedEventId);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className={`h-6 w-6 ${classificationType === 'gc' ? 'text-yellow-500' : 'text-red-500'}`} />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Medal className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-gray-500 font-bold w-6 text-center">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Context */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-[#002D72]">Classificações Oficiais</h2>
          <p className="text-sm text-gray-500">Evento: <span className="font-semibold text-[#009CDE]">{selectedEvent?.title}</span></p>
        </div>
        <select
          className="p-2 border rounded-lg text-sm bg-gray-50"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
        >
          {events?.filter(e => e.mode === 'competitive').map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-200 p-1 rounded-xl">
        <button
          onClick={() => setClassificationType('gc')}
          className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${classificationType === 'gc' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Timer className="w-5 h-5" /> General Classification (GC)
        </button>
        <button
          onClick={() => setClassificationType('mountain')}
          className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${classificationType === 'mountain' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Mountain className="w-5 h-5" /> Mountain Classification
        </button>
      </div>

      {/* Podium Cards */}
      <div className="grid gap-6 lg:grid-cols-3 items-end">
        {rankedUsers.slice(0, 3).map((u) => (
          <div key={u.user_id} className={`relative flex flex-col items-center rounded-xl p-6 shadow-sm border ${u.rank === 1 ? 'bg-yellow-50 border-yellow-200 order-2 lg:order-2 scale-105 z-10' : 'bg-white border-gray-100 lg:order-1'}`}>
            <div className={`mb-4 flex items-center justify-center h-16 w-16 rounded-full border-4 overflow-hidden bg-white ${u.rank === 1 ? 'border-yellow-400' : u.rank === 2 ? 'border-gray-300' : 'border-amber-600'}`}>
              {u.user?.avatar_url ? (
                <img src={u.user.avatar_url} alt={u.user.full_name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold">{u.user?.full_name?.substring(0, 2)}</span>
              )}
            </div>
            <div className="mb-1">{getRankIcon(u.rank)}</div>
            <h3 className="text-lg font-bold text-gray-900 text-center line-clamp-1 w-full">{u.user?.full_name || 'Anonymous'}</h3>
            <p className="text-xs text-gray-500 mb-1">{u.user?.office}</p>
            <p className={`text-xl font-bold mt-2 ${classificationType === 'gc' ? 'text-blue-600' : 'text-red-500'}`}>
              {classificationType === 'gc' ? formatTime(u.total_time_seconds) : `${u.total_points} pts`}
            </p>
          </div>
        ))}
      </div>

      {/* Full List */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {lbLoading ? (
          <div className="p-12 text-center text-gray-500">A carregar classificações...</div>
        ) : rankedUsers.length == 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 opacity-50" />
            <p>Ainda não há resultados oficiais para este evento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3">Rank</th>
                  <th scope="col" className="px-6 py-3">Atleta</th>
                  {classificationType === 'gc' && <th scope="col" className="px-6 py-3 text-right">Tempo Total</th>}
                  <th scope="col" className="px-6 py-3 text-right">{classificationType === 'gc' ? 'Gap' : 'Pontos'}</th>
                </tr>
              </thead>
              <tbody>
                {rankedUsers.map((u) => (
                  <tr key={u.user_id} className={`border-b hover:bg-gray-50 ${u.user_id === currentUser.id ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4 font-bold text-gray-900 w-16 text-center">
                      {u.rank}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                          {u.user?.avatar_url ? <img src={u.user.avatar_url} className="w-full h-full object-cover" /> : null}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{u.user?.full_name || 'Anonymous'}</span>
                          <span className="text-xs text-gray-400">{u.user?.office}</span>
                        </div>
                        {u.user_id === currentUser.id && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">VOCÊ</span>}
                      </div>
                    </td>
                    {classificationType === 'gc' && (
                      <td className="px-6 py-4 text-right font-mono font-medium text-gray-900">
                        {formatTime(u.total_time_seconds)}
                      </td>
                    )}
                    <td className={`px-6 py-4 text-right font-bold ${classificationType === 'gc' ? 'text-gray-500 font-mono text-xs' : 'text-red-600'}`}>
                      {classificationType === 'gc' ? formatGap(u.gap_seconds) : u.total_points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
