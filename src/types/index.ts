export enum ActivityType {
  RUN = 'Corrida',
  RIDE = 'Ciclismo',
  SWIM = 'Natação',
  HIKE = 'Caminhada',
  WORKOUT = 'Treino Funcional'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  isConnectedToStrava: boolean;
  totalPoints: number;
  rank: number;
  role?: string;
  office?: string;
  onboardingCompleted: boolean;
  activities: Activity[];
}

export interface Activity {
  id: string;
  type: ActivityType;
  distance: number; // in km
  duration: number; // in minutes
  date: string;
  points: number;
  title: string;
}

export interface Participant {
  id: string;
  name: string;
  office: string;
  avatar: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  type: ActivityType;
  mode: 'social' | 'competitive';
  participants: Participant[]; // Updated to store full objects
  image: string;
  creatorId: string;
  maxParticipants?: number;
  status: 'open' | 'closed' | 'cancelled' | 'completed';
  visibility: 'public' | 'department' | 'private';
  targetOffice?: string;
  allowedUsers?: string[]; // IDs of users allowed in private events
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetPoints: number;
  rewardBadges: string[];
}

export type NotificationType = 'event_invite' | 'event_update' | 'new_event' | 'system' | 'challenge_alert';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: any;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  office: string;
  email?: string;
}
