import React, { useState } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { useGeneralClassification, useMountainClassification } from '../../hooks/useResults';
import { Trophy, Timer, Mountain, Loader2 } from 'lucide-react';

export const ResultsManager = () => {
    const { data: events, isLoading: eventsLoading } = useEvents();
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'gc' | 'mountain'>('gc');

    // Auto-select first event
    React.useEffect(() => {
        if (events && events.length > 0 && !selectedEventId) {
            setSelectedEventId(events[0].id);
        }
    }, [events]);

    const { data: gcData, isLoading: gcLoading } = useGeneralClassification(selectedEventId);
    const { data: mountainData, isLoading: mountainLoading } = useMountainClassification(selectedEventId);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    if (eventsLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-[#002D72]" /></div>;

    return (
        <div className="p-8 animate-fade-in h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Classificações</h2>
                    <p className="text-gray-500 text-sm">Consulte os resultados de GC e Montanha.</p>
                </div>
                <div>
                    <select
                        className="p-3 bg-white border border-gray-200 rounded-xl font-bold text-[#002D72] outline-none shadow-sm"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                    >
                        {events?.map(e => (
                            <option key={e.id} value={e.id}>{e.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedEventId && (
                <div className="flex gap-4 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('gc')}
                        className={`pb-4 px-4 font-bold flex items-center gap-2 transition ${activeTab === 'gc' ? 'text-[#002D72] border-b-2 border-[#002D72]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Timer className="w-5 h-5" /> Classificação Geral (GC)
                    </button>
                    <button
                        onClick={() => setActiveTab('mountain')}
                        className={`pb-4 px-4 font-bold flex items-center gap-2 transition ${activeTab === 'mountain' ? 'text-[#002D72] border-b-2 border-[#002D72]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Mountain className="w-5 h-5" /> Prémio de Montanha
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 overflow-y-auto">
                {activeTab === 'gc' ? (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase w-16">Pos</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Atleta</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Tempo Total</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Diferença</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {gcLoading ? <tr><td colSpan={4} className="p-8 text-center">A carregar...</td></tr> : gcData?.map((row, idx) => (
                                <tr key={row.user_id} className="hover:bg-blue-50/50">
                                    <td className="px-6 py-4 font-bold text-gray-800">{idx + 1}</td>
                                    <td className="px-6 py-4 font-bold text-[#002D72]">{row.profile.name}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-600">{formatTime(row.total_time_seconds)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-red-400 text-sm">
                                        {idx === 0 ? '-' : `+ ${formatTime(row.total_time_seconds - (gcData[0]?.total_time_seconds || 0))}`}
                                    </td>
                                </tr>
                            ))}
                            {gcData?.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Sem resultados disponíveis.</td></tr>}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase w-16">Pos</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Atleta</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Pontos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {mountainLoading ? <tr><td colSpan={3} className="p-8 text-center">A carregar...</td></tr> : mountainData?.map((row, idx) => (
                                <tr key={row.user_id} className="hover:bg-blue-50/50">
                                    <td className="px-6 py-4 font-bold text-gray-800">{idx + 1}</td>
                                    <td className="px-6 py-4 font-bold text-[#002D72]">{row.profile.name}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-800">{row.total_points} pts</td>
                                </tr>
                            ))}
                            {mountainData?.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-400">Sem resultados disponíveis.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
