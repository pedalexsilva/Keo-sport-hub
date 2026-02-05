import React, { useState, useEffect } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { useEventStages, useEventStageBreakdown, useStageResults } from '../../hooks/useStageResults';
import { Loader2, Trophy, Mountain, Medal, Clock, CheckCircle, RefreshCw, Timer, ExternalLink, AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export const ResultsManager = () => {
    const { data: events, isLoading: isLoadingEvents } = useEvents();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [viewType, setViewType] = useState<'gc' | 'mountain' | string>('gc');

    // Auto-select first competitive event
    useEffect(() => {
        if (events && events.length > 0 && !selectedEventId) {
            const competitive = events.find(e => e.mode === 'competitive') || events[0];
            setSelectedEventId(competitive.id);
        }
    }, [events]);

    // Reset view when event changes
    useEffect(() => {
        setViewType('gc');
    }, [selectedEventId]);

    const { data: stages, isLoading: stagesLoading, refetch: refetchStages } = useEventStages(selectedEventId || undefined);
    const { data: stageBreakdown, isLoading: breakdownLoading, refetch: refetchBreakdown } = useEventStageBreakdown(selectedEventId || undefined);

    // For individual stage view
    const selectedStage = stages?.find(s => s.id === viewType);
    const { data: stageResults, isLoading: stageResultsLoading } = useStageResults(selectedStage?.id);

    const handleRefresh = () => {
        refetchStages();
        refetchBreakdown();
    };

    // Safe formatting for duration
    const formatTime = (seconds?: number) => {
        if (!seconds && seconds !== 0) return '-';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatGap = (seconds?: number) => {
        if (!seconds || seconds === 0) return '-';
        return `+ ${formatTime(seconds)}`;
    };

    if (isLoadingEvents) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    const officialStages = stages?.filter(s => s.status === 'official').length || 0;
    const totalStages = stages?.length || 0;
    const pendingStages = stages?.filter(s => s.status === 'pending' || s.status === 'mixed') || [];

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Results</h2>
                    <p className="text-gray-500 text-sm">Check event rankings and results.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Refresh"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Event Selector */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Event</label>
                <select
                    className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                    value={selectedEventId || ''}
                    onChange={(e) => setSelectedEventId(e.target.value || null)}
                >
                    <option value="">-- Select an event --</option>
                    {events?.map(evt => (
                        <option key={evt.id} value={evt.id}>{evt.title} ({formatDate(evt.date)})</option>
                    ))}
                </select>
            </div>

            {selectedEventId && (
                <>
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
                            <Trophy className="w-4 h-4" /> GC
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

                    {/* GC View with Stage Breakdown */}
                    {viewType === 'gc' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-yellow-50 to-white flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                <div>
                                    <h3 className="font-bold text-gray-800">General Classification (GC)</h3>
                                    <p className="text-xs text-gray-500">
                                        {officialStages === totalStages && totalStages > 0
                                            ? 'Sum of official stage times'
                                            : 'Sum of stage times (Provisional)'}
                                    </p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                {breakdownLoading || stagesLoading ? (
                                    <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
                                ) : !stageBreakdown || stageBreakdown.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                                        <AlertCircle className="w-8 h-8 opacity-50" />
                                        <p>No official results yet.</p>
                                        <p className="text-xs">Publish stage results first.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-16 text-center">Pos</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Athlete</th>
                                                {/* Dynamic stage columns */}
                                                {stages?.map(stage => (
                                                    <th key={stage.id} className="px-3 py-3 text-xs font-bold text-gray-500 uppercase text-center whitespace-nowrap">
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
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right bg-yellow-50">Total</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Gap</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {stageBreakdown.map((user, idx) => {
                                                const rank = idx + 1;
                                                const leaderTime = stageBreakdown[0]?.total_time_seconds || 0;
                                                const gap = user.total_time_seconds - leaderTime;

                                                return (
                                                    <tr key={user.user_id} className="hover:bg-yellow-50/30 transition">
                                                        <td className="px-4 py-3 text-center">
                                                            {rank === 1 ? <Medal className="w-4 h-4 text-yellow-500 mx-auto" /> :
                                                                rank === 2 ? <Medal className="w-4 h-4 text-gray-400 mx-auto" /> :
                                                                    rank === 3 ? <Medal className="w-4 h-4 text-amber-600 mx-auto" /> :
                                                                        <span className="text-gray-500 font-bold">{rank}</span>}
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
                                                                <div>
                                                                    <div className="font-bold text-sm text-gray-900">{user.profile?.full_name || 'Unknown'}</div>
                                                                    <div className="text-xs text-gray-400">{user.stages_official}/{user.stages_completed} stages official</div>
                                                                </div>
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
                                                            {rank === 1 ? '-' : (user.total_time_seconds > 0 ? formatGap(gap) : '-')}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mountain Classification */}
                    {viewType === 'mountain' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-red-50 to-white flex items-center gap-2">
                                <Mountain className="w-5 h-5 text-red-500" />
                                <h3 className="font-bold text-gray-800">Mountain Classification</h3>
                            </div>
                            <div className="p-12 text-center text-gray-400">
                                <Mountain className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p>Mountain classification uses the KOM system.</p>
                                <p className="text-xs mt-2">Go to Stage Manager to configure segments.</p>
                            </div>
                        </div>
                    )}

                    {/* Individual Stage View */}
                    {selectedStage && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Timer className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <h3 className="font-bold text-gray-800">{selectedStage.name}</h3>
                                        <p className="text-xs text-gray-500">{selectedStage.results_count} participants</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${selectedStage.status === 'official'
                                    ? 'bg-green-100 text-green-700'
                                    : selectedStage.status === 'mixed'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {selectedStage.status === 'official' ? (
                                        <><CheckCircle className="w-3.5 h-3.5" /> Official</>
                                    ) : selectedStage.status === 'mixed' ? (
                                        <><Clock className="w-3.5 h-3.5" /> Partially Official</>
                                    ) : (
                                        <><Clock className="w-3.5 h-3.5" /> Pending Review</>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                {stageResultsLoading ? (
                                    <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
                                ) : !stageResults || stageResults.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                                        <AlertCircle className="w-8 h-8 opacity-50" />
                                        <p>No results yet for this stage.</p>
                                        <p className="text-xs">Sync with Strava first.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-16 text-center">Pos</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Athlete</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Time</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center w-20">Status</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center w-20">Strava</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {stageResults.map((r) => (
                                                <tr key={r.id} className="hover:bg-blue-50/30 transition">
                                                    <td className="px-4 py-3 text-center">
                                                        {r.rank === 1 ? <Medal className="w-4 h-4 text-yellow-500 mx-auto" /> :
                                                            r.rank === 2 ? <Medal className="w-4 h-4 text-gray-400 mx-auto" /> :
                                                                r.rank === 3 ? <Medal className="w-4 h-4 text-amber-600 mx-auto" /> :
                                                                    <span className="text-gray-500 font-bold">{r.rank}</span>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                                                {r.profile?.avatar_url ? (
                                                                    <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                                                        {r.profile?.full_name?.charAt(0) || '?'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm text-gray-900">{r.profile?.full_name || 'Unknown'}</div>
                                                                <div className="text-xs text-gray-400">{r.profile?.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="font-mono font-medium text-gray-900">
                                                            {formatTime(r.official_time_seconds || r.elapsed_time_seconds)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {r.status === 'official' ? (
                                                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                                        ) : r.status === 'dq' ? (
                                                            <span className="text-red-500 font-bold text-xs">DQ</span>
                                                        ) : (
                                                            <Clock className="w-4 h-4 text-orange-400 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {r.strava_activity_id && (
                                                            <a
                                                                href={`https://www.strava.com/activities/${r.strava_activity_id}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {!selectedEventId && (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 text-center">
                    <Trophy className="w-16 h-16 text-gray-200 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">Select an Event</h3>
                    <p className="text-gray-500">Choose an event above to see rankings.</p>
                </div>
            )}
        </div>
    );
};
