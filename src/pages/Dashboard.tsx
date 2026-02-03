import React, { useState, useEffect } from 'react';
import { Activity, Zap, TrendingUp, Award, Calendar as CalendarIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, Activity as IActivity } from '../types';
import Button from '../components/Button';
import { formatDate } from '../utils/dateUtils';

interface DashboardProps {
  user: User;
}


import { useEvents } from '../hooks/useEvents';

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { data: events } = useEvents();
  const [isConnecting, setIsConnecting] = useState(false);
  const activeEventsCount = events?.filter(e => e.status !== 'closed').length || 0;



  const handleConnectStrava = () => {
    setIsConnecting(true);
    // Redirect to Strava Auth
    import('../features/strava/services/strava').then(async ({ getStravaAuthUrl }) => {
      window.location.href = await getStravaAuthUrl();
    });
  };

  const chartData = user.activities.map(a => ({
    name: formatDate(a.date),
    points: a.points
  })).reverse();

  return (
    <div className="space-y-6">

      {/* Welcome & AI Coach */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Hello, {user.name}! 👋</h1>
          <p className="mt-2 text-gray-600">Get ready to conquer new records at Keo.</p>

          <div className="mt-6 flex flex-wrap gap-4">
            {!user.isConnectedToStrava ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-500 mb-1">Connect to sync activities.</p>
                <Button
                  onClick={handleConnectStrava}
                  isLoading={isConnecting}
                  className="bg-[#FC4C02] hover:bg-[#E34402] text-white"
                >
                  Connect with Strava
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-md border border-green-200">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Synced with Strava</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Card (Replaces AI Coach) */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <Zap size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-yellow-300" />
              <h2 className="font-semibold text-indigo-100">Tip of the Day</h2>
            </div>
            <p className="text-lg font-medium leading-relaxed italic">
              "Consistency is key to success. Keep earning points and climbing the ranking!"
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Points', value: user.totalPoints, icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Activities', value: user.activities.length, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Ranking', value: `#${user.rank}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Active Events', value: activeEventsCount, icon: CalendarIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, index) => (
          <div key={index} className="flex items-center rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className={`mr-4 flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Points Evolution</h3>
        <div className="h-72 w-full">
          {user.activities.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="points" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPoints)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Not enough data for the chart.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
