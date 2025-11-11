
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { supabase } from '../../services/supabase';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';

const EmployeeManagementScreen: React.FC = () => {
    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        user_id: '', name: '', mobile_no: '', email: '', password: ''
    });

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'employee')
            .order('user_id');
        if (error) console.error(error);
        else setEmployees(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleOpenModal = (employee: User | null = null) => {
        setEditingEmployee(employee);
        if (employee) {
            setFormData({
                user_id: employee.user_id,
                name: employee.name,
                mobile_no: employee.mobile_no || '',
                email: employee.email || '',
                password: ''
            });
        } else {
            setFormData({ user_id: '', name: '', mobile_no: '', email: '', password: '' });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingEmployee(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingEmployee) { // Update
            const updates: Partial<User> = { name: formData.name, mobile_no: formData.mobile_no, email: formData.email };
            if (formData.password) updates.password = formData.password;
            await supabase.from('users').update(updates).eq('user_id', editingEmployee.user_id);
        } else { // Create
            const newUser: Omit<User, 'created_at' | 'updated_at'> = {
                user_id: formData.user_id,
                name: formData.name,
                mobile_no: formData.mobile_no,
                email: formData.email,
                password: formData.password,
                role: 'employee',
                manager_id: null,
                photo_url: `https://i.pravatar.cc/150?u=${formData.user_id}`
            };
            await supabase.from('users').insert(newUser);
        }
        fetchEmployees();
        handleCloseModal();
    };

    const handleDelete = async (user_id: string) => {
        if (window.confirm(`Are you sure you want to delete employee ${user_id}? This will also delete all their data.`)) {
            await supabase.from('users').delete().eq('user_id', user_id);
            fetchEmployees();
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Employee Management</h1>
                <Button variant="primary" onClick={() => handleOpenModal()}>Add Employee</Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-[#00d4ff] uppercase bg-[#324a5f]">
                            <tr>
                                <th className="px-6 py-3">Employee ID</th>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Mobile No</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                            ) : employees.map(emp => (
                                <tr key={emp.user_id} className="bg-[#2b3d50] border-b border-gray-700 hover:bg-gray-800/50">
                                    <td className="px-6 py-4 font-medium text-white">{emp.user_id}</td>
                                    <td className="px-6 py-4">{emp.name}</td>
                                    <td className="px-6 py-4">{emp.mobile_no}</td>
                                    <td className="px-6 py-4">{emp.email}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <Button size="sm" variant="info" onClick={() => handleOpenModal(emp)}>Edit</Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(emp.user_id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEmployee ? 'Edit Employee' : 'Add Employee'}>
                <form onSubmit={handleSubmit}>
                    <Input label="Employee ID" id="emp-id" value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})} required disabled={!!editingEmployee} />
                    <Input label="Full Name" id="emp-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <Input label="Mobile No" id="emp-mobile" value={formData.mobile_no} onChange={e => setFormData({...formData, mobile_no: e.target.value})} required />
                    <Input label="Email" type="email" id="emp-email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    <Input label="Password" type="password" id="emp-password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingEmployee} placeholder={editingEmployee ? 'Leave blank to keep current' : ''} />
                    <div className="flex justify-end">
                        <Button type="submit" variant="success">Save Employee</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EmployeeManagementScreen;
