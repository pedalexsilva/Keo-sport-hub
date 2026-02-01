import React, { useState } from 'react';
import { useStages, useCreateStage, useDeleteStage, useProcessStage } from '../../hooks/useStages';
import { uploadEventMedia } from '../../hooks/useEvents';
import { Calendar, Plus, Trash2, Play, CheckCircle, Loader2, MapPin, ImageIcon } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

interface StageManagerProps {
    eventId: string;
    onClose: () => void;
}

export const StageManager = ({ eventId, onClose }: StageManagerProps) => {
    const { data: stages, isLoading } = useStages(eventId);
    const createStage = useCreateStage();
    const deleteStage = useDeleteStage();
    const processStage = useProcessStage();

    const [isCreating, setIsCreating] = useState(false);
    const [newStage, setNewStage] = useState({
        name: '',
        date: '',
        stage_order: 1,
        mountain_segment_ids: '',
        image_url: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        let imageUrl = newStage.image_url;
        if (imageFile) {
            try {
                imageUrl = await uploadEventMedia(imageFile);
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("Erro ao carregar imagem.");
                return;
            }
        }

        await createStage.mutateAsync({
            event_id: eventId,
            name: newStage.name,
            description: '',
            date: newStage.date,
            stage_order: newStage.stage_order,
            mountain_segment_ids: newStage.mountain_segment_ids.split(',').map(s => s.trim()).filter(Boolean),
            image_url: imageUrl
        } as any);
        setIsCreating(false);
        setNewStage({ name: '', date: '', stage_order: (stages?.length || 0) + 2, mountain_segment_ids: '', image_url: '' });
        setImageFile(null);
    };

    const handleProcess = async (stageId: string) => {
        if (!confirm("Isto irá processar os resultados desta etapa via Strava API. Continuar?")) return;
        setProcessingId(stageId);
        try {
            await processStage.mutateAsync(stageId);
            alert("Resultados processados com sucesso!");
        } catch (error: any) {
            alert("Erro: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#002D72] text-white rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold">Gerir Etapas</h3>
                        <p className="text-blue-200 text-sm">Configure as etapas e classificações.</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition">
                        Fechar
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="w-10 h-10 animate-spin text-[#002D72] mb-4" />
                            <p className="text-gray-500 font-medium">A carregar etapas...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stages?.map((stage) => (
                                <div key={stage.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="bg-[#009CDE] text-white text-xs font-bold px-2 py-1 rounded">Etapa {stage.stage_order}</span>
                                            <h4 className="font-bold text-gray-800 text-lg">{stage.name}</h4>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(stage.date)}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {stage.mountain_segment_ids?.length || 0} Segmentos de Montanha</span>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-400 font-mono">
                                            Segments: {stage.mountain_segment_ids?.join(', ') || 'Nenhum'}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleProcess(stage.id)}
                                            disabled={!!processingId}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-bold hover:bg-green-100 border border-green-200 transition"
                                        >
                                            {processingId === stage.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                            Processar Resultados
                                        </button>
                                        <button
                                            onClick={() => { if (confirm('Apagar etapa?')) deleteStage.mutate(stage.id) }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {stages?.length === 0 && !isCreating && (
                                <div className="text-center py-12 text-gray-400">
                                    <p>Este evento ainda não tem etapas.</p>
                                </div>
                            )}

                            {isCreating ? (
                                <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border-2 border-[#009CDE] shadow-md animate-fade-in">
                                    <h4 className="font-bold text-gray-800 mb-4">Nova Etapa</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                                            <input required className="w-full p-2 border rounded-lg" value={newStage.name} onChange={e => setNewStage({ ...newStage, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                                            <input type="date" required className="w-full p-2 border rounded-lg" value={newStage.date} onChange={e => setNewStage({ ...newStage, date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Ordem</label>
                                            <input type="number" required className="w-full p-2 border rounded-lg" value={newStage.stage_order} onChange={e => setNewStage({ ...newStage, stage_order: parseInt(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Segment IDs (Virgula separada)</label>
                                            <input className="w-full p-2 border rounded-lg" placeholder="123456, 789012" value={newStage.mountain_segment_ids} onChange={e => setNewStage({ ...newStage, mountain_segment_ids: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Imagem da Etapa (Opcional)</label>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex-1">
                                                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer text-center">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={e => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                setImageFile(e.target.files[0]);
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                        <ImageIcon className="w-8 h-8" />
                                                        <span className="text-sm">Clique ou arraste para carregar imagem</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {(imageFile || newStage.image_url) && (
                                                <div className="w-32 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0 relative group">
                                                    <img
                                                        src={imageFile ? URL.createObjectURL(imageFile) : newStage.image_url}
                                                        className="w-full h-full object-cover"
                                                        alt="Preview"
                                                    />
                                                    {(imageFile || newStage.image_url) && (
                                                        <div
                                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                                            onClick={() => {
                                                                setImageFile(null);
                                                                setNewStage({ ...newStage, image_url: '' });
                                                            }}
                                                        >
                                                            <Trash2 className="w-6 h-6 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                        <button type="submit" className="px-6 py-2 bg-[#009CDE] text-white font-bold rounded-lg hover:bg-blue-600">Guardar Etapa</button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-[#009CDE] hover:text-[#009CDE] hover:bg-blue-50 transition flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" /> Adicionar Etapa
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

