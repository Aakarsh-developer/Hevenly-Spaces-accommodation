import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Home, BookOpen, MessageCircle, Settings } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import OwnerRooms from '@/components/dashboard/OwnerRooms';
import OwnerBookings from '@/components/dashboard/OwnerBookings';
import AddRoomForm from '@/components/dashboard/AddRoomForm';
import StudentBookings from '@/components/dashboard/StudentBookings';
import ChatPanel from '@/components/dashboard/ChatPanel';
import ProfileSettings from '@/components/dashboard/ProfileSettings';

const Dashboard = () => {
  const { user, profile, loading } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      navigate('/auth');
      return;
    }

    if (!loading && profile?.role === 'admin') {
      navigate('/admin');
    }
  }, [loading, navigate, profile, user]);

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  if (!user || !profile) {
    return null;
  }

  const ownerTabs = [
    { id: 'overview', label: 'My Rooms', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: BookOpen },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'add', label: 'Add Room', icon: Plus },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const studentTabs = [
    { id: 'bookings', label: 'My Bookings', icon: BookOpen },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const tabs = profile.role === 'owner' ? ownerTabs : studentTabs;

  return (
    <div className="pt-20 pb-10">
      <div className="container mx-auto flex min-h-[calc(100svh-9rem)] flex-col px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold mb-1">
            {profile.role === 'owner' ? 'Owner' : 'Student'} <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mb-6">Welcome back, {profile.name}</p>
        </motion.div>

        <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground neon-glow-sm' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex-1 ${activeTab === 'chat' ? 'min-h-0' : ''}`}
          >
            {profile.role === 'owner' && activeTab === 'overview' && <OwnerRooms />}
            {profile.role === 'owner' && activeTab === 'bookings' && <OwnerBookings />}
            {profile.role === 'owner' && activeTab === 'add' && <AddRoomForm onSuccess={() => setActiveTab('overview')} />}
            {activeTab === 'chat' && <ChatPanel />}
            {profile.role === 'student' && activeTab === 'bookings' && <StudentBookings />}
            {activeTab === 'profile' && <ProfileSettings />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
