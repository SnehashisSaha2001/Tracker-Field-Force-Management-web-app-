
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { supabase } from '../../services/supabase';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';

const AdminProfileScreen: React.FC = () => {
    const [admins, setAdmins] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        user_id: '', name: '', mobile_no: '', email: '', password: ''
    });

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'admin')
            .order('user_id');
        if (error) console.error(error);
        else setAdmins(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const handleOpenModal = (admin: User | null = null) => {
        setEditingAdmin(admin);
        if (admin) {
            setFormData({
                user_id: admin.user_id,
                name: admin.name,
                mobile_no: admin.mobile_no || '',
                email: admin.email || '',
                password: ''
            });
        } else {
            setFormData({ user_id: '', name: '', mobile_no: '', email: '', password: '' });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingAdmin(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingAdmin) {
            const updates: Partial<User> = { name: formData.name, mobile_no: formData.mobile_no, email: formData.email };
            if (formData.password) updates.password = formData.password;
            await supabase.from('users').update(updates).eq('user_id', editingAdmin.user_id);
        } else {
            const newAdmin: Omit<User, 'created_at' | 'updated_at'> = {
                user_id: formData.user_id,
                name: formData.name,
                mobile_no: formData.mobile_no,
                email: formData.email,
                password: formData.password,
                role: 'admin',
                manager_id: null,
                photo_url: `https://i.pravatar.cc/150?u=${formData.user_id}`
            };
            await supabase.from('users').insert(newAdmin);
        }
        fetchAdmins();
        handleCloseModal();
    };

    const handleDelete = async (user_id: string) => {
        if (window.confirm(`Are you sure you want to delete admin ${user_id}?`)) {
            // Add a check to prevent deleting the last admin
            if (admins.length <= 1) {
                alert("Cannot delete the last admin account.");
                return;
            }
            await supabase.from('users').delete().eq('user_id', user_id);
            fetchAdmins();
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Admin Management</h1>
                <Button variant="primary" onClick={() => handleOpenModal()}>Add Admin</Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-[#00d4ff] uppercase bg-[#324a5f]">
                            <tr>
                                <th className="px-6 py-3">Admin Username</th>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Mobile No</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                            ) : admins.map(admin => (
                                <tr key={admin.user_id} className="bg-[#2b3d50] border-b border-gray-700 hover:bg-gray-800/50">
                                    <td className="px-6 py-4 font-medium text-white">{admin.user_id}</td>
                                    <td className="px-6 py-4">{admin.name}</td>
                                    <td className="px-6 py-4">{admin.mobile_no}</td>
                                    <td className="px-6 py-4">{admin.email}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <Button size="sm" variant="info" onClick={() => handleOpenModal(admin)}>Edit</Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(admin.user_id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingAdmin ? 'Edit Admin' : 'Add Admin'}>
                <form onSubmit={handleSubmit}>
                    <Input label="Admin Username (e.g., ADM-YourName)" id="admin-id" value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})} required disabled={!!editingAdmin} />
                    <Input label="Full Name" id="admin-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <Input label="Mobile No" id="admin-mobile" value={formData.mobile_no} onChange={e => setFormData({...formData, mobile_no: e.target.value})} required />
                    <Input label="Email" type="email" id="admin-email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    <Input label="Password" type="password" id="admin-password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingAdmin} placeholder={editingAdmin ? 'Leave blank to keep current' : ''} />
                    <div className="flex justify-end">
                        <Button type="submit" variant="success">Save Admin</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminProfileScreen;
