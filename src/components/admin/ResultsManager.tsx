import React, { useState } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { useStages } from '../../hooks/useStages';
import { useGeneralClassification, useMountainClassification } from '../../hooks/useResults';
import { Loader2, Trophy, Mountain, Medal } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export const ResultsManager = () => {
    const { data: events, isLoading: isLoadingEvents } = useEvents();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const { data: stages } = useStages(selectedEventId || undefined);
    const { data: gcResults, isLoading: isLoadingGC } = useGeneralClassification(selectedEventId || undefined);
    const { data: mountainResults, isLoading: isLoadingMountain } = useMountainClassification(selectedEventId || undefined);

    // Only show mountain classification if there are stages with mountain segments
    const hasMountainSegments = stages?.some(s => s.mountain_segment_ids && s.mountain_segment_ids.length > 0);

    // Safe formatting for duration
    const formatDuration = (seconds: number) => {
        if (!seconds && seconds !== 0) return '-';
        try {
            return new Date(seconds * 1000).toISOString().substr(11, 8);
        } catch (e) {
            return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
        }
    };

    if (isLoadingEvents) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Resultados</h2>
                    <p className="text-gray-500 text-sm">Consulte as classificações e resultados dos eventos.</p>
                </div>
            </div>

            {/* Event Selector */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selecione o Evento</label>
                <select
                    className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                    value={selectedEventId || ''}
                    onChange={(e) => setSelectedEventId(e.target.value || null)}
                >
                    <option value="">-- Selecione um evento --</option>
                    {events?.map(evt => (
                        <option key={evt.id} value={evt.id}>{evt.title} ({formatDate(evt.date)})</option>
                    ))}
                </select>
            </div>

            {selectedEventId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* General Classification */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <h3 className="font-bold text-gray-800">Classificação Geral (GC)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            {/* Desktop Table */}
                            <table className="w-full text-left hidden md:table">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Pos</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Atleta</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Tempo</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Diff</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoadingGC ? (
                                        <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
                                    ) : gcResults?.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">Sem resultados disponíveis.</td></tr>
                                    ) : (
                                        gcResults?.map((res, idx) => (
                                            <tr key={res.user_id} className="hover:bg-yellow-50/30 transition">
                                                <td className="px-6 py-4 font-bold text-gray-700">
                                                    {idx === 0 ? <Medal className="w-4 h-4 text-yellow-500" /> : res.rank}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-sm text-gray-900">{res.profile.name}</div>
                                                    <div className="text-xs text-gray-400">{res.profile.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-600">
                                                    {formatDuration(res.total_time_seconds)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">
                                                    {res.gap_seconds > 0 ? `+${formatDuration(res.gap_seconds)}` : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-2 p-4 max-h-[400px] overflow-y-auto">
                                {isLoadingGC ? <Loader2 className="mx-auto animate-spin" /> :
                                    gcResults?.map((res, idx) => (
                                        <div key={res.user_id} className="bg-white p-3 rounded-xl border border-gray-100 text-sm flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="font-bold w-6 text-center text-gray-500">
                                                    {idx === 0 ? <Medal className="w-4 h-4 text-yellow-500 mx-auto" /> : `#${res.rank}`}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{res.profile.name}</div>
                                                    <div className="text-[10px] font-mono text-gray-500">{formatDuration(res.total_time_seconds)}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-mono text-gray-400">
                                                {res.gap_seconds > 0 ? `+${formatDuration(res.gap_seconds)}` : '-'}
                                            </div>
                                        </div>
                                    ))
                                }
                                {!isLoadingGC && gcResults?.length === 0 && (
                                    <div className="text-center text-gray-400 py-4">Sem resultados.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mountain Classification - Only show if has segments */}
                    {hasMountainSegments && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                                <Mountain className="w-5 h-5 text-red-500" />
                                <h3 className="font-bold text-gray-800">Prémio de Montanha</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Pos</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Atleta</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Pontos</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {isLoadingMountain ? (
                                            <tr><td colSpan={3} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
                                        ) : mountainResults?.length === 0 ? (
                                            <tr><td colSpan={3} className="p-8 text-center text-gray-400">Sem resultados de montanha.</td></tr>
                                        ) : (
                                            mountainResults?.map((res, idx) => (
                                                <tr key={res.user_id} className="hover:bg-red-50/30 transition">
                                                    <td className="px-6 py-4 font-bold text-gray-700">
                                                        {idx === 0 ? <Medal className="w-4 h-4 text-yellow-500" /> : res.rank}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-sm text-gray-900">{res.profile.name}</div>
                                                        <div className="text-xs text-gray-400">{res.profile.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-red-600">
                                                        {res.total_points} pts
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {!selectedEventId && (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 text-center">
                    <Trophy className="w-16 h-16 text-gray-200 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">Selecione um Evento</h3>
                    <p className="text-gray-500">Escolha um evento acima para ver as classificações.</p>
                </div>
            )}
        </div>
    );
};
