import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    useStageSegments,
    StageSegment,
    SegmentResult,
    CATEGORY_CONFIG,
    formatSegmentTime,
    getPointsForPosition
} from '../../hooks/useSegments';
import {
    Loader2,
    Save,
    Send,
    AlertTriangle,
    CheckCircle,
    Mountain,
    ExternalLink,
    Trophy,
    ChevronDown,
    ChevronRight
} from 'lucide-react';

interface SegmentResultsEditorProps {
    stageId: string;
    onClose: () => void;
}

interface GroupedResults {
    segment: StageSegment;
    results: SegmentResult[];
}

export const SegmentResultsEditor = ({ stageId, onClose }: SegmentResultsEditorProps) => {
    const { data: segments, isLoading: isLoadingSegments } = useStageSegments(stageId);
    const [groupedResults, setGroupedResults] = useState<GroupedResults[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

    // Load results for all segments
    useEffect(() => {
        if (segments && segments.length > 0) {
            loadResults();
        } else if (segments) {
            setIsLoading(false);
        }
    }, [segments]);

    const loadResults = async () => {
        if (!segments) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('segment_results')
                .select(`
                    *,
                    profile:profiles!user_id(full_name, avatar_url, email)
                `)
                .eq('stage_id', stageId)
                .order('elapsed_time_seconds', { ascending: true });

            if (error) throw error;

            // Group results by segment
            const grouped: GroupedResults[] = segments.map(segment => ({
                segment,
                results: (data || [])
                    .filter((r: any) => r.segment_id === segment.id)
                    .map((r: any, idx: number) => ({
                        ...r,
                        position: idx + 1,
                        points_earned: r.points_earned ?? getPointsForPosition(idx + 1, segment.points_scale)
                    }))
            }));

            setGroupedResults(grouped);
            // Expand first segment by default
            if (segments.length > 0) {
                setExpandedSegments(new Set([segments[0].id]));
            }
        } catch (error) {
            console.error(error);
            alert('Error loading results');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSegment = (segmentId: string) => {
        setExpandedSegments(prev => {
            const next = new Set(prev);
            if (next.has(segmentId)) {
                next.delete(segmentId);
            } else {
                next.add(segmentId);
            }
            return next;
        });
    };

    const handleResultUpdate = (
        segmentId: string,
        resultId: string,
        field: keyof SegmentResult,
        value: any
    ) => {
        setGroupedResults(prev => prev.map(group => {
            if (group.segment.id !== segmentId) return group;
            return {
                ...group,
                results: group.results.map(r =>
                    r.id === resultId ? { ...r, [field]: value } : r
                )
            };
        }));
    };

    const handlePublishSegment = async (segmentId: string) => {
        if (!confirm('Mark all results in this segment as OFFICIAL?')) return;

        setIsSaving(true);
        try {
            const group = groupedResults.find(g => g.segment.id === segmentId);
            if (!group) return;

            // Update all results to official with calculated positions/points
            for (let i = 0; i < group.results.length; i++) {
                const result = group.results[i];
                const points = getPointsForPosition(i + 1, group.segment.points_scale);

                const { error } = await supabase
                    .from('segment_results')
                    .update({
                        position: i + 1,
                        points_earned: points,
                        status: 'official'
                    })
                    .eq('id', result.id);

                if (error) throw error;
            }

            // Refresh data
            await loadResults();
            alert('Segment results published! 🏆');
        } catch (error: any) {
            console.error(error);
            alert('Error: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublishAll = async () => {
        if (!confirm('Publish ALL segment results as OFFICIAL?\n\nThis will update the KOM Classification.')) return;

        setIsSaving(true);
        try {
            for (const group of groupedResults) {
                for (let i = 0; i < group.results.length; i++) {
                    const result = group.results[i];
                    const points = getPointsForPosition(i + 1, group.segment.points_scale);

                    const { error } = await supabase
                        .from('segment_results')
                        .update({
                            position: i + 1,
                            points_earned: points,
                            status: 'official'
                        })
                        .eq('id', result.id);

                    if (error) throw error;
                }
            }

            alert('All segment results published! 🏆');
            onClose();
        } catch (error: any) {
            console.error(error);
            alert('Error: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const totalPending = groupedResults.reduce(
        (sum, g) => sum + g.results.filter(r => r.status === 'pending').length,
        0
    );

    if (isLoadingSegments || isLoading) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white p-12 rounded-2xl text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-4" />
                    <p className="text-gray-500">Loading segment results...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-2xl">
                    <div>
                        <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                            <Mountain className="w-5 h-5" />
                            KOM Results Editor
                        </h3>
                        <p className="text-orange-100 text-sm">
                            {segments?.length || 0} segments • {totalPending} pending results
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg font-bold text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePublishAll}
                            disabled={isSaving || totalPending === 0}
                            className="px-4 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 shadow-md flex items-center gap-2 disabled:opacity-50 text-sm"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Publish All
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-50 p-4">
                    {segments?.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                            <Mountain className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No segments configured</p>
                            <p className="text-sm text-gray-400">Add segments first, then sync Strava.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {groupedResults.map(({ segment, results }) => {
                                const config = CATEGORY_CONFIG[segment.category];
                                const isExpanded = expandedSegments.has(segment.id);
                                const pendingCount = results.filter(r => r.status === 'pending').length;
                                const officialCount = results.filter(r => r.status === 'official').length;

                                return (
                                    <div
                                        key={segment.id}
                                        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                                    >
                                        {/* Segment Header */}
                                        <button
                                            onClick={() => toggleSegment(segment.id)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                )}
                                                <div
                                                    className="px-2 py-0.5 rounded text-xs font-bold text-white"
                                                    style={{ backgroundColor: config.color }}
                                                >
                                                    {segment.category.toUpperCase()}
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-bold text-gray-900">{segment.name}</h4>
                                                    <p className="text-xs text-gray-500">
                                                        Points: {segment.points_scale.join(' / ')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {pendingCount > 0 && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {pendingCount} pending
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {officialCount} official
                                                </span>
                                            </div>
                                        </button>

                                        {/* Segment Results Table */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100">
                                                {results.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-400">
                                                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                        <p>No results yet. Sync Strava first.</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-gray-50 border-b">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Pos</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Athlete</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Time</th>
                                                                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Points</th>
                                                                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                                                                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Strava</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {results.map((result, idx) => (
                                                                        <tr
                                                                            key={result.id}
                                                                            className={`hover:bg-orange-50/30 transition ${idx < 4 ? 'bg-yellow-50/30' : ''}`}
                                                                        >
                                                                            <td className="px-4 py-3">
                                                                                <span className={`font-bold ${idx === 0 ? 'text-yellow-600' : idx === 1 ? 'text-gray-500' : idx === 2 ? 'text-orange-700' : 'text-gray-400'}`}>
                                                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                <div className="font-medium text-gray-900">
                                                                                    {result.profile?.full_name || 'Unknown'}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-3 font-mono text-gray-600">
                                                                                {formatSegmentTime(result.elapsed_time_seconds)}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center">
                                                                                <span className={`font-bold ${result.points_earned > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                                                                                    {result.points_earned || 0}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center">
                                                                                {result.status === 'official' ? (
                                                                                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                                                                ) : (
                                                                                    <AlertTriangle className="w-4 h-4 text-orange-400 mx-auto" />
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center">
                                                                                {result.strava_effort_id && (
                                                                                    <a
                                                                                        href={`https://www.strava.com/segment_efforts/${result.strava_effort_id}`}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="text-orange-500 hover:text-orange-600"
                                                                                    >
                                                                                        <ExternalLink className="w-4 h-4 mx-auto" />
                                                                                    </a>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* Publish Segment Button */}
                                                        {pendingCount > 0 && (
                                                            <div className="p-3 bg-gray-50 border-t flex justify-end">
                                                                <button
                                                                    onClick={() => handlePublishSegment(segment.id)}
                                                                    disabled={isSaving}
                                                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 flex items-center gap-2 disabled:opacity-50"
                                                                >
                                                                    <Send className="w-4 h-4" />
                                                                    Publish Segment
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
