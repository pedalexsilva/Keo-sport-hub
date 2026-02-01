import React from 'react';
import { useStages } from '../hooks/useStages';
import { Calendar, MapPin, Flag } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface EventStagesCarouselProps {
    eventId: string;
}

export const EventStagesCarousel: React.FC<EventStagesCarouselProps> = ({ eventId }) => {
    const { data: stages, isLoading } = useStages(eventId);

    if (isLoading) return <div className="h-24 flex items-center justify-center text-xs text-gray-400">A carregar etapas...</div>;

    if (!stages || stages.length === 0) return null;

    return (
        <div className="mt-6 mb-2">
            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3 flex items-center gap-2">
                <Flag className="h-3 w-3 text-[#009CDE]" />
                Etapas ({stages.length})
            </h4>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-1 px-1 snap-x">
                {stages.map((stage) => (
                    <div
                        key={stage.id}
                        className="flex-shrink-0 w-64 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition snap-center group"
                    >
                        <div className="h-32 w-full bg-gray-100 relative overflow-hidden">
                            {stage.image_url ? (
                                <img
                                    src={stage.image_url}
                                    alt={stage.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                    <Flag className="w-8 h-8 text-gray-300" />
                                </div>
                            )}
                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-gray-700 shadow-sm">
                                #{stage.stage_order}
                            </div>
                        </div>

                        <div className="p-3">
                            <h5 className="font-bold text-gray-800 text-sm mb-1 truncate" title={stage.name}>{stage.name}</h5>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(stage.date)}
                                </span>
                                {stage.mountain_segment_ids?.length > 0 && (
                                    <span className="flex items-center gap-1" title={`${stage.mountain_segment_ids.length} segmentos`}>
                                        <MapPin className="w-3 h-3" />
                                        {stage.mountain_segment_ids.length}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
