import React from 'react';
import { Clock, Trophy, Medal, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { useStageResults, StageResultEntry } from '../hooks/useStageResults';

interface StageResultsViewProps {
    stageId: string;
    stageName: string;
    stageStatus: 'pending' | 'official' | 'mixed';
}

const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getRankIcon = (rank: number) => {
    switch (rank) {
        case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
        case 2: return <Medal className="h-5 w-5 text-gray-400" />;
        case 3: return <Medal className="h-5 w-5 text-amber-600" />;
        default: return <span className="text-gray-500 font-bold text-sm">{rank}</span>;
    }
};

export const StageResultsView: React.FC<StageResultsViewProps> = ({ stageId, stageName, stageStatus }) => {
    const { data: results, isLoading } = useStageResults(stageId);

    if (isLoading) {
        return (
            <div className="p-12 text-center text-gray-500">
                <Clock className="w-8 h-8 animate-pulse mx-auto mb-2" />
                Loading stage results...
            </div>
        );
    }

    if (!results || results.length === 0) {
        return (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 opacity-50" />
                <p>No results yet for this stage.</p>
                <p className="text-xs">Sync with Strava to fetch participant activities.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stage Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                <div>
                    <h3 className="text-lg font-bold text-[#002D72]">{stageName}</h3>
                    <p className="text-sm text-gray-500">{results.length} participants</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${stageStatus === 'official'
                        ? 'bg-green-100 text-green-700'
                        : stageStatus === 'mixed'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {stageStatus === 'official' ? (
                        <><CheckCircle className="w-3.5 h-3.5" /> Official</>
                    ) : stageStatus === 'mixed' ? (
                        <><Clock className="w-3.5 h-3.5" /> Partially Official</>
                    ) : (
                        <><Clock className="w-3.5 h-3.5" /> Pending Review</>
                    )}
                </div>
            </div>

            {/* Results Table */}
            <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                            <tr>
                                <th scope="col" className="px-4 py-3 w-16 text-center">Pos</th>
                                <th scope="col" className="px-4 py-3">Athlete</th>
                                <th scope="col" className="px-4 py-3 text-right">Time</th>
                                <th scope="col" className="px-4 py-3 text-center w-20">Status</th>
                                <th scope="col" className="px-4 py-3 text-center w-20">Strava</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r) => (
                                <tr key={r.id} className="border-b hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center">{getRankIcon(r.rank || 0)}</div>
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
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-gray-900 truncate">{r.profile?.full_name || 'Unknown'}</span>
                                                <span className="text-xs text-gray-400 truncate">{r.profile?.email}</span>
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
                </div>
            </div>
        </div>
    );
};
