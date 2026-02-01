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

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: ActivityType;
  participants: string[]; // User IDs
  image: string;
  creatorId: string;
  maxParticipants?: number;
  status: 'open' | 'closed' | 'cancelled' | 'completed';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetPoints: number;
  rewardBadges: string[];
}
