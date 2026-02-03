import React, { useState } from 'react';
import { useStages, useCreateStage, useDeleteStage, useProcessStage, useUpdateStage } from '../../hooks/useStages';
import { useStageStats } from '../../hooks/useStageStats';
import { useStageSegments } from '../../hooks/useSegments';
import { uploadEventMedia } from '../../hooks/useEvents';
import { Calendar, Plus, Trash2, RefreshCw, Loader2, MapPin, ImageIcon, Pencil, Copy, AlertCircle, CheckCircle, Mountain, Save } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

import { ResultsEditor } from './ResultsEditor';
import { SegmentManager } from './SegmentManager';

interface StageManagerProps {
    eventId: string;
    onClose: () => void;
}

export const StageManager = ({ eventId, onClose }: StageManagerProps) => {
    const { data: stages, isLoading } = useStages(eventId);
    const { data: stats } = useStageStats(eventId);
    const createStage = useCreateStage();
    const deleteStage = useDeleteStage();
    const processStage = useProcessStage();
    const updateStage = useUpdateStage();

    const [isCreating, setIsCreating] = useState(false);
    const [newStage, setNewStage] = useState({
        name: '',
        date: '',
        stage_order: 1,
        image_url: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [editingStageId, setEditingStageId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedStageForResults, setSelectedStageForResults] = useState<string | null>(null);
    const [selectedStageForSegments, setSelectedStageForSegments] = useState<{ id: string; name: string } | null>(null);


    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        let imageUrl = newStage.image_url;
        if (imageFile) {
            try {
                imageUrl = await uploadEventMedia(imageFile);
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("Error uploading image.");
                return;
            }
        }

        const stageData = {
            event_id: eventId,
            name: newStage.name,
            description: '',
            date: newStage.date,
            stage_order: newStage.stage_order,
            image_url: imageUrl
        };

        if (editingStageId) {
            await updateStage.mutateAsync({ ...stageData, id: editingStageId } as any);
        } else {
            await createStage.mutateAsync(stageData as any);
        }
        setIsCreating(false);
        setEditingStageId(null);
        setNewStage({ name: '', date: '', stage_order: (stages?.length || 0) + 2, image_url: '' });
        setImageFile(null);
    };

    const handleProcess = async (stageId: string) => {
        if (!confirm("This will force a sync with Strava for all participants.\n\nNew results will be marked as 'Pending'. Continue?")) return;
        setProcessingId(stageId);
        try {
            const result = await processStage.mutateAsync(stageId);
            alert(`Sync complete!\n\n${result.message || 'Data updated.'}\n\nProcessed: ${result.processed}`);
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
                {/* Enhanced Header */}
                <div className="p-8 bg-gradient-to-r from-[#002D72] via-[#003580] to-[#002D72] text-white">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                <CheckCircle className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight mb-1">Race Control Center</h3>
                                <p className="text-blue-100 text-sm font-medium">Manage stages, sync Strava, and validate results</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-8 overflow-y-auto flex-1 bg-gradient-to-br from-gray-50 via-white to-gray-50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="w-12 h-12 animate-spin text-[#002D72] mb-4" />
                            <p className="text-gray-600 font-medium text-lg">Loading stages...</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {!isCreating && stages?.map((stage) => {
                                const stat = stats?.[stage.id] || { pending: 0, official: 0, dq: 0, total: 0 };
                                const needsReview = stat.pending > 0;
                                const totalResults = stat.pending + stat.official;
                                const completionRate = totalResults > 0 ? (stat.official / totalResults) * 100 : 0;

                                return (
                                    <div
                                        key={stage.id}
                                        className={`group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${needsReview
                                            ? 'border-orange-300 hover:border-orange-400'
                                            : 'border-gray-100 hover:border-[#009CDE]/30'
                                            }`}
                                    >
                                        {/* Stage Header */}
                                        <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`px-3 py-1.5 rounded-lg font-bold text-xs tracking-wider ${needsReview
                                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                                                        : 'bg-gradient-to-r from-[#002D72] to-[#003580] text-white shadow-md'
                                                        }`}>
                                                        STAGE {stage.stage_order}
                                                    </div>
                                                    {needsReview && (
                                                        <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-lg animate-pulse shadow-sm">
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            Review Required
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingStageId(stage.id);
                                                            setNewStage({
                                                                name: stage.name,
                                                                date: stage.date,
                                                                stage_order: stage.stage_order,
                                                                image_url: stage.image_url || ''
                                                            });
                                                            setIsCreating(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                                                        aria-label="Edit stage"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { if (confirm('Delete this stage?')) deleteStage.mutate(stage.id) }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                                                        aria-label="Delete stage"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-gray-900 text-xl mb-3 group-hover:text-[#002D72] transition-colors">
                                                {stage.name}
                                            </h4>

                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <span className="flex items-center gap-2 text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                                    <Calendar className="w-4 h-4 text-[#009CDE]" />
                                                    <span className="font-medium">{formatDate(stage.date)}</span>
                                                </span>
                                                <button
                                                    onClick={() => setSelectedStageForSegments({ id: stage.id, name: stage.name })}
                                                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-all duration-200 font-medium border border-orange-200"
                                                >
                                                    <Mountain className="w-4 h-4" />
                                                    Manage KOM Segments
                                                </button>
                                            </div>
                                        </div>

                                        {/* Stage Body - Statistics and Actions */}
                                        <div className="p-6">
                                            <div className="flex flex-col lg:flex-row gap-6">
                                                {/* Statistics Cards */}
                                                <div className="flex-1">
                                                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Results Status</h5>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {/* Pending Card */}
                                                        <div className={`relative overflow-hidden rounded-xl p-5 transition-all duration-300 ${needsReview
                                                            ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 shadow-lg scale-105'
                                                            : 'bg-gray-50 border-2 border-gray-200'
                                                            }`}>
                                                            <div className="relative z-10">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <AlertCircle className={`w-4 h-4 ${needsReview ? 'text-orange-600' : 'text-gray-400'}`} />
                                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pending</span>
                                                                </div>
                                                                <div className={`text-4xl font-bold mb-1 ${needsReview ? 'text-orange-600' : 'text-gray-400'}`}>
                                                                    {stat.pending}
                                                                </div>
                                                                {totalResults > 0 && (
                                                                    <div className="text-xs text-gray-500 font-medium">
                                                                        {((stat.pending / totalResults) * 100).toFixed(0)}% of total
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Official Card */}
                                                        <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 shadow-md">
                                                            <div className="relative z-10">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Official</span>
                                                                </div>
                                                                <div className="text-4xl font-bold text-green-600 mb-1">
                                                                    {stat.official}
                                                                </div>
                                                                {totalResults > 0 && (
                                                                    <div className="text-xs text-gray-600 font-medium">
                                                                        {completionRate.toFixed(0)}% verified
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    {totalResults > 0 && (
                                                        <div className="mt-4">
                                                            <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
                                                                <span>Validation Progress</span>
                                                                <span>{completionRate.toFixed(0)}%</span>
                                                            </div>
                                                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500 ease-out"
                                                                    style={{ width: `${completionRate}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="lg:w-64 flex flex-col gap-3">
                                                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Actions</h5>

                                                    <button
                                                        onClick={() => setSelectedStageForResults(stage.id)}
                                                        className="group relative w-full py-3.5 px-4 bg-gradient-to-r from-[#002D72] to-[#003580] text-white rounded-xl font-bold hover:from-[#003580] hover:to-[#002D72] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 hover:scale-105"
                                                    >
                                                        <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                        <span>Manage Results</span>
                                                        {needsReview && (
                                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => handleProcess(stage.id)}
                                                        disabled={!!processingId}
                                                        className="group w-full py-3.5 px-4 bg-white border-2 border-[#002D72] text-[#002D72] rounded-xl font-bold hover:bg-[#002D72] hover:text-white transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
                                                    >
                                                        {processingId === stage.id ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                                <span>Syncing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                                                <span>Sync Strava</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {!isCreating && (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="group w-full py-8 border-3 border-dashed border-gray-300 rounded-3xl text-gray-400 font-bold hover:border-[#009CDE] hover:text-[#009CDE] hover:bg-blue-50/50 transition-all duration-300 flex flex-col items-center justify-center gap-3 hover:scale-[1.01]"
                                >
                                    <div className="p-3 bg-gray-100 rounded-full group-hover:bg-[#009CDE]/10 transition-colors">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <span className="text-lg">Add New Stage</span>
                                </button>
                            )}

                            {isCreating && (
                                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ring-4 ring-blue-50">
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-[#009CDE]/10 text-[#009CDE] rounded-xl">
                                                {editingStageId ? <Pencil className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-xl">{editingStageId ? 'Edit Stage Details' : 'Create New Stage'}</h4>
                                                <p className="text-gray-500 text-sm">Configure the stage parameters and segments</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setIsCreating(false); setEditingStageId(null); }}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                        >
                                            <span className="sr-only">Close</span>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreate} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Stage Name</label>
                                                <div className="relative">
                                                    <input
                                                        required
                                                        className="w-full p-3.5 pl-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#009CDE]/20 focus:border-[#009CDE] transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                        placeholder="e.g. Jebel Jais Climb"
                                                        value={newStage.name}
                                                        onChange={e => setNewStage({ ...newStage, name: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Stage Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="date"
                                                        required
                                                        className="w-full p-3.5 pl-12 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#009CDE]/20 focus:border-[#009CDE] transition-all font-medium text-gray-900"
                                                        value={newStage.date}
                                                        onChange={e => setNewStage({ ...newStage, date: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Sequence Order</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">#</span>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="w-full p-3.5 pl-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#009CDE]/20 focus:border-[#009CDE] transition-all font-medium text-gray-900"
                                                        value={newStage.stage_order}
                                                        onChange={e => setNewStage({ ...newStage, stage_order: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => { setIsCreating(false); setEditingStageId(null); }}
                                                className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-8 py-3 bg-[#009CDE] text-white font-bold rounded-xl hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                                            >
                                                {editingStageId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                                {editingStageId ? 'Save Changes' : 'Create Stage'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>

            {selectedStageForResults && (
                <ResultsEditor
                    stageId={selectedStageForResults}
                    onClose={() => setSelectedStageForResults(null)}
                />
            )}

            {selectedStageForSegments && (
                <SegmentManager
                    stageId={selectedStageForSegments.id}
                    stageName={selectedStageForSegments.name}
                    onClose={() => setSelectedStageForSegments(null)}
                />
            )}
        </div>
    );
};
