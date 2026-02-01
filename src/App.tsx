import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

// Components
import Navigation from './components/Navigation';
import Header from './components/Header';
import HomeView from './pages/HomeView';
import EventsView from './pages/EventsView';
import StoreView from './pages/StoreView';
import SocialView from './pages/SocialView';
import ProfileView from './pages/ProfileView';

// Old Auth & Logic
import LoginPage from './features/auth/LoginPage';
import { RequireAuth } from './features/auth/RequireAuth';
import StravaCallback from './pages/StravaCallback';
import { useAuth } from './features/auth/AuthContext';
import { useProfile } from './hooks/useProfile';
import { useEvents, useJoinEvent } from './hooks/useEvents';
import { getStravaAuthUrl, syncStravaActivities } from './features/strava/services/strava';
import { useActivityStats } from './hooks/useActivityStats';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';

const AppLayout: React.FC = () => {
  const { user: authUser } = useAuth();
  const { data: userProfile, isLoading: isProfileLoading } = useProfile(authUser?.id);
  const { data: eventsData, isLoading: isEventsLoading } = useEvents();
  const joinEventMutation = useJoinEvent();
  const navigate = useNavigate();

  // Local State for "App" features (Mocked backend for store/points specifics)
  const [points, setPoints] = useState(1250);
  const [inventory, setInventory] = useState<any[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync points from DB if available (optional enhancement)
  useEffect(() => {
    if (userProfile?.totalPoints) {
      setPoints(userProfile.totalPoints);
    }
  }, [userProfile]);

  const handlePurchase = (item: any) => {
    if (points >= item.cost) {
      setPoints(prev => prev - item.cost);
      setInventory(prev => [item, ...prev]);
      setNotification(`Trocaste ${item.cost}pts por ${item.name}!`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleJoinEvent = (eventId: string) => {
    if (!userProfile) return;
    const event = eventsData?.find(e => e.id === eventId);
    const isJoined = event?.participants?.includes(userProfile.id) || false;

    joinEventMutation.mutate({
      eventId,
      userId: userProfile.id,
      isJoining: !isJoined
    }, {
      onSuccess: () => {
        setNotification(!isJoined ? "Inscrição confirmada!" : "Inscrição cancelada.");
        setTimeout(() => setNotification(null), 3000);
      }
    });
  };

  const handleConnectStrava = () => {
    window.location.href = getStravaAuthUrl();
  };

  const handleDisconnectStrava = async () => {
    if (!userProfile) return;

    try {
      await import('./features/strava/services/strava').then(m => m.disconnectStrava(userProfile.id));

      // Force refresh of profile to update UI
      // In a real app with QueryClient properly setup in Context, we would use queryClient.invalidateQueries(['profile'])
      // Since we don't have direct access here easily without context hook, we might rely on window reload or just optimistic update.
      // But query invalidation is best.
      // Assuming a simple reload for now or check if we can get queryClient.

      setNotification("Desconectado com sucesso.");

      // Simple way to refresh state without prop drilling QueryClient
      window.location.reload();

    } catch (error) {
      console.error(error);
      setNotification("Erro ao desconectar.");
    } finally {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSyncData = async () => {
    if (!userProfile) return;
    setIsSyncing(true);
    setNotification("Sincronizando atividades...");

    try {
      const result = await syncStravaActivities(userProfile.id);
      setNotification(result.message);

      // Force page reload to refresh all data (temp fix for context invalidation)
      if (result.count > 0) {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      setNotification("Erro ao sincronizar Strava.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const { data: activityStats } = useActivityStats(userProfile?.id);

  if (isProfileLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 animate-spin rounded-full border-4 border-[#002D72] border-t-transparent"></div></div>;
  }

  if (!userProfile) return <div>Erro ao carregar perfil.</div>;

  // Derived Stats
  const userStats = {
    calories: activityStats?.calories || 0,
    distance: activityStats?.distance || 0
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0">
      {/* Desktop Wrapper / Mobile Container */}
      <div className="md:max-w-md md:mx-auto md:h-screen md:overflow-y-auto md:border-x md:border-gray-200 md:shadow-xl md:relative bg-[#F8FAFC]">

        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-4 left-4 right-4 md:absolute md:top-24 md:left-4 md:right-4 z-[100] bg-green-500 text-white text-sm font-bold p-3 rounded-xl shadow-lg animate-fade-in flex items-center justify-center gap-2 text-center">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {notification}
          </div>
        )}

        <Header user={userProfile} />

        <main className="relative">
          <Routes>
            <Route path="home" element={
              <HomeView
                user={userProfile}
                stats={userStats}
                events={eventsData || []}
                stravaConnected={userProfile.isConnectedToStrava}
                isSyncing={isSyncing}
                onSync={handleSyncData}
                onConnect={() => navigate('/app/profile')} // Redirect to profile to connect
              />
            } />
            <Route path="events" element={
              <EventsView
                events={eventsData || []}
                onJoin={handleJoinEvent}
                user={userProfile}
              />
            } />
            <Route path="store" element={
              <StoreView
                points={points}
                handlePurchase={handlePurchase}
              />
            } />
            <Route path="social" element={
              <SocialView currentUser={userProfile} />
            } />
            <Route path="profile" element={
              <ProfileView
                user={userProfile}
                points={points}
                inventory={inventory}
                stravaConnected={userProfile.isConnectedToStrava}
                onConnect={handleConnectStrava}
                onDisconnect={handleDisconnectStrava}
              />
            } />
            <Route path="*" element={<Navigate to="home" replace />} />
          </Routes>
        </main>

        <Navigation />
      </div>

      {/* Desktop Background Art (Optional, from prompt) */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full bg-gray-200 hidden md:block">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-[#002D72]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/10 text-9xl font-bold tracking-tighter select-none">KEO ACTIVE</div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route path="/strava/callback" element={
          <RequireAuth>
            <StravaCallback />
          </RequireAuth>
        } />

        {/* Private App Section */}
        <Route path="/app/*" element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        } />

        {/* Admin Route */}
        <Route path="/admin" element={
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
        } />
      </Routes>
    </Router>
  );
};

export default App;
