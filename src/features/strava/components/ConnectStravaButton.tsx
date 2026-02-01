import React from 'react';
import { getStravaAuthUrl } from '../services/strava';

export const ConnectStravaButton = () => {
    const handleConnect = async () => {
        try {
            const url = await getStravaAuthUrl();
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error("Failed to initiate Strava connection:", error);
            alert("Could not connect to Strava. Please try again.");
        }
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
