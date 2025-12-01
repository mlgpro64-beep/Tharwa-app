
export type UserRole = 'client' | 'tasker';

export interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  date: string;
  time: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  distance?: string;
  images?: string[];
  clientName?: string;
  taskerName?: string;
  taskerAvatar?: string;
}

export interface Offer {
  id: string;
  taskId?: string;
  taskerName: string;
  taskerAvatar: string;
  rating: number;
  jobs: number;
  amount: number;
  message: string;
  time: string;
}

export interface Transaction {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'completed' | 'pending';
  icon: string;
  colorClass: string;
}

export interface User {
  name: string;
  role: UserRole;
  balance: number;
  avatar: string;
  rating: number;
  completedTasks: number;
}

export interface Notification {
  id: number;
  type: 'offer' | 'system' | 'chat';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  color: string;
  action?: string;
}
