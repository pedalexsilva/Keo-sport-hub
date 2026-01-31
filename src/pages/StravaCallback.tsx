import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeToken, saveStravaTokens } from '../features/strava/services/strava';
import { useAuth } from '../features/auth/AuthContext';

export default function StravaCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [status, setStatus] = useState('Processing connection to Strava...');

    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) {
            setStatus('Error: No authorization code received from Strava.');
            return;
        }

        if (!user) {
            // If callback happens but user is lost (unlikely with session persistence, but possible)
            // We might need to handle this by redirecting to Login?
            // For now show error.
            setStatus('Error: User session not found. Please log in again.');
            return;
        }

        const process = async () => {
            try {
                const data = await exchangeToken(code);
                await saveStravaTokens(user.id, data);
                setStatus('Success! Redirecting...');
                setTimeout(() => navigate('/profile'), 1500);
            } catch (e) {
                console.error(e);
                setStatus('Failed to connect Strava. Please check console.');
            }
        };

        process();
    }, [searchParams, user, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-xl font-medium text-gray-700">{status}</div>
        </div>
    );
}
