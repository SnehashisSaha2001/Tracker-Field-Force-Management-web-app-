
import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { User } from '../../types';
import Card from '../common/Card';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<'employee' | 'admin' | ''>('');
  const [identifier, setIdentifier] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError('Please select a role.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
        const { data, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq(role === 'admin' ? 'user_id' : 'user_id', identifier)
            .eq('mobile_no', mobile)
            .single();

        if (dbError || !data) {
            throw new Error('Invalid credentials or user not found.');
        }

        if (data.password !== password) {
            throw new Error('Incorrect password.');
        }

        onLoginSuccess(data as User);

    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
      <div className="w-full max-w-md mx-auto">
        <Card title="🚀 Tracker Login">
          <form onSubmit={handleLogin}>
            {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</p>}
            
            <Select label="Select Role" id="role-select" value={role} onChange={(e) => {
                setRole(e.target.value as any);
                setIdentifier('');
            }} required>
              <option value="">-- Select a Role --</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </Select>

            {role === 'employee' && (
              <Input
                label="Employee ID"
                id="employee-id"
                type="text"
                placeholder="e.g., SCS-12345"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            )}
            
            {role === 'admin' && (
              <Input
                label="Admin Username"
                id="admin-username"
                type="text"
                placeholder="e.g., ADM-YourName"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            )}
            
            {role && (
                <>
                    <Input
                        label="Mobile Number"
                        id="mobile-number"
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </>
            )}

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading} disabled={!role}>
              Login
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginScreen;
