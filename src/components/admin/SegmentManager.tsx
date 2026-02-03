import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    useStageSegments,
    useCreateSegment,
    useUpdateSegment,
    useDeleteSegment,
    StageSegment,
    SegmentCategory,
    CATEGORY_CONFIG,
    formatDistance,
    formatGradient
} from '../../hooks/useSegments';
import {
    Mountain,
    Plus,
    Trash2,
    Pencil,
    Loader2,
    X,
    Save,
    Trophy,
    ExternalLink,
    Link2,
    Sparkles
} from 'lucide-react';

interface SegmentManagerProps {
    stageId: string;
    stageName?: string;
    onClose: () => void;
}

export const SegmentManager = ({ stageId, stageName, onClose }: SegmentManagerProps) => {
    const { data: segments, isLoading } = useStageSegments(stageId);
    const createSegment = useCreateSegment();
    const updateSegment = useUpdateSegment();
    const deleteSegment = useDeleteSegment();

    const [isEditing, setIsEditing] = useState(false);
    const [editingSegment, setEditingSegment] = useState<Partial<StageSegment> | null>(null);
    const [stravaUrl, setStravaUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        strava_segment_id: '',
        distance_meters: '',
        avg_grade_percent: '',
        category: 'cat4' as SegmentCategory,
        points_scale: [5, 3, 2, 1] as number[]
    });

    const resetForm = () => {
        setForm({
            name: '',
            strava_segment_id: '',
            distance_meters: '',
            avg_grade_percent: '',
            category: 'cat4',
            points_scale: [5, 3, 2, 1]
        });
        setStravaUrl('');
        setEditingSegment(null);
        setIsEditing(false);
    };

    // Parse Strava URL to extract segment ID
    const parseStravaUrl = (url: string): string | null => {
        // Handles: https://www.strava.com/segments/2745963
        // or just: 2745963
        const match = url.match(/segments\/(\d+)/);
        if (match) return match[1];
        // If it's just a number
        if (/^\d+$/.test(url.trim())) return url.trim();
        return null;
    };

    // Fetch segment details from Strava
    const fetchFromStrava = async () => {
        const segmentId = parseStravaUrl(stravaUrl);
        if (!segmentId) {
            alert('Invalid Strava URL. Use format: https://www.strava.com/segments/123456');
            return;
        }

        setIsFetching(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Please log in first');

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-strava-segment`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({ segment_id: segmentId })
                }
            );

            const result = await response.json();
            if (!result.success) {
                // Check if it's a Strava connection error
                if (result.error?.includes('Strava connection') || result.error?.includes('No Strava')) {
                    const connectStrava = confirm(
                        'Your account is not connected to Strava.\n\n' +
                        'Would you like to connect now? (You will be redirected to Strava)'
                    );
                    if (connectStrava) {
                        const { getStravaAuthUrl } = await import('../../features/strava/services/strava');
                        const currentUrl = window.location.pathname + window.location.search;
                        window.location.href = await getStravaAuthUrl(currentUrl);
                    }
                    return;
                }
                throw new Error(result.error);
            }

            const seg = result.segment;
            const category = seg.category as SegmentCategory;
            const defaultPoints = CATEGORY_CONFIG[category].points;

            setForm({
                name: seg.name,
                strava_segment_id: seg.id,
                distance_meters: seg.distance_meters?.toString() || '',
                avg_grade_percent: seg.avg_grade_percent?.toString() || '',
                category: category,
                points_scale: [...defaultPoints]
            });

            setStravaUrl('');
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsFetching(false);
        }
    };

    const handleCategoryChange = (category: SegmentCategory) => {
        const defaultPoints = CATEGORY_CONFIG[category].points;
        setForm(prev => ({
            ...prev,
            category,
            points_scale: [...defaultPoints]
        }));
    };

    const handlePointChange = (index: number, value: number) => {
        setForm(prev => {
            const newScale = [...prev.points_scale];
            newScale[index] = value;
            return { ...prev, points_scale: newScale };
        });
    };

    const handleEdit = (segment: StageSegment) => {
        setEditingSegment(segment);
        setForm({
            name: segment.name,
            strava_segment_id: segment.strava_segment_id,
            distance_meters: segment.distance_meters?.toString() || '',
            avg_grade_percent: segment.avg_grade_percent?.toString() || '',
            category: segment.category,
            points_scale: [...segment.points_scale]
        });
        setIsEditing(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const segmentData = {
            stage_id: stageId,
            name: form.name,
            strava_segment_id: form.strava_segment_id,
            distance_meters: form.distance_meters ? parseFloat(form.distance_meters) : undefined,
            avg_grade_percent: form.avg_grade_percent ? parseFloat(form.avg_grade_percent) : undefined,
            category: form.category,
            points_scale: form.points_scale,
            segment_order: (segments?.length || 0) + 1
        };

        try {
            if (editingSegment?.id) {
                await updateSegment.mutateAsync({ ...segmentData, id: editingSegment.id });
            } else {
                await createSegment.mutateAsync(segmentData as any);
            }
            resetForm();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this segment?')) return;
        try {
            await deleteSegment.mutateAsync(id);
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Mountain className="w-6 h-6" />
                            KOM Segments
                        </h3>
                        <p className="text-orange-100 text-sm">
                            {stageName || 'Stage'} • {segments?.length || 0} segment(s)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
                            <p className="text-gray-500">Loading segments...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Existing Segments */}
                            {segments?.map((segment, idx) => {
                                const config = CATEGORY_CONFIG[segment.category];
                                return (
                                    <div
                                        key={segment.id}
                                        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition"
                                    >
                                        <div className="flex items-stretch">
                                            {/* Category Badge */}
                                            <div
                                                className="w-16 flex items-center justify-center text-white font-bold text-sm"
                                                style={{ backgroundColor: config.color }}
                                            >
                                                {segment.category.toUpperCase()}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">
                                                            {idx + 1}. {segment.name}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                                                            <span>{formatDistance(segment.distance_meters)}</span>
                                                            <span>{formatGradient(segment.avg_grade_percent)} avg</span>
                                                            <a
                                                                href={`https://www.strava.com/segments/${segment.strava_segment_id}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-orange-500 hover:underline flex items-center gap-1"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                                Strava
                                                            </a>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleEdit(segment)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(segment.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Points Scale */}
                                                <div className="mt-3 flex items-center gap-2">
                                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                                    <div className="flex gap-1">
                                                        {segment.points_scale.map((pts, i) => (
                                                            <span
                                                                key={i}
                                                                className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono"
                                                                style={{
                                                                    backgroundColor: i === 0 ? '#fef9c3' : undefined,
                                                                    color: i === 0 ? '#854d0e' : undefined
                                                                }}
                                                            >
                                                                {i + 1}º: {pts}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Empty State */}
                            {segments?.length === 0 && !isEditing && (
                                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                                    <Mountain className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-medium">No segments configured</p>
                                    <p className="text-sm text-gray-400 mb-4">Add Strava segments for KOM classification</p>
                                </div>
                            )}

                            {/* Add/Edit Form */}
                            {isEditing ? (
                                <div className="bg-white rounded-xl border-2 border-orange-300 shadow-lg p-6 animate-in slide-in-from-bottom-2">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Mountain className="w-5 h-5 text-orange-500" />
                                        {editingSegment ? 'Edit Segment' : 'New Segment'}
                                    </h4>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Auto-fetch from Strava URL */}
                                        {!editingSegment && (
                                            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                                                <label className="block text-xs font-bold text-orange-600 uppercase mb-2 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    Auto-fill from Strava
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Paste Strava URL: https://www.strava.com/segments/2745963"
                                                            className="w-full pl-10 p-3 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                                            value={stravaUrl}
                                                            onChange={(e) => setStravaUrl(e.target.value)}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={fetchFromStrava}
                                                        disabled={!stravaUrl || isFetching}
                                                        className="px-4 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                                                    >
                                                        {isFetching ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Sparkles className="w-4 h-4" />
                                                        )}
                                                        Fetch
                                                    </button>
                                                </div>
                                                <p className="text-xs text-orange-500 mt-2">
                                                    Name, distance, grade and category will be filled automatically
                                                </p>
                                            </div>
                                        )}

                                        {/* Row 1: Name & Strava ID */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                    Segment Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g., Jebel Hafeet (ascent 1)"
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                                    value={form.name}
                                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                    Strava Segment ID *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g., 628341"
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                                    value={form.strava_segment_id}
                                                    onChange={(e) => setForm({ ...form, strava_segment_id: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Distance, Gradient, Category */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                    Distance (m)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="12100"
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                                    value={form.distance_meters}
                                                    onChange={(e) => setForm({ ...form, distance_meters: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                    Avg Grade (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="6.3"
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                                    value={form.avg_grade_percent}
                                                    onChange={(e) => setForm({ ...form, avg_grade_percent: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                    Category *
                                                </label>
                                                <select
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                                    value={form.category}
                                                    onChange={(e) => handleCategoryChange(e.target.value as SegmentCategory)}
                                                >
                                                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                                        <option key={key} value={key}>
                                                            {config.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Row 3: Points Scale */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                                Points Scale (1st to 4th place)
                                            </label>
                                            <div className="flex gap-3">
                                                {form.points_scale.map((pts, i) => (
                                                    <div key={i} className="flex-1">
                                                        <div className="text-center text-xs text-gray-400 mb-1">
                                                            {i + 1}º
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-mono focus:ring-2 focus:ring-orange-500 outline-none"
                                                            value={pts}
                                                            onChange={(e) => handlePointChange(i, parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-3 pt-4 border-t">
                                            <button
                                                type="button"
                                                onClick={resetForm}
                                                className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={createSegment.isPending || updateSegment.isPending}
                                                className="px-8 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 shadow-lg flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {(createSegment.isPending || updateSegment.isPending) ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Save className="w-4 h-4" />
                                                )}
                                                {editingSegment ? 'Save Changes' : 'Add Segment'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full py-5 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Segment
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
