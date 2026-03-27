import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Heart, User, Bell, Menu, X, LogOut, LayoutDashboard, ShieldCheck, Wrench } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navbar = () => {
  const { user, profile, logout, notifications, markNotificationRead } = useApp();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/rooms', label: 'Explore', icon: Search },
    ...(profile?.role === 'student' ? [{ to: '/wishlist', label: 'Wishlist', icon: Heart }] : []),
    ...(profile?.role === 'admin' ? [{ to: '/admin', label: 'Admin Panel', icon: ShieldCheck }] : []),
    ...(profile?.role === 'admin' ? [{ to: '/system-setup', label: 'System Setup', icon: Wrench }] : []),
    ...(profile && profile.role !== 'admin' ? [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-neon-purple flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg gradient-text">RoomFinder</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link key={item.to} to={item.to}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                location.pathname === item.to ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-12 w-80 glass-strong rounded-2xl p-4 max-h-80 overflow-y-auto scrollbar-hide">
                    <h3 className="font-heading font-semibold mb-3">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No notifications</p>
                    ) : notifications.map(n => (
                      <div key={n.id} onClick={() => markNotificationRead(n.id)}
                        className={`p-3 rounded-xl mb-2 cursor-pointer ${n.read ? 'bg-secondary/30' : 'bg-primary/5 border border-primary/20'}`}>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {user && profile ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  <AvatarFallback><User className="w-4 h-4 text-primary" /></AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{profile.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{profile.role}</span>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-destructive/10 transition-colors">
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn-neon text-sm py-2">Sign In</Link>
          )}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-xl hover:bg-secondary">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="md:hidden overflow-hidden glass-strong border-t border-border">
            <div className="p-4 space-y-2">
              {navItems.map(item => (
                <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
