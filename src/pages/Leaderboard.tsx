import React from 'react';
import { User } from '../types';
import { Medal, TrendingUp, Trophy } from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';

interface LeaderboardProps {
  currentUser: User;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser }) => {
  const { data: leaderboardData, isLoading } = useLeaderboard();

  if (isLoading) {
    return <div className="p-8 text-center">Loading Leaderboard...</div>;
  }

  const rankedUsers = leaderboardData || [];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Medal className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-gray-500 font-bold w-6 text-center">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Quadro de Líderes Keo</h1>
        <p className="opacity-90">Competição amigável para nos mantermos ativos.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top 3 Podium Cards */}
        {rankedUsers.slice(0, 3).map((u) => (
          <div key={u.user_id} className={`relative flex flex-col items-center rounded-xl p-6 shadow-sm border ${u.rank === 1 ? 'bg-yellow-50 border-yellow-200 order-2 lg:order-2 scale-105 z-10' : 'bg-white border-gray-100 lg:order-1'}`}>
            <div className={`mb-4 flex items-center justify-center h-16 w-16 rounded-full border-4 ${u.rank === 1 ? 'border-yellow-400' : u.rank === 2 ? 'border-gray-300' : 'border-amber-600'}`}>
              <img src={u.avatar_url || 'https://via.placeholder.com/150'} alt={u.full_name} className="h-full w-full rounded-full object-cover" />
            </div>
            <div className="mb-1">{getRankIcon(u.rank)}</div>
            <h3 className="text-lg font-bold text-gray-900">{u.full_name || 'Anonymous'}</h3>
            <p className="text-2xl font-bold text-blue-600 mt-2">{u.total_points} pts</p>
          </div>
        ))}
      </div>

      {/* Full List */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3">Rank</th>
                <th scope="col" className="px-6 py-3">Colaborador</th>
                <th scope="col" className="px-6 py-3 text-right">Atividades</th>
                <th scope="col" className="px-6 py-3 text-right">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {rankedUsers.map((u) => (
                <tr key={u.user_id} className={`border-b hover:bg-gray-50 ${u.user_id === currentUser.id ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {getRankIcon(u.rank)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img className="h-8 w-8 rounded-full object-cover" src={u.avatar_url || 'https://via.placeholder.com/150'} alt="" />
                      <div className="font-medium text-gray-900">
                        {u.full_name || 'Anonymous'}
                        {u.user_id === currentUser.id && <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Você</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.activity_count}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">
                    {u.total_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
