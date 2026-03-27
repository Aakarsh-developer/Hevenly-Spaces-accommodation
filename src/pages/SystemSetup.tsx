import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, CircleAlert, Database, Mail, MapPinned, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';

const checklist = [
  {
    title: 'Apply Supabase migrations',
    description: 'Run the latest migrations so seeded demo owners, demo rooms, moderation fields, and reports tables exist.',
    icon: Database,
  },
  {
    title: 'Deploy email functions',
    description: 'Deploy send-booking-request-email and send-admin-new-user-email from the supabase/functions folder.',
    icon: Mail,
  },
  {
    title: 'Configure SendGrid secrets',
    description: 'Set SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, and ADMIN_ALERT_EMAIL in Supabase secrets.',
    icon: Mail,
  },
  {
    title: 'Verify map and room data',
    description: 'Open a room detail page and confirm the map renders and seeded rooms appear on Home and Explore.',
    icon: MapPinned,
  },
];

const SystemSetup = () => {
  const { user, profile, loading, rooms, roomsLoaded } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      navigate('/auth');
    }
  }, [loading, navigate, profile?.role, user]);

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center"><p>Loading...</p></div>;
  if (!user || profile?.role !== 'admin') return null;

  const hasSeededRooms = rooms.length > 0;
  const hasSupabaseUrl = Boolean(import.meta.env.VITE_SUPABASE_URL);

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold mb-1">System <span className="gradient-text">Setup</span></h1>
          <p className="text-muted-foreground">Use this page to verify the backend setup after pulling the latest changes.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-5">
            <p className="text-sm text-muted-foreground mb-2">Supabase URL</p>
            <div className="flex items-center gap-2">
              {hasSupabaseUrl ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <CircleAlert className="w-5 h-5 text-amber-500" />}
              <span className="font-medium">{hasSupabaseUrl ? 'Configured' : 'Missing'}</span>
            </div>
          </div>
          <div className="glass p-5">
            <p className="text-sm text-muted-foreground mb-2">Rooms Loaded</p>
            <div className="flex items-center gap-2">
              {roomsLoaded ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <CircleAlert className="w-5 h-5 text-amber-500" />}
              <span className="font-medium">{roomsLoaded ? `${rooms.length} room(s)` : 'Loading'}</span>
            </div>
          </div>
          <div className="glass p-5">
            <p className="text-sm text-muted-foreground mb-2">Seeded Demo Data</p>
            <div className="flex items-center gap-2">
              {hasSeededRooms ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <CircleAlert className="w-5 h-5 text-amber-500" />}
              <span className="font-medium">{hasSeededRooms ? 'Available' : 'Not found yet'}</span>
            </div>
          </div>
        </div>

        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Checklist</h2>
          </div>
          <div className="space-y-4">
            {checklist.map((item) => (
              <div key={item.title} className="rounded-2xl bg-secondary/40 p-4">
                <div className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 space-y-3">
          <h2 className="font-heading text-xl font-semibold">Demo Accounts</h2>
          <p className="text-sm text-muted-foreground">After applying the seed migration, these demo owners should exist:</p>
          <div className="rounded-2xl bg-secondary/40 p-4 text-sm space-y-2">
            <p><span className="font-medium">Owner 1:</span> demo.owner1@havenly.local</p>
            <p><span className="font-medium">Owner 2:</span> demo.owner2@havenly.local</p>
            <p><span className="font-medium">Password:</span> Password123!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSetup;
