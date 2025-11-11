export interface User {
  user_id: string;
  name: string;
  email: string | null;
  mobile_no: string | null;
  role: 'admin' | 'employee';
  manager_id: string | null;
  photo_url: string | null;
  is_online?: boolean;
  last_sync?: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export type ActivityType = 'checkin' | 'checkout' | 'visit';

export interface DailyActivity {
  id?: number;
  user_id: string;
  user_name?: string; // For display purposes
  activity_date?: string;
  type: ActivityType;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  details: string | null;
  created_at: string;
  updated_at?: string;
  linked_checkin_id?: number;
}

export interface FollowUp {
  id?: number;
  user_id: string;
  user_name?: string; // For display purposes
  subject: string;
  notes: string | null;
  followup_date: string;
  status?: 'open' | 'done' | 'missed';
  created_at?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  assigned_to: string; // user_id of employee
  assigned_by: string; // user_id of admin
  due_date: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  created_at: string;
  // Populated client-side for display
  assigned_to_name?: string;
  assigned_by_name?: string;
}

export enum View {
  Login,
  Dashboard,
  DailyActivity,
  FollowUps,
  Tasks,
  Profile,
  EmployeeManagement,
  AdminProfile,
}
