import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Save, Send, AlertTriangle, CheckCircle, Clock, Mountain, ExternalLink } from 'lucide-react';

interface ResultsEditorProps {
    stageId: string;
    onClose: () => void;
}

interface ResultRow {
    id: string; // The stage_result PK
    user_id: string;
    stage_id: string;
    elapsed_time_seconds: number;
    mountain_points: number;
    official_time_seconds: number | null;
    official_mountain_points: number | null;
    status: 'pending' | 'official' | 'dq';
    strava_activity_id: string;
    profile: {
        full_name: string;
        email: string;
    };
}

export const ResultsEditor = ({ stageId, onClose }: ResultsEditorProps) => {
    const [results, setResults] = useState<ResultRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Data
    useEffect(() => {
        loadResults();
    }, [stageId]);

    const loadResults = async () => {
        setIsLoading(true);
        try {
            // 1. Get Event ID from Stage
            const { data: stageData, error: stageError } = await supabase
                .from('event_stages')
                .select('event_id')
                .eq('id', stageId)
                .single();

            if (stageError) throw stageError;
            const eventId = stageData.event_id;

            // 2. Fetch all event participants
            const { data: participants, error: partError } = await supabase
                .from('event_participants')
                .select('user_id')
                .eq('event_id', eventId);

            if (partError) throw partError;

            // 3. Fetch existing stage results
            const { data: distinctResults, error: resError } = await supabase
                .from('stage_results')
                .select('*')
                .eq('stage_id', stageId);

            if (resError) throw resError;

            // 4. Fetch profiles for ALL participants
            const allUserIds = Array.from(new Set([
                ...(participants?.map(p => p.user_id) || []),
                ...(distinctResults?.map(r => r.user_id) || [])
            ]));

            if (allUserIds.length === 0) {
                setResults([]);
                setIsLoading(false);
                return;
            }

            const { data: profiles, error: profError } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', allUserIds);

            if (profError) throw profError;

            const profileMap = new Map(profiles?.map(p => [p.id, p]));
            const resultsMap = new Map(distinctResults?.map(r => [r.user_id, r]));

            // 5. Merge and Initialize
            // We iterate over ALL User IDs found
            const initialized: ResultRow[] = allUserIds.map((userId) => {
                const existingResult = resultsMap.get(userId);
                const profile = profileMap.get(userId);

                if (existingResult) {
                    // Existing result
                    return {
                        ...existingResult,
                        official_time_seconds: existingResult.official_time_seconds ?? existingResult.elapsed_time_seconds,
                        official_mountain_points: existingResult.official_mountain_points ?? existingResult.mountain_points,
                        status: existingResult.status,
                        profile: {
                            full_name: profile?.full_name || 'Unknown',
                            email: profile?.email || ''
                        }
                    };
                } else {
                    // No result yet - Create placeholder
                    return {
                        id: `temp_${userId}`, // Temporary ID
                        user_id: userId,
                        stage_id: stageId,
                        elapsed_time_seconds: 0,
                        mountain_points: 0,
                        official_time_seconds: 0,
                        official_mountain_points: 0,
                        status: 'pending',
                        strava_activity_id: '',
                        profile: {
                            full_name: profile?.full_name || 'Unknown',
                            email: profile?.email || ''
                        }
                    };
                }
            });

            // Sort: Official ones first, then by time (ignoring 0s usually, but let's just put completed ones on top)
            initialized.sort((a, b) => {
                const timeA = a.official_time_seconds || 999999;
                const timeB = b.official_time_seconds || 999999;
                return timeA - timeB;
            });

            setResults(initialized);

        } catch (error: any) {
            console.error(error);
            alert("Error loading results: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = (id: string, field: keyof ResultRow, value: any) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "00:00:00";
        return new Date(seconds * 1000).toISOString().substr(11, 8);
    };

    const parseTime = (timeStr: string) => {
        // HH:MM:SS
        const parts = timeStr.split(':').map(Number);
        if (parts.length !== 3) return 0;
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    };

    const handlePublish = async () => {
        if (!confirm("Are you sure? This will make the results OFFICIAL and update the general classification.")) return;

        setIsSaving(true);
        try {
            // A. Separate existing vs new results
            const newResults = results.filter(r => r.id.toString().startsWith('temp_'));
            const existingResults = results.filter(r => !r.id.toString().startsWith('temp_'));

            let processedNewIds: { result_id: string; official_time_seconds: number | null; mountain_points: number | null; status: string }[] = [];

            // B. Insert new records if any
            if (newResults.length > 0) {
                const toInsert = newResults.map(r => ({
                    stage_id: stageId,
                    user_id: r.user_id,
                    elapsed_time_seconds: r.official_time_seconds || 0, // Default for manual
                    official_time_seconds: r.official_time_seconds,
                    mountain_points: 0,
                    official_mountain_points: r.official_mountain_points,
                    status: 'official', // Create as official directly
                    strava_activity_id: null
                }));

                const { data: inserted, error: insertError } = await supabase
                    .from('stage_results')
                    .insert(toInsert)
                    .select();

                if (insertError) throw insertError;

                processedNewIds = inserted.map(r => ({
                    result_id: r.id,
                    official_time_seconds: r.official_time_seconds,
                    mountain_points: r.official_mountain_points, // Mapped to official in payload logic below? payload expects 'mountain_points' as property name for official points
                    status: 'official'
                }));
            }

            // C. Prepare payload for finalizer (merging both)
            const payloadResults = [
                ...existingResults.map(r => ({
                    result_id: r.id,
                    official_time_seconds: r.official_time_seconds,
                    mountain_points: r.official_mountain_points,
                    status: 'official'
                })),
                ...processedNewIds.map(r => ({
                    result_id: r.result_id,
                    official_time_seconds: r.official_time_seconds,
                    mountain_points: r.mountain_points,
                    status: 'official'
                }))
            ];

            const payload = {
                stage_id: stageId,
                results: payloadResults
            };

            const { data, error } = await supabase.functions.invoke('finalize-stage-results', {
                body: payload
            });

            if (error) throw error;

            alert("Results published successfully! 🏆");
            onClose();

        } catch (error: any) {
            console.error(error);
            alert("Error publishing: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

                <div className="p-6 md:p-8 bg-gradient-to-r from-[#002D72] via-[#003580] to-[#002D72] text-white flex justify-between items-center rounded-t-3xl border-b border-[#002D72]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Save className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                                Results Editor
                            </h3>
                            <p className="text-blue-100 text-sm font-medium hidden md:block">Validate times and publish official classification</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={isSaving}
                            className="px-5 py-2.5 bg-[#009CDE] text-white rounded-xl font-bold hover:bg-[#008bc7] hover:shadow-lg shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span className="hidden md:inline">Publish Results</span>
                            <span className="md:hidden">Publish</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-50 p-4">
                    {/* Desktop Table Header */}
                    <div className="hidden md:grid grid-cols-7 gap-4 p-4 bg-gray-100/80 rounded-t-xl font-bold text-xs text-gray-500 uppercase sticky top-0 z-10 backdrop-blur-sm border-b border-gray-200">
                        <div className="col-span-2">Athlete</div>
                        <div className="col-span-1">Strava</div>
                        <div className="col-span-1">Original Time</div>
                        <div className="col-span-1 bg-blue-50/50 -mx-2 px-2 rounded">Official Time</div>
                        <div className="col-span-1 text-center">Mountain Pts</div>
                        <div className="col-span-1 text-center">Status</div>
                    </div>

                    <div className="space-y-4 md:space-y-1">
                        {results.map((r) => (
                            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-2 md:grid md:grid-cols-7 md:gap-4 md:items-center hover:border-blue-300 transition group">

                                {/* Mobile Header: Name & Status */}
                                <div className="flex justify-between items-start md:col-span-2 mb-4 md:mb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-400 md:hidden">
                                            {r.profile?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{r.profile?.full_name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-400">{r.profile?.email}</div>
                                        </div>
                                    </div>
                                    <div className="md:hidden">
                                        {r.status === 'official' ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <AlertTriangle className="w-5 h-5 text-orange-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Strava Link */}
                                <div className="md:col-span-1 text-sm mb-3 md:mb-0">
                                    <a
                                        href={`https://www.strava.com/activities/${r.strava_activity_id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition"
                                    >
                                        <ExternalLink className="w-3 h-3" /> <span className="md:hidden">View on Strava</span> <span className="hidden md:inline">View</span>
                                    </a>
                                </div>

                                {/* Original Time */}
                                <div className="md:col-span-1 flex justify-between md:block mb-1 md:mb-0 bg-gray-50 md:bg-transparent p-2 md:p-0 rounded">
                                    <span className="text-xs font-bold text-gray-400 uppercase md:hidden">Original</span>
                                    <span className="font-mono text-gray-500 text-sm">{formatTime(r.elapsed_time_seconds)}</span>
                                </div>

                                {/* Official Time Input */}
                                <div className="md:col-span-1 bg-blue-50/50 -mx-2 px-2 py-2 md:py-1 rounded flex justify-between md:block items-center mb-1 md:mb-0">
                                    <span className="text-xs font-bold text-blue-800 uppercase md:hidden">Official</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            className="w-full md:w-24 p-2 md:p-1.5 border border-blue-200 rounded text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left bg-white"
                                            defaultValue={formatTime(r.official_time_seconds || 0)}
                                            key={r.id}
                                            onBlur={(e) => {
                                                const val = parseTime(e.target.value);
                                                if (val > 0) handleUpdate(r.id, 'official_time_seconds', val);
                                                else e.target.value = formatTime(r.official_time_seconds || 0);
                                            }}
                                        />
                                        <Clock className="w-4 h-4 text-blue-300 hidden md:block" />
                                    </div>
                                </div>

                                {/* Mountain Points Input */}
                                <div className="md:col-span-1 flex justify-between md:block items-center mb-1 md:mb-0 bg-gray-50 md:bg-transparent p-2 md:p-0 rounded">
                                    <span className="text-xs font-bold text-gray-400 uppercase md:hidden">Mountain ({r.mountain_points})</span>
                                    <div className="flex items-center gap-2 justify-end md:justify-center">
                                        <input
                                            type="number"
                                            className="w-16 p-1.5 border border-gray-200 rounded text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none text-center"
                                            value={r.official_mountain_points || 0}
                                            onChange={(e) => handleUpdate(r.id, 'official_mountain_points', parseInt(e.target.value))}
                                        />
                                        <Mountain className="w-4 h-4 text-gray-300 hidden md:block" />
                                    </div>
                                </div>

                                {/* PC Status */}
                                <div className="md:col-span-1 text-center hidden md:block">
                                    {r.status === 'official' ? (
                                        <div className="flex justify-center"><CheckCircle className="w-5 h-5 text-green-500" /></div>
                                    ) : (
                                        <div className="flex justify-center"><AlertTriangle className="w-5 h-5 text-orange-300 opacity-50" /></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {results.length === 0 && (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                            <Clock className="w-12 h-12 mb-4 opacity-20" />
                            <p>No results yet.</p>
                            <p className="text-xs mt-2">Sync with Strava first.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
