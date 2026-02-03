import React, { useState } from 'react';
import {
    useKOMClassification,
    useEventSegments,
    CATEGORY_CONFIG,
    formatSegmentTime
} from '../hooks/useSegments';
import { Mountain, Trophy, Medal, ChevronDown, ChevronRight, Crown, AlignLeft } from 'lucide-react';

interface KOMLeaderboardProps {
    eventId: string;
    eventTitle?: string;
}

export const KOMLeaderboard = ({ eventId, eventTitle }: KOMLeaderboardProps) => {
    const { data: classification, isLoading: isLoadingKOM } = useKOMClassification(eventId);
    const { data: segmentResults, isLoading: isLoadingSegments } = useEventSegments(eventId);
    const [showBreakdown, setShowBreakdown] = useState(false);

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

    const leader = classification[0];

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
                    <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <AlignLeft className="w-4 h-4" />
                        {showBreakdown ? 'Hide' : 'Show'} Breakdown
                        {showBreakdown ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Leader Card */}
            <div className="p-4 bg-gradient-to-r from-red-50/50 to-orange-50/50 border-b">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img
                            src={leader.profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.profile.full_name)}&background=ef4444&color=fff`}
                            alt={leader.profile.full_name}
                            className="w-16 h-16 rounded-full border-4 border-red-400 shadow-md object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                            <Crown className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                                LEADER
                            </span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">{leader.profile.full_name}</h4>
                        <p className="text-sm text-gray-500">{leader.segments_completed} segment wins</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-red-600">{leader.total_points}</div>
                        <div className="text-xs text-gray-500 uppercase font-bold">points</div>
                    </div>
                </div>
            </div>

            {/* Rest of Classification */}
            <div className="divide-y divide-gray-50">
                {classification.slice(1).map((entry, idx) => (
                    <div
                        key={entry.user_id}
                        className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition"
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-gray-100 text-gray-600' :
                                idx === 1 ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-50 text-gray-400'
                            }`}>
                            {idx === 0 ? '🥈' : idx === 1 ? '🥉' : idx + 2}
                        </div>
                        <img
                            src={entry.profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.profile.full_name)}&background=random`}
                            alt={entry.profile.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                            <div className="font-medium text-gray-900">{entry.profile.full_name}</div>
                            <div className="text-xs text-gray-400">{entry.segments_completed} segments</div>
                        </div>
                        <div className="font-bold text-gray-900">
                            {entry.total_points} <span className="text-xs text-gray-400 font-normal">pts</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Points Breakdown by Stage */}
            {showBreakdown && segmentResults && segmentResults.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        Points Breakdown by Segment
                    </h4>
                    <div className="space-y-3">
                        {/* Group by stage */}
                        {Object.entries(
                            segmentResults.reduce((acc: any, seg: any) => {
                                const stageName = seg.stage?.name || 'Unknown Stage';
                                if (!acc[stageName]) acc[stageName] = [];
                                acc[stageName].push(seg);
                                return acc;
                            }, {})
                        ).map(([stageName, segments]: [string, any]) => (
                            <div key={stageName} className="bg-white rounded-lg p-3 border border-gray-100">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">{stageName}</div>
                                <div className="space-y-1">
                                    {segments.map((seg: any) => {
                                        const config = CATEGORY_CONFIG[seg.category as keyof typeof CATEGORY_CONFIG];
                                        return (
                                            <div key={seg.id} className="flex items-center gap-2 text-sm">
                                                <span
                                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                                                    style={{ backgroundColor: config?.color || '#6b7280' }}
                                                >
                                                    {seg.category?.toUpperCase() || 'CAT'}
                                                </span>
                                                <span className="flex-1 text-gray-700">{seg.name}</span>
                                                <span className="text-xs text-gray-400">
                                                    {seg.points_scale?.join('/') || '-'} pts
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
