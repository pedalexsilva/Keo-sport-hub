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

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: authUser } = useAuth();
  const { data: userProfile, isLoading } = useProfile(authUser?.id);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  if (isLoading || !userProfile) {
    return <div className="flex h-screen w-full items-center justify-center">A carregar perfil...</div>;
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/strava/callback" element={
          <RequireAuth>
            <StravaCallback />
          </RequireAuth>
        } />

        <Route path="/*" element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        } />
      </Routes>
    </Router>
  );
};

export default App;
