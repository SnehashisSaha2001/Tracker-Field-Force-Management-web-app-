
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { supabase } from '../../services/supabase';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';

interface UserProfileScreenProps {
  user: User;
  onProfileUpdate: (user: User) => void;
}

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ user, onProfileUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        mobileNo: '',
        emailId: '',
        password: '',
    });
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setFormData({
            name: user.name || '',
            mobileNo: user.mobile_no || '',
            emailId: user.email || '',
            password: '', // Do not pre-fill password for security
        });
        setPhotoUrl(user.photo_url);
        setPhotoPreview(user.photo_url);
    }, [user]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const updates: Partial<User> = {
            name: formData.name,
            mobile_no: formData.mobileNo,
            email: formData.emailId,
            photo_url: photoPreview, // Use the preview which is a base64 string
        };

        if (formData.password) {
            updates.password = formData.password;
        }

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('user_id', user.user_id)
            .select()
            .single();

        if (error) {
            alert('Error updating profile: ' + error.message);
        } else if (data) {
            alert('Profile saved successfully!');
            onProfileUpdate(data);
        }
        setLoading(false);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">User Profile</h1>
            <Card>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col items-center mb-6">
                        <img 
                            src={photoPreview || `https://i.pravatar.cc/150?u=${user.user_id}`} 
                            alt="Profile Preview"
                            className="w-24 h-24 rounded-full object-cover border-4 border-[#00d4ff]"
                        />
                        <label htmlFor="photo-upload" className="mt-4 cursor-pointer bg-[#007bff] text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-opacity-90">
                            Upload Photo
                        </label>
                        <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Name" id="profile-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <Input label="Employee ID" id="profile-employee-id" value={user.user_id} readOnly />
                        <Input label="Mobile No" id="profile-mobile" value={formData.mobileNo} onChange={e => setFormData({...formData, mobileNo: e.target.value})} />
                        <Input label="Email Id" id="profile-email" type="email" value={formData.emailId} onChange={e => setFormData({...formData, emailId: e.target.value})} />
                        <Input label="New Password (optional)" id="profile-password" type="password" placeholder="Leave blank to keep current password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>

                    <div className="mt-6">
                        <Button type="submit" variant="success" className="w-full" isLoading={loading}>
                            Save Profile
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default UserProfileScreen;
