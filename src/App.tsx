import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import { RequireAuth } from './features/auth/RequireAuth';
import StravaCallback from './pages/StravaCallback';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import { useAuth } from './features/auth/AuthContext';
import { useProfile } from './hooks/useProfile';
import LandingPage from './pages/LandingPage';

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: authUser } = useAuth();
  const { data: userProfile, isLoading } = useProfile(authUser?.id);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-gray-500 font-medium">A carregar o teu perfil...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col gap-4 bg-gray-50 px-4 text-center">
        <div className="text-red-500 bg-red-50 p-3 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Erro ao carregar perfil</h2>
        <p className="text-gray-600 max-w-md">Não foi possível carregar os teus dados. Verifica a tua ligação ou tenta novamente.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} userPoints={userProfile.totalPoints} userAvatar={userProfile.avatar} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <Routes>
              <Route path="/" element={<Dashboard user={userProfile} />} />
              <Route path="/events" element={<Events user={userProfile} />} />
              <Route path="/leaderboard" element={<Leaderboard currentUser={userProfile} />} />
              <Route path="/profile" element={<Profile user={userProfile} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
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
      </Routes>
    </Router>
  );
};

export default App;
