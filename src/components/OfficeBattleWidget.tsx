import React from 'react';
import { Trophy } from 'lucide-react';

const OFFICE_BATTLE = {
    office1: { name: "Porto", points: 15400, color: "bg-[#009CDE]" },
    office2: { name: "Lisboa", points: 14200, color: "bg-green-500" },
    totalTarget: 40000
};

const OfficeBattleWidget: React.FC = () => {
    const p1 = (OFFICE_BATTLE.office1.points / OFFICE_BATTLE.totalTarget) * 100;
    const p2 = (OFFICE_BATTLE.office2.points / OFFICE_BATTLE.totalTarget) * 100;

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-bold text-[#002D72] text-sm">Office Battle</span>
                </div>
                <span className="text-xs font-bold text-gray-400">March</span>
            </div>
            <div className="space-y-3 relative z-10">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-gray-700">{OFFICE_BATTLE.office1.name}</span>
                        <span className="text-[#009CDE] font-bold">{OFFICE_BATTLE.office1.points.toLocaleString()} pts</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${OFFICE_BATTLE.office1.color}`} style={{ width: `${p1}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-gray-700">{OFFICE_BATTLE.office2.name}</span>
                        <span className="text-green-600 font-bold">{OFFICE_BATTLE.office2.points.toLocaleString()} pts</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${OFFICE_BATTLE.office2.color}`} style={{ width: `${p2}%` }}></div>
                    </div>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -z-0"></div>
        </div>
    );
};

export default OfficeBattleWidget;
