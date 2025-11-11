import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, DailyActivity as Activity, ActivityType } from '../../types';
import { supabase } from '../../services/supabase';
import { useGeolocation } from '../../hooks/useGeolocation';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import L from 'leaflet';

// Leaflet icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const formatActivityType = (type: ActivityType): string => {
    switch (type) {
        case 'checkin': return 'Check-In';
        case 'checkout': return 'Check-Out';
        case 'visit': return 'Visit';
        default: return type;
    }
};

interface UserLocation {
    latitude: number;
    longitude: number;
    name: string;
    timestamp: string;
}

const DailyActivityScreen: React.FC<{ user: User }> = ({ user }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [employeeList, setEmployeeList] = useState<User[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isVisitModalOpen, setVisitModalOpen] = useState(false);
    const [visitDetails, setVisitDetails] = useState({ client: '', purpose: '', location: '' });
    const [currentCheckInId, setCurrentCheckInId] = useState<number | null>(null);
    const [hasActiveCheckIn, setHasActiveCheckIn] = useState(false);
    
    const { location, error, isTracking, startTracking, stopTracking, getFreshLocation } = useGeolocation();
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    // State and refs for the admin's all-users map
    const [allUserLocations, setAllUserLocations] = useState<Map<string, UserLocation>>(new Map());
    const allUsersMapRef = useRef<L.Map | null>(null);
    const allUsersMarkersRef = useRef<Map<string, L.Marker>>(new Map());
    
    const lastDbUpdateRef = useRef<number>(0);

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        
        if (user.role === 'admin' && employeeList.length === 0) {
            const { data: employeesData } = await supabase.from('users').select('*').eq('role', 'employee');
            if (employeesData) setEmployeeList(employeesData);
        }

        let query = supabase.from('daily_activity').select('*, users (name)');

        const targetUserId = (user.role === 'admin' && selectedEmployee) ? selectedEmployee : user.user_id;

        query = query.eq('user_id', targetUserId);
        
        const { data, error: dbError } = await query
            .order('created_at', { ascending: false })
            .limit(100);

        if (dbError) {
            console.error('Error fetching activities:', dbError);
        } else {
            const formattedData = data.map((d: any) => ({
                ...d,
                user_name: d.users?.name || targetUserId
            }));
            setActivities(formattedData);
        }
        setLoading(false);
    }, [user.role, user.user_id, selectedEmployee, employeeList.length]);

    const checkActiveSession = useCallback(async () => {
        const { data } = await supabase
            .from('daily_activity')
            .select('*')
            .eq('user_id', user.user_id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0 && data[0].type === 'checkin') {
            setHasActiveCheckIn(true);
            setCurrentCheckInId(data[0].id);
            if (!isTracking) {
               startTracking();
            }
        } else {
            setHasActiveCheckIn(false);
            if (isTracking) {
                stopTracking();
            }
        }
    }, [user.user_id, startTracking, stopTracking, isTracking]);
    
    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    useEffect(() => {
        checkActiveSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    useEffect(() => {
        if (isTracking && hasActiveCheckIn && location && currentCheckInId) {
            const now = Date.now();
            const UPDATE_INTERVAL = 30000; 

            if (now - lastDbUpdateRef.current > UPDATE_INTERVAL) {
                lastDbUpdateRef.current = now;

                const syncLocationToDb = async () => {
                    await supabase
                        .from('daily_activity')
                        .update({
                            latitude: location.latitude,
                            longitude: location.longitude,
                            location: location.address,
                        })
                        .eq('id', currentCheckInId);
                };
                syncLocationToDb();
            }
        }
    }, [location, isTracking, hasActiveCheckIn, currentCheckInId]);


    useEffect(() => {
        if (mapRef.current === null && document.getElementById('leaflet-map')) {
            const map = L.map('leaflet-map').setView([20, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            mapRef.current = map;
        }
    }, []);

    useEffect(() => {
        if (location && mapRef.current) {
            const newLatLng = new L.LatLng(location.latitude, location.longitude);
            mapRef.current.setView(newLatLng, 15);
            if (markerRef.current === null) {
                markerRef.current = L.marker(newLatLng).addTo(mapRef.current);
            } else {
                markerRef.current.setLatLng(newLatLng);
            }
            markerRef.current.bindPopup(`<b>Your Location</b><br>${location.address}`).openPopup();
        }
    }, [location]);

    // Admin-specific effects for all-users map
    useEffect(() => {
        if (user.role !== 'admin') return;

        const fetchActiveUserLocations = async () => {
            const { data: users, error: usersError } = await supabase.from('users').select('user_id, name');
            if (usersError || !users) return;

            const latestActivitiesPromises = users.map(u =>
                supabase.from('daily_activity').select('*').eq('user_id', u.user_id).order('created_at', { ascending: false }).limit(1).single()
            );
            
            const results = await Promise.all(latestActivitiesPromises);
            
            const locations = new Map<string, UserLocation>();
            results.forEach((res, index) => {
                const currentUser = users[index];
                if (res.data && res.data.type === 'checkin' && res.data.latitude && res.data.longitude) {
                    locations.set(currentUser.user_id, {
                        latitude: res.data.latitude,
                        longitude: res.data.longitude,
                        name: currentUser.name,
                        timestamp: res.data.updated_at || res.data.created_at,
                    });
                }
            });
            setAllUserLocations(locations);
        };

        fetchActiveUserLocations();

        const channel = supabase.channel('public:daily_activity')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_activity' },
            () => {
                fetchActiveUserLocations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user.role]);

    useEffect(() => {
        if (user.role !== 'admin' || !document.getElementById('all-users-map')) return;

        if (allUsersMapRef.current === null) {
            const map = L.map('all-users-map').setView([22.5726, 88.3639], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            allUsersMapRef.current = map;
        }

    }, [user.role, allUserLocations]);

    useEffect(() => {
        if (user.role !== 'admin' || !allUsersMapRef.current) return;
        
        const map = allUsersMapRef.current;
        const markers = allUsersMarkersRef.current;
        const visibleUserIds = new Set<string>();
        const latLngs: L.LatLng[] = [];

        allUserLocations.forEach((loc, userId) => {
            const latLng = new L.LatLng(loc.latitude, loc.longitude);
            latLngs.push(latLng);
            const popupContent = `<b>${loc.name}</b><br>Last update: ${new Date(loc.timestamp).toLocaleTimeString()}`;

            if (markers.has(userId)) {
                markers.get(userId)!.setLatLng(latLng).setPopupContent(popupContent);
            } else {
                const newMarker = L.marker(latLng).addTo(map).bindPopup(popupContent);
                markers.set(userId, newMarker);
            }
            visibleUserIds.add(userId);
        });

        markers.forEach((marker, userId) => {
            if (!visibleUserIds.has(userId)) {
                marker.remove();
                markers.delete(userId);
            }
        });

        if (latLngs.length > 0) {
            const bounds = new L.LatLngBounds(latLngs);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }

    }, [allUserLocations, user.role]);


    const handleCheckIn = async () => {
        setIsCheckingIn(true);
        try {
            const freshLocation = await getFreshLocation();
            
            const newActivity: Omit<Activity, 'id'> = {
                user_id: user.user_id, type: 'checkin', details: 'Live GPS', created_at: new Date().toISOString(),
                latitude: freshLocation.latitude, longitude: freshLocation.longitude, location: freshLocation.address,
            };

            const { data, error: dbError } = await supabase.from('daily_activity').insert(newActivity).select().single();
            if (dbError) throw dbError;
            
            setCurrentCheckInId(data.id);
            setHasActiveCheckIn(true);
            startTracking();
            fetchActivities();
            setVisitModalOpen(true);

        } catch (err: any) {
            alert(`Check-in failed: ${err.message}`);
        } finally {
            setIsCheckingIn(false);
        }
    };
    
    const handleCheckOut = async () => {
        stopTracking(); 

        const newActivity: Omit<Activity, 'id'> = {
            user_id: user.user_id, type: 'checkout', details: 'Live GPS', created_at: new Date().toISOString(),
            latitude: location?.latitude ?? null, longitude: location?.longitude ?? null, location: location?.address ?? 'Final location',
        };
        const { error } = await supabase.from('daily_activity').insert(newActivity);
        if (error) {
             alert(`Check-out failed: ${error.message}`);
             return;
        }
        setHasActiveCheckIn(false);
        setCurrentCheckInId(null);
        fetchActivities();
    };

    const handleLogVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const visitActivity: Omit<Activity, 'id'> = {
                user_id: user.user_id, type: 'visit', details: `${visitDetails.client} - ${visitDetails.purpose}`, created_at: new Date().toISOString(),
                latitude: location?.latitude ?? null, longitude: location?.longitude ?? null, location: visitDetails.location || location?.address || 'N/A',
                linked_checkin_id: currentCheckInId ?? undefined,
            };
            const { error: visitError } = await supabase.from('daily_activity').insert(visitActivity);
            if(visitError) throw visitError;
            
            const newFollowUp = {
                user_id: user.user_id, subject: `Visit: ${visitDetails.client}`,
                notes: `Location: ${visitActivity.location}\nPurpose: ${visitDetails.purpose}`, followup_date: new Date().toISOString(),
            };
            const { error: followupError } = await supabase.from('followups').insert(newFollowUp);
            if(followupError) throw followupError;

            setVisitModalOpen(false);
            setVisitDetails({ client: '', purpose: '', location: '' });
            fetchActivities();
        } catch(error: any) {
            alert(`Failed to log visit: ${error.message}`);
        }
    };

    const handleSkipVisit = () => {
        setVisitModalOpen(false);
        setVisitDetails({ client: '', purpose: '', location: '' });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">📅 Daily Activity</h1>
            
            <Card title={user.role === 'admin' ? "Your Location & Attendance (Admin)" : "Your Location & Attendance"}>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        <div>
                            <h3 className="font-semibold text-lg text-white">Location Status</h3>
                            <p className={`font-bold ${isTracking ? 'text-green-400' : 'text-red-400'}`}>
                               📍 {isTracking ? 'Active' : 'Inactive'}
                            </p>
                            {error && <p className="text-red-400 text-sm mt-1">{error.message}</p>}
                        </div>
                        <div className="text-sm text-gray-300 space-y-1">
                           <p><strong>Address:</strong> {location?.address || 'Waiting for location...'}</p>
                           <p><strong>Coords:</strong> {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'N/A'}</p>
                           <p><strong>Accuracy:</strong> {location ? `${location.accuracy.toFixed(1)}m` : 'N/A'}</p>
                        </div>
                        <div className="flex gap-4 pt-2">
                           <Button variant="success" onClick={handleCheckIn} disabled={hasActiveCheckIn} isLoading={isCheckingIn}>Check In</Button>
                           <Button variant="danger" onClick={handleCheckOut} disabled={!hasActiveCheckIn}>Check Out</Button>
                        </div>
                    </div>
                     <div className="flex-1 h-48 md:h-auto rounded-lg overflow-hidden border-2 border-[#00d4ff]">
                        <div id="leaflet-map" style={{ height: '100%', width: '100%', backgroundColor: '#324a5f' }}></div>
                    </div>
                </div>
            </Card>
            
            {user.role === 'admin' && (
                <Card title="Admin & Employee Locations">
                    <div className="h-96 rounded-lg overflow-hidden border-2 border-[#007bff]">
                         <div id="all-users-map" style={{ height: '100%', width: '100%', backgroundColor: '#324a5f' }}></div>
                    </div>
                </Card>
            )}


            <Card title="Activity Log">
                {user.role === 'admin' && (
                    <div className="mb-4 max-w-xs">
                         <Select id="employee-filter" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                            <option value="">All Employees</option>
                            {employeeList.map(emp => (
                                <option key={emp.user_id} value={emp.user_id}>{emp.name} ({emp.user_id})</option>
                            ))}
                        </Select>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-[#00d4ff] uppercase bg-[#324a5f]">
                            <tr>
                                {user.role === 'admin' && <th scope="col" className="px-6 py-3">User</th>}
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Date & Time</th>
                                <th scope="col" className="px-6 py-3">Location</th>
                                <th scope="col" className="px-6 py-3">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={user.role === 'admin' ? 5: 4} className="text-center py-4">Loading...</td></tr>
                            ) : activities.map((act) => (
                                <tr key={act.id} className="bg-[#2b3d50] border-b border-gray-700 hover:bg-gray-800/50">
                                    {user.role === 'admin' && <td className="px-6 py-4 font-medium text-white">{act.user_name || act.user_id}</td>}
                                    <td className="px-6 py-4">{formatActivityType(act.type)}</td>
                                    <td className="px-6 py-4">{new Date(act.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-4">{act.location}</td>
                                    <td className="px-6 py-4">{act.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isVisitModalOpen} onClose={handleSkipVisit} title="📝 Log Visit">
                <form onSubmit={handleLogVisit}>
                    <Input label="Client Name" id="client-name" value={visitDetails.client} onChange={e => setVisitDetails({...visitDetails, client: e.target.value})} required/>
                    <Input label="Visit Purpose" id="visit-purpose" value={visitDetails.purpose} onChange={e => setVisitDetails({...visitDetails, purpose: e.target.value})} required/>
                    <Input label="Visit Location (optional)" id="visit-location" placeholder={location?.address || "Enter location manually"} value={visitDetails.location} onChange={e => setVisitDetails({...visitDetails, location: e.target.value})} />
                    <div className="flex justify-end gap-4 mt-4">
                        <Button type="button" variant="danger" onClick={handleSkipVisit}>Skip</Button>
                        <Button type="submit" variant="success">Submit Visit</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DailyActivityScreen;