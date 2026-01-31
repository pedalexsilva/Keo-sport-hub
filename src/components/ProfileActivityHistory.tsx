import React from 'react';
import { Activity, Calendar, Clock, MapPin } from 'lucide-react';

// Mock data for now, ideally fetched from backend
const MOCK_ACTIVITIES = [
    { id: 1, type: 'Run', distance: '5.2 km', duration: '28m', date: 'Hoje', location: 'Porto' },
    { id: 2, type: 'Ride', distance: '24.5 km', duration: '1h 15m', date: 'Ontem', location: 'Matosinhos' },
    { id: 3, type: 'Run', distance: '8.0 km', duration: '45m', date: '12 Out', location: 'Gaia' },
];

const ProfileActivityHistory: React.FC = () => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#009CDE]" />
                Histórico Recente
            </h3>
            <div className="space-y-4">
                {MOCK_ACTIVITIES.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-2 rounded-lg text-[#FC4C02]">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{activity.type}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {activity.date}</span>
                                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {activity.duration}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-[#002D72]">{activity.distance}</p>
                            <p className="text-xs text-gray-400 flex items-center justify-end gap-1">
                                <MapPin className="w-3 h-3" /> {activity.location}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-4 text-sm text-[#009CDE] font-bold hover:underline">
                Ver Todo o Histórico
            </button>
        </div>
    );
};

export default ProfileActivityHistory;
