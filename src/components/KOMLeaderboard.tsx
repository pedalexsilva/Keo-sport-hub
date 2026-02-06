import React, { useState } from 'react';
import { useKOMClassification } from '../hooks/useSegments';
import { Mountain, Trophy, Medal, Crown } from 'lucide-react';

interface KOMLeaderboardProps {
    eventId: string;
    eventTitle?: string;
}

export const KOMLeaderboard = ({ eventId, eventTitle }: KOMLeaderboardProps) => {
    const { data: classification, isLoading: isLoadingKOM } = useKOMClassification(eventId);


    if (isLoadingKOM) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
                </div>
            </div>
        );
    }

    if (!classification || classification.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <Mountain className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No KOM results yet</p>
                <p className="text-sm text-gray-400">Segment results will appear here after stages are processed.</p>
            </div>
        );
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
            case 2: return <Medal className="h-5 w-5 text-gray-400" />;
            case 3: return <Medal className="h-5 w-5 text-amber-600" />;
            default: return <span className="text-gray-500 font-bold text-sm">{rank}</span>;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header with polka dots pattern (like KOM jersey) */}
            <div className="relative bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, #ef4444 4px, transparent 4px)',
                        backgroundSize: '20px 20px'
                    }} />
                </div>
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shadow-lg">
                            <Mountain className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                KOM Classification
                                <Crown className="w-5 h-5 text-red-500" />
                            </h3>
                            <p className="text-sm text-gray-500">{eventTitle || 'Mountain Prize'}</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                        <tr>
                            <th scope="col" className="px-4 py-3 w-16 text-center">Rank</th>
                            <th scope="col" className="px-4 py-3">Athlete</th>
                            <th scope="col" className="px-4 py-3 text-right">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classification.map((entry, idx) => (
                            <tr key={entry.user_id} className="border-b hover:bg-gray-50 transition last:border-b-0">
                                <td className="px-4 py-3 text-center">
                                    <div className="flex justify-center">{getRankIcon(idx + 1)}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                            {entry.profile.avatar_url ? (
                                                <img src={entry.profile.avatar_url} alt={entry.profile.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                                    {entry.profile.full_name?.substring(0, 2).toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-gray-900 truncate flex items-center gap-2">
                                                {entry.profile.full_name}
                                                {idx === 0 && <Crown className="w-3 h-3 text-red-500" />}
                                            </span>
                                            <span className="text-xs text-gray-400 truncate">{entry.segments_completed} segments completed</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="font-bold text-xl text-gray-900">
                                        {entry.total_points}
                                    </span>
                                    <span className="ml-1 text-xs text-gray-400 uppercase">pts</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


        </div>
    );
};
