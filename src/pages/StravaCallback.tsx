import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeToken } from '../features/strava/services/strava';
import { useAuth } from '../features/auth/AuthContext';
import { useStrava } from '../hooks/useStrava';

export default function StravaCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { syncActivities } = useStrava();
    const [status, setStatus] = useState('Processing connection to Strava...');

    useEffect(() => {
        // 1. Check for errors (User denied access or clicked Cancel)
        const error = searchParams.get('error');
        if (error) {
            setStatus('Conexão cancelada ou recusada.');
            setTimeout(() => navigate('/app/profile'), 2000);
            return;
        }

        const code = searchParams.get('code');
        if (!code) {
            setStatus('Erro: Nenhum código de autorização recebido.');
            setTimeout(() => navigate('/app/profile'), 3000);
            return;
        }

        if (!user) {
            // If callback happens but user is lost (unlikely with session persistence, but possible)
            // We might need to handle this by redirecting to Login?
            // For now show error.
            setStatus('Erro: Sessão de utilizador não encontrada. Por favor faça login novamente.');
            setTimeout(() => navigate('/login'), 3000);
            return;
        }

        const process = async () => {
            try {
                console.log('🔄 Starting Strava token exchange...');
                await exchangeToken(code);
                // Tokens are saved securely on the server during exchange

                setStatus('Conexão bem sucedida via Strava! A sincronizar atividades...');
                console.log('✅ Token exchange successful, syncing activities...');
                await syncActivities();
                console.log('✅ Activities synced');

                // Decode state parameter to get return URL
                let returnUrl = '/app/profile'; // default fallback
                const stateParam = searchParams.get('state');

                if (stateParam) {
                    try {
                        const stateData = JSON.parse(atob(stateParam));
                        returnUrl = stateData.return_url || returnUrl;
                        console.log('📍 Return URL from OAuth state:', returnUrl);
                    } catch (e) {
                        console.warn('⚠️ Failed to decode state parameter, using fallback');
                    }
                } else {
                    console.log('⚠️ No state parameter found, using fallback /app/profile');
                }

                console.log('➡️ Redirecting to:', returnUrl);
                setStatus('Sucesso! A redirecionar...');
                setTimeout(() => navigate(returnUrl), 1500);
            } catch (e: any) {
                console.error('Strava connection error:', e);
                const msg = e?.message || 'Erro desconhecido';
                setStatus(`Falha na conexão: ${msg}`);

                // Try to get return URL from state even on error
                let returnUrl = '/app/profile';
                const stateParam = searchParams.get('state');

                if (stateParam) {
                    try {
                        const stateData = JSON.parse(atob(stateParam));
                        returnUrl = stateData.return_url || returnUrl;
                    } catch (e) {
                        // ignore decode errors
                    }
                }

                // If token invalid, force logout might be needed, or just warn
                if (msg.includes('Invalid Refresh Token') || msg.includes('Not Found')) {
                    setStatus('Sessão expirada. Por favor faça login novamente.');
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    // General error, go back to return URL or profile
                    console.log('⚠️ Error, redirecting to:', returnUrl);
                    setTimeout(() => navigate(returnUrl), 3000);
                }
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
