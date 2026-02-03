import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Medal, Trophy, Mountain, Timer, AlertCircle, CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useEventLeaderboard } from '../hooks/useEventLeaderboard';
import { useEvents } from '../hooks/useEvents';
import { useEventStages, useEventStageBreakdown, StageInfo } from '../hooks/useStageResults';
import { KOMLeaderboard } from '../components/KOMLeaderboard';
import { StageResultsView } from '../components/StageResultsView';

interface LeaderboardProps {
  currentUser: User;
}

const formatTime = (seconds?: number) => {
  if (seconds === undefined || seconds === null || seconds === 0) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatGap = (seconds?: number) => {
  if (!seconds || seconds === 0) return '-';
  return `+ ${formatTime(seconds)}`;
};

type ViewType = 'gc' | 'mountain' | string; // string for stage IDs

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser }) => {
  const { data: events, isLoading: eventsLoading } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ViewType>('gc');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Auto-select most relevant event
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      const active = events.find(e => e.status === 'open' && e.mode === 'competitive') || events[0];
      setSelectedEventId(active.id);
    }
  }, [events]);

  // Reset view when event changes
  useEffect(() => {
    setViewType('gc');
    setExpandedUser(null);
  }, [selectedEventId]);

  const { data: stages, isLoading: stagesLoading, refetch: refetchStages } = useEventStages(selectedEventId || undefined);
  const { data: leaderboardData, isLoading: lbLoading, refetch: refetchLeaderboard } = useEventLeaderboard(selectedEventId || '', 'gc');
  const { data: stageBreakdown, isLoading: breakdownLoading, refetch: refetchBreakdown } = useEventStageBreakdown(selectedEventId || undefined);

  const handleRefresh = () => {
    refetchStages();
    refetchLeaderboard();
    refetchBreakdown();
  };

  if (eventsLoading) return <div className="p-8 text-center text-gray-500">Loading Events...</div>;
  if (!selectedEventId) return <div className="p-8 text-center text-gray-500">No active events with classifications.</div>;

  const selectedEvent = events?.find(e => e.id === selectedEventId);
  const officialStages = stages?.filter(s => s.status === 'official').length || 0;
  const totalStages = stages?.length || 0;
  const pendingStages = stages?.filter(s => s.status === 'pending' || s.status === 'mixed') || [];

  // Find selected stage if viewing a specific stage
  const selectedStage = stages?.find(s => s.id === viewType);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-gray-500 font-bold text-sm">{rank}</span>;
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-[#002D72]">Results</h2>
          <p className="text-sm text-gray-500">Check event rankings and results.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            className="flex-1 md:flex-none p-2.5 border rounded-lg text-sm bg-gray-50 min-w-[200px]"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events?.filter(e => e.mode === 'competitive').map(e => (
              <option key={e.id} value={e.id}>{e.title} ({new Date(e.date).toLocaleDateString('pt-PT')})</option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stage Status Summary */}
      {stages && stages.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100">
          <div className="flex items-center gap-2">
            {officialStages === totalStages ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Clock className="w-5 h-5 text-orange-400" />
            )}
            <span className="font-bold text-[#002D72]">
              {officialStages}/{totalStages} Stages Official
            </span>
          </div>
          {pendingStages.length > 0 && (
            <span className="text-sm text-gray-500">
              • Pending: {pendingStages.map(s => s.name).join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 p-1 rounded-xl">
        {/* GC Tab */}
        <button
          onClick={() => setViewType('gc')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${viewType === 'gc'
              ? 'bg-white text-yellow-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
        >
          <Timer className="w-4 h-4" /> GC
        </button>

        {/* Mountain Tab */}
        <button
          onClick={() => setViewType('mountain')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${viewType === 'mountain'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
        >
          <Mountain className="w-4 h-4" /> Mountain
        </button>

        {/* Divider */}
        {stages && stages.length > 0 && (
          <div className="w-px bg-gray-300 mx-1" />
        )}

        {/* Stage Tabs */}
        {stages?.map(stage => (
          <button
            key={stage.id}
            onClick={() => setViewType(stage.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${viewType === stage.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
          >
            {stage.status === 'official' ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-orange-400" />
            )}
            {stage.name}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {/* Mountain Classification */}
      {viewType === 'mountain' && selectedEventId && (
        <KOMLeaderboard eventId={selectedEventId} eventTitle={selectedEvent?.title} />
      )}

      {/* Stage-Specific View */}
      {selectedStage && (
        <StageResultsView
          stageId={selectedStage.id}
          stageName={selectedStage.name}
          stageStatus={selectedStage.status}
        />
      )}

      {/* GC View with Stage Breakdown */}
      {viewType === 'gc' && (
        <div className="space-y-4">
          {/* GC Title */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-white rounded-xl border border-yellow-100">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <div>
              <h3 className="font-bold text-[#002D72]">General Classification (GC)</h3>
              <p className="text-sm text-gray-500">Sum of official stage times</p>
            </div>
          </div>

          {/* Loading State */}
          {(lbLoading || breakdownLoading) && (
            <div className="p-12 text-center text-gray-500">
              <Clock className="w-8 h-8 animate-pulse mx-auto mb-2" />
              Loading classification...
            </div>
          )}

          {/* Empty State */}
          {!lbLoading && !breakdownLoading && (!stageBreakdown || stageBreakdown.length === 0) && (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-100">
              <AlertCircle className="w-8 h-8 opacity-50" />
              <p>No official results for this event yet.</p>
              <p className="text-xs">Stage results must be published first.</p>
            </div>
          )}

          {/* Results Table with Stage Columns */}
          {stageBreakdown && stageBreakdown.length > 0 && (
            <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 w-16 text-center">Pos</th>
                      <th scope="col" className="px-4 py-3">Athlete</th>
                      {/* Dynamic stage columns */}
                      {stages?.map(stage => (
                        <th key={stage.id} scope="col" className="px-3 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {stage.status === 'official' ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <Clock className="w-3 h-3 text-orange-400" />
                            )}
                            <span className="truncate max-w-[60px]">{stage.name}</span>
                          </div>
                        </th>
                      ))}
                      <th scope="col" className="px-4 py-3 text-right font-bold bg-yellow-50">Total</th>
                      <th scope="col" className="px-4 py-3 text-right">Gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageBreakdown.map((user, idx) => {
                      const rank = idx + 1;
                      const isExpanded = expandedUser === user.user_id;
                      const leaderTime = stageBreakdown[0]?.total_time_seconds || 0;
                      const gap = user.total_time_seconds - leaderTime;
                      const isCurrentUser = user.user_id === currentUser.id;

                      return (
                        <tr
                          key={user.user_id}
                          className={`border-b hover:bg-gray-50 transition cursor-pointer ${isCurrentUser ? 'bg-blue-50/50' : ''}`}
                          onClick={() => setExpandedUser(isExpanded ? null : user.user_id)}
                        >
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">{getRankIcon(rank)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                {user.profile?.avatar_url ? (
                                  <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                    {user.profile?.full_name?.charAt(0) || '?'}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 truncate">{user.profile?.full_name || 'Unknown'}</span>
                                  {isCurrentUser && (
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">YOU</span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">
                                  {user.stages_official}/{user.stages_completed} stages official
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400 ml-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                              )}
                            </div>
                          </td>
                          {/* Stage time cells */}
                          {stages?.map(stage => {
                            const stageResult = user.stages.find(s => s.stage_id === stage.id);
                            return (
                              <td key={stage.id} className="px-3 py-3 text-center">
                                {stageResult ? (
                                  <div className="flex flex-col items-center">
                                    <span className={`font-mono text-xs ${stageResult.status === 'official' ? 'text-gray-900' : 'text-gray-400'}`}>
                                      {formatTime(stageResult.time_seconds)}
                                    </span>
                                    {stageResult.status === 'official' ? (
                                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                                    ) : (
                                      <Clock className="w-3 h-3 text-orange-400 mt-0.5" />
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right bg-yellow-50/50">
                            <span className="font-mono font-bold text-gray-900">
                              {formatTime(user.total_time_seconds)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">
                            {rank === 1 ? '-' : formatGap(gap)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
