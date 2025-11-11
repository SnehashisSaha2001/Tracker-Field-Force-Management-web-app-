import React, { useState, useEffect, useCallback } from 'react';
import { User, View } from './types';
import { supabase } from './services/supabase';
import Sidebar from './components/layout/Sidebar';
import LoginScreen from './components/sections/LoginScreen';
import DashboardScreen from './components/sections/DashboardScreen';
import DailyActivityScreen from './components/sections/DailyActivityScreen';
import FollowUpsScreen from './components/sections/FollowUpsScreen';
import UserProfileScreen from './components/sections/UserProfileScreen';
import EmployeeManagementScreen from './components/sections/EmployeeManagementScreen';
import AdminProfileScreen from './components/sections/AdminProfileScreen';
import TasksScreen from './components/sections/TasksScreen';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.Login);
  const [loading, setLoading] = useState<boolean>(true);

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        
        // Quick session validation by fetching user data again
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.user_id)
          .single();

        if (error || !data) {
          throw new Error('Session invalid');
        }

        setCurrentUser(data);
        setCurrentView(data.role === 'admin' ? View.AdminProfile : View.Dashboard);
      } else {
        setCurrentView(View.Login);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentView(user.role === 'admin' ? View.AdminProfile : View.Dashboard);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView(View.Login);
  };
  
  const handleProfileUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };


  const renderView = () => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-white text-xl">
                Loading Application...
            </div>
        );
    }
    
    if (!currentUser) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentView) {
      case View.Dashboard:
        return <DashboardScreen user={currentUser} />;
      case View.DailyActivity:
        return <DailyActivityScreen user={currentUser} />;
      case View.FollowUps:
        return <FollowUpsScreen user={currentUser} />;
      case View.Tasks:
        return <TasksScreen user={currentUser} />;
      case View.Profile:
        return <UserProfileScreen user={currentUser} onProfileUpdate={handleProfileUpdate} />;
      case View.EmployeeManagement:
        return <EmployeeManagementScreen />;
      case View.AdminProfile:
        return <AdminProfileScreen />;
      case View.Login:
      default:
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-[#f1f1f1]">
      <Sidebar
        user={currentUser}
        currentView={currentView}
        setView={setCurrentView}
        onLogout={handleLogout}
      />
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;