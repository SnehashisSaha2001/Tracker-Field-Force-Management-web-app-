
import React from 'react';
import { User } from '../../types';
import Card from '../common/Card';

interface DashboardScreenProps {
  user: User;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ user }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Welcome, {user.name}!</h1>
      <Card>
        <h2 className="text-xl font-semibold text-[#00d4ff] mb-4">Quick Start Guide</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>
            <strong>Mark Attendance:</strong> Go to the <span className="font-semibold text-white">Daily Activity</span> section to easily clock in and out with a single tap.
          </li>
          <li>
            <strong>Log Your Visits:</strong> After checking in, you'll be prompted to log your client or field visits.
          </li>
          <li>
            <strong>Manage Follow Ups:</strong> Use the <span className="font-semibold text-white">Follow Ups</span> section to schedule and manage your tasks and reminders.
          </li>
          <li>
            <strong>Update Your Profile:</strong> Keep your information up-to-date in the <span className="font-semibold text-white">User Profile</span> section.
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default DashboardScreen;
