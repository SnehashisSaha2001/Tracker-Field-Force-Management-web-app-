
import React, { useState, useEffect, useCallback } from 'react';
import { User, FollowUp } from '../../types';
import { supabase } from '../../services/supabase';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';

const FollowUpsScreen: React.FC<{ user: User }> = ({ user }) => {
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
    const [formData, setFormData] = useState({ subject: '', datetime: '', notes: '' });

    const fetchFollowUps = useCallback(async () => {
        setLoading(true);
        let query = supabase.from('followups').select('*, users (name)');
        if (user.role === 'employee') {
            query = query.eq('user_id', user.user_id);
        }
        const { data, error } = await query.order('followup_date', { ascending: false });

        if (error) {
            console.error('Error fetching follow-ups:', error);
        } else {
             const formattedData = data.map((d: any) => ({
                ...d,
                user_name: d.users.name
            }));
            setFollowUps(formattedData);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchFollowUps();
    }, [fetchFollowUps]);

    const handleOpenModal = (followUp: FollowUp | null = null) => {
        setEditingFollowUp(followUp);
        if (followUp) {
            setFormData({ subject: followUp.subject, datetime: new Date(followUp.followup_date).toISOString().slice(0, 16), notes: followUp.notes || '' });
        } else {
            setFormData({ subject: '', datetime: '', notes: '' });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingFollowUp(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const followUpData = {
            user_id: user.user_id,
            subject: formData.subject,
            followup_date: new Date(formData.datetime).toISOString(),
            notes: formData.notes,
        };

        if (editingFollowUp) {
            await supabase.from('followups').update(followUpData).eq('id', editingFollowUp.id);
        } else {
            await supabase.from('followups').insert(followUpData);
        }
        fetchFollowUps();
        handleCloseModal();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this follow-up?')) {
            await supabase.from('followups').delete().eq('id', id);
            fetchFollowUps();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Follow Ups</h1>
                <Button variant="primary" onClick={() => handleOpenModal()}>Add Follow-Up</Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-[#00d4ff] uppercase bg-[#324a5f]">
                            <tr>
                                {user.role === 'admin' && <th scope="col" className="px-6 py-3">User</th>}
                                <th scope="col" className="px-6 py-3">Subject</th>
                                <th scope="col" className="px-6 py-3">Date & Time</th>
                                <th scope="col" className="px-6 py-3">Note</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                            ) : followUps.map((fu) => (
                                <tr key={fu.id} className="bg-[#2b3d50] border-b border-gray-700 hover:bg-gray-800/50">
                                    {user.role === 'admin' && <td className="px-6 py-4 font-medium text-white">{fu.user_name}</td>}
                                    <td className="px-6 py-4 font-medium text-white">{fu.subject}</td>
                                    <td className="px-6 py-4">{new Date(fu.followup_date).toLocaleString()}</td>
                                    <td className="px-6 py-4">{fu.notes}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <Button size="sm" variant="info" onClick={() => handleOpenModal(fu)}>Edit</Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(fu.id!)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingFollowUp ? 'Edit Follow-Up' : 'Add Follow-Up'}>
                <form onSubmit={handleSubmit}>
                    <Input label="Subject / Client Name" id="subject" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required/>
                    <Input label="Date & Time" id="datetime" type="datetime-local" value={formData.datetime} onChange={e => setFormData({...formData, datetime: e.target.value})} required/>
                    <div className="mb-4">
                        <label htmlFor="notes" className="block mb-2 text-sm font-medium text-gray-300">Reminder Note</label>
                        <textarea id="notes" rows={4} className="w-full px-4 py-2 bg-[#324a5f] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:border-transparent" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" variant="success">Save Follow-Up</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FollowUpsScreen;
