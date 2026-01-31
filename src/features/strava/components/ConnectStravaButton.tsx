import React from 'react';
import { getStravaAuthUrl } from '../services/strava';

export const ConnectStravaButton = () => {
    const handleConnect = () => {
        window.location.href = getStravaAuthUrl();
    };

    return (
        <button
            onClick={handleConnect}
            className="bg-[#FC4C02] text-white px-4 py-2 rounded font-bold hover:bg-[#E34402] transition"
        >
            Connect with Strava
        </button>
    );
};
