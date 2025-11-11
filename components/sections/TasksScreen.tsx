import React, { useState, useEffect, useCallback } from 'react';
import { User, Task } from '../../types';
import { supabase } from '../../services/supabase';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';

const TaskStatusBadge: React.FC<{ status: Task['status'] }> = ({ status }) => {
    const statusStyles = {
        'To Do': 'bg-blue-500/20 text-blue-300',
        'In Progress': 'bg-yellow-500/20 text-yellow-300',
        'Completed': 'bg-green-500/20 text-green-300',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
            {status}
        </span>
    );
};

const TasksScreen: React.FC<{ user: User }> = ({ user }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [formData, setFormData] = useState({
        title: '', description: '', assigned_to: '', due_date: '', status: 'To Do' as Task['status']
    });

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: usersData, error: usersError } = await supabase.from('users').select('*');
            if (usersError) throw usersError;

            setEmployees(usersData?.filter(u => u.role === 'employee') || []);
            
            let taskQuery = supabase.from('tasks').select('*');
            if (user.role === 'employee') {
                taskQuery = taskQuery.eq('assigned_to', user.user_id);
            }
            const { data: tasksData, error: tasksError } = await taskQuery.order('due_date', { ascending: true });

            if (tasksError) throw tasksError;

            if (usersData) {
                const userMap = new Map(usersData.map(u => [u.user_id, u.name]));
                const enrichedTasks = tasksData.map(task => ({
                    ...task,
                    assigned_to_name: userMap.get(task.assigned_to) || task.assigned_to,
                    assigned_by_name: userMap.get(task.assigned_by) || task.assigned_by,
                }));
                setTasks(enrichedTasks);
            }
        } catch (error: any) {
            console.error("Error fetching task data:", error);
            alert(`Error: ${error.message}. Please ensure the application and database are correctly configured.`);
        } finally {
            setLoading(false);
        }
    }, [user.role, user.user_id]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleOpenModal = (task: Task | null = null) => {
        setEditingTask(task);
        if (task) {
            setFormData({
                title: task.title,
                description: task.description || '',
                assigned_to: task.assigned_to,
                due_date: new Date(task.due_date).toISOString().split('T')[0],
                status: task.status,
            });
        } else {
            setFormData({ title: '', description: '', assigned_to: '', due_date: '', status: 'To Do' });
        }
        setModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingTask(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const taskData = {
                ...formData,
                assigned_by: user.user_id,
                status: formData.status as Task['status'],
            };
            
            const { error } = editingTask
                ? await supabase.from('tasks').update(taskData).eq('id', editingTask.id)
                : await supabase.from('tasks').insert(taskData);

            if (error) throw error;

            await fetchAllData();
            handleCloseModal();
        } catch (error: any) {
            console.error("Error saving task:", error);
            alert(`Failed to save task: ${error.message}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                const { error } = await supabase.from('tasks').delete().eq('id', id);
                if (error) throw error;
                await fetchAllData();
            } catch (error: any) {
                console.error("Error deleting task:", error);
                alert(`Failed to delete task: ${error.message}`);
            }
        }
    };
    
    const handleStatusChange = async (id: number, status: Task['status']) => {
        try {
            const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
            if (error) throw error;
            setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
        } catch (error: any) {
            console.error("Error updating status:", error);
            alert(`Failed to update status: ${error.message}`);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Tasks</h1>
                {user.role === 'admin' && (
                    <Button variant="primary" onClick={() => handleOpenModal()}>Assign Task</Button>
                )}
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-[#00d4ff] uppercase bg-[#324a5f]">
                            <tr>
                                <th className="px-6 py-3">Title</th>
                                {user.role === 'admin' && <th className="px-6 py-3">Assigned To</th>}
                                {user.role === 'employee' && <th className="px-6 py-3">Assigned By</th>}
                                <th className="px-6 py-3">Due Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-4">Loading tasks...</td></tr>
                            ) : tasks.map((task) => (
                                <tr key={task.id} className="bg-[#2b3d50] border-b border-gray-700 hover:bg-gray-800/50">
                                    <td className="px-6 py-4 font-medium text-white" title={task.description || ''}>{task.title}</td>
                                    {user.role === 'admin' && <td className="px-6 py-4">{task.assigned_to_name}</td>}
                                    {user.role === 'employee' && <td className="px-6 py-4">{task.assigned_by_name}</td>}
                                    <td className="px-6 py-4">{new Date(task.due_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        {user.role === 'admin' ? (
                                            <TaskStatusBadge status={task.status} />
                                        ) : (
                                            <Select id={`status-${task.id}`} value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])} className="text-xs !p-1.5 !mb-0 bg-[#324a5f]">
                                                <option value="To Do">To Do</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                            </Select>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        {user.role === 'admin' && (
                                            <>
                                                <Button size="sm" variant="info" onClick={() => handleOpenModal(task)}>Edit</Button>
                                                <Button size="sm" variant="danger" onClick={() => handleDelete(task.id)}>Delete</Button>
                                            </>
                                        )}
                                        {user.role === 'employee' && (
                                            <span className="text-xs italic text-gray-500">Update status in dropdown</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {user.role === 'admin' && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTask ? 'Edit Task' : 'Assign New Task'}>
                    <form onSubmit={handleSubmit}>
                        <Input label="Task Title" id="task-title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                        
                        <div className="mb-4">
                            <label htmlFor="task-desc" className="block mb-2 text-sm font-medium text-gray-300">Description</label>
                            <textarea id="task-desc" rows={3} className="w-full px-4 py-2 bg-[#324a5f] border border-gray-600 rounded-lg text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>

                        <Select label="Assign To" id="assign-to" value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})} required>
                            <option value="">-- Select Employee --</option>
                            {employees.map(emp => <option key={emp.user_id} value={emp.user_id}>{emp.name}</option>)}
                        </Select>

                        <Input label="Due Date" id="due-date" type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} required />

                        <Select label="Status" id="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Task['status']})} required>
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </Select>

                        <div className="flex justify-end mt-4">
                            <Button type="submit" variant="success">{editingTask ? 'Update Task' : 'Assign Task'}</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default TasksScreen;