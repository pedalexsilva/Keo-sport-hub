import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useStrava } from '../hooks/useStrava';

const SyncStravaButton: React.FC = () => {
    const { syncActivities, isSyncing, error } = useStrava();
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSync = async () => {
        const success = await syncActivities();
        if (success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                    ${isSyncing ? 'bg-gray-100 text-gray-500' : 'bg-[#FC4C02] text-white hover:bg-[#e34402] shadow-md'}
                `}
            >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'A Sincronizar...' : 'Sincronizar Agora'}
            </button>

            {showSuccess && (
                <div className="flex items-center gap-1 text-xs font-bold text-green-600 animate-fade-in">
                    <CheckCircle className="w-3 h-3" />
                    Sincronizado!
                </div>
            )}

            {error && (
                <div className="flex items-center gap-1 text-xs font-bold text-red-500 animate-fade-in">
                    <AlertCircle className="w-3 h-3" />
                    Erro ao sincronizar
                </div>
            )}
        </div>
    );
};

export default SyncStravaButton;
