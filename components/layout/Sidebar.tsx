import React from 'react';
import { User, View } from '../../types';

interface SidebarProps {
  user: User | null;
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
}

const NavButton: React.FC<{
  label: string;
  view: View;
  currentView: View;
  onClick: (view: View) => void;
}> = ({ label, view, currentView, onClick }) => (
  <button
    onClick={() => onClick(view)}
    className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors duration-200 text-sm font-semibold ${
      currentView === view
        ? 'bg-[#00d4ff] text-black'
        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
    }`}
  >
    {label}
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ user, currentView, setView, onLogout }) => {
  if (!user) return null;

  return (
    <aside className="bg-[#0e2a47] w-full md:w-56 p-4 flex flex-col flex-shrink-0 md:h-screen md:sticky md:top-0">
      <div className="text-center md:text-left mb-4">
        <h2 className="text-2xl font-bold text-white">🚀 Tracker</h2>
      </div>
      
      <div className="flex flex-col items-center mb-6">
        <img
          src={user.photo_url || `https://i.pravatar.cc/150?u=${user.user_id}`}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover border-2 border-[#00d4ff] mb-2"
        />
        <p className="font-semibold text-white truncate w-full text-center">{user.name}</p>
        <p className="text-xs text-gray-400 w-full text-center">{user.user_id}</p>
      </div>

      <nav className="flex-grow space-y-2">
        <NavButton label="Dashboard" view={View.Dashboard} currentView={currentView} onClick={setView} />
        <NavButton label="Daily Activity" view={View.DailyActivity} currentView={currentView} onClick={setView} />
        <NavButton label="Follow Ups" view={View.FollowUps} currentView={currentView} onClick={setView} />
        <NavButton label="Tasks" view={View.Tasks} currentView={currentView} onClick={setView} />
        <NavButton label="User Profile" view={View.Profile} currentView={currentView} onClick={setView} />
        {user.role === 'admin' && (
          <>
            <NavButton label="Employee Management" view={View.EmployeeManagement} currentView={currentView} onClick={setView} />
            <NavButton label="Admin Profile" view={View.AdminProfile} currentView={currentView} onClick={setView} />
          </>
        )}
      </nav>

      <div className="mt-auto">
        <button
          onClick={onLogout}
          className="w-full px-4 py-2.5 rounded-lg transition-colors duration-200 text-sm font-semibold bg-red-600/20 text-red-400 hover:bg-red-500 hover:text-white"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;