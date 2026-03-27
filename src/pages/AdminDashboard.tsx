import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Home, BookOpen, Trash2, BarChart3, TrendingUp, DollarSign, Building, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '@/contexts/AppContext';

const CHART_COLORS = ['#00c2ff', '#19c37d', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
  const {
    user,
    profile,
    loading,
    rooms,
    bookings,
    agreements,
    monthlyPaymentRequests,
    paymentTransactions,
    allUsers,
    roomReports,
    deleteRoom,
    deleteUser,
    updateRoomStatus,
    updateRoomApprovalStatus,
    fetchAllUsers,
    fetchRoomReports,
    updateUserRole,
    updateRoomReportStatus,
  } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !profile || profile.role !== 'admin')) {
      navigate('/auth');
      return;
    }

    if (profile?.role === 'admin') {
      void fetchAllUsers();
      void fetchRoomReports();
    }
  }, [fetchAllUsers, fetchRoomReports, loading, navigate, profile, user]);

  const analytics = useMemo(() => {
    const approvedRooms = rooms.filter((room) => room.approvalStatus === 'approved');
    const pendingRooms = rooms.filter((room) => room.approvalStatus === 'pending');
    const occupiedRooms = approvedRooms.filter((room) => room.status === 'occupied');
    const paidBookings = bookings.filter((booking) => booking.payment_status === 'paid');
    const failedPayments = bookings.filter((booking) => booking.payment_status === 'failed');
    const openReports = roomReports.filter((report) => report.status === 'open');
    const students = allUsers.filter((entry) => entry.role === 'student').length;
    const owners = allUsers.filter((entry) => entry.role === 'owner').length;
    const admins = allUsers.filter((entry) => entry.role === 'admin').length;

    const bookingStatusData = [
      { name: 'Pending', value: bookings.filter((booking) => booking.status === 'pending').length },
      { name: 'Accepted', value: bookings.filter((booking) => booking.status === 'accepted').length },
      { name: 'Rejected', value: bookings.filter((booking) => booking.status === 'rejected').length },
    ];

    const roomApprovalData = [
      { name: 'Approved', value: approvedRooms.length },
      { name: 'Pending', value: pendingRooms.length },
      { name: 'Rejected', value: rooms.filter((room) => room.approvalStatus === 'rejected').length },
    ];

    const userRoleData = [
      { name: 'Students', value: students },
      { name: 'Owners', value: owners },
      { name: 'Admins', value: admins },
    ];

    const monthlyRevenueData = (() => {
      const monthMap = new Map<string, number>();
      paidBookings.forEach((booking) => {
        const room = rooms.find((item) => item.id === booking.room_id);
        const monthLabel = new Date(booking.paid_at || booking.created_at).toLocaleDateString(undefined, { month: 'short' });
        monthMap.set(monthLabel, (monthMap.get(monthLabel) || 0) + (room?.price || 0));
      });
      return Array.from(monthMap.entries()).map(([name, value]) => ({ name, value }));
    })();

    const cityInventoryData = Array.from(
      rooms.reduce((map, room) => {
        map.set(room.city, (map.get(room.city) || 0) + 1);
        return map;
      }, new Map<string, number>()),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      approvedRooms,
      pendingRooms,
      occupiedRooms,
      paidBookings,
      failedPayments,
      openReports,
      bookingStatusData,
      roomApprovalData,
      userRoleData,
      monthlyRevenueData,
      cityInventoryData,
      occupancyRate: approvedRooms.length > 0 ? Math.round((occupiedRooms.length / approvedRooms.length) * 100) : 0,
      averageRoomPrice: rooms.length > 0 ? Math.round(rooms.reduce((sum, room) => sum + room.price, 0) / rooms.length) : 0,
      averageRating: approvedRooms.length > 0 ? (approvedRooms.reduce((sum, room) => sum + room.rating, 0) / approvedRooms.length).toFixed(1) : '0.0',
      collectedRevenue: paidBookings.reduce((sum, booking) => sum + (rooms.find((item) => item.id === booking.room_id)?.price || 0), 0),
    };
  }, [allUsers, bookings, roomReports, rooms]);

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center"><p>Loading...</p></div>;
  if (!user || !profile || profile.role !== 'admin') return null;

  const stats = [
    { label: 'Total Rooms', value: rooms.length, icon: Building, color: 'from-primary to-neon-blue' },
    { label: 'Pending Approval', value: analytics.pendingRooms.length, icon: Home, color: 'from-amber-500 to-orange-500' },
    { label: 'Open Reports', value: analytics.openReports.length, icon: ShieldAlert, color: 'from-rose-500 to-orange-500' },
    { label: 'Total Users', value: allUsers.length, icon: Users, color: 'from-neon-purple to-primary' },
    { label: 'Active Bookings', value: bookings.filter((booking) => booking.status === 'accepted').length, icon: TrendingUp, color: 'from-neon-cyan to-primary' },
    { label: 'Collected Revenue', value: `Rs${analytics.collectedRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-emerald-500 to-neon-cyan' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'rooms', label: 'Rooms', icon: Home },
    { id: 'reports', label: 'Reports', icon: ShieldAlert },
    { id: 'bookings', label: 'Bookings', icon: BookOpen },
  ];

  const handleRoleChange = async (userId: string, role: 'student' | 'owner' | 'admin') => {
    setUpdatingUserId(userId);
    const success = await updateUserRole(userId, role);
    setUpdatingUserId(null);

    if (success) {
      toast.success('User role updated');
      return;
    }

    toast.error('Failed to update user role');
  };

  const handleRoomApprovalChange = async (roomId: string, approvalStatus: string) => {
    setUpdatingRoomId(roomId);
    const success = await updateRoomApprovalStatus(roomId, approvalStatus);
    setUpdatingRoomId(null);

    if (success) {
      toast.success(`Room ${approvalStatus}`);
      return;
    }

    toast.error('Failed to update room approval');
  };

  const handleReportStatusChange = async (reportId: string, status: string) => {
    const success = await updateRoomReportStatus(reportId, status);
    if (success) {
      toast.success(`Report marked ${status}`);
      return;
    }

    toast.error('Failed to update report');
  };

  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId);
    if (success) {
      toast.success('User deleted successfully');
      return;
    }

    toast.error('Failed to delete user');
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold mb-1">Admin <span className="gradient-text">Dashboard</span></h1>
          <p className="text-muted-foreground mb-6">Manage the platform, monitor live activity, and moderate listings.</p>
        </motion.div>

        <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground neon-glow-sm' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="glass p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                          <stat.icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                      </div>
                      <p className="text-2xl font-heading font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="glass p-6 xl:col-span-2">
                    <h3 className="font-heading font-semibold mb-4">Recent Bookings</h3>
                    {bookings.slice(0, 5).map((booking) => {
                      const room = rooms.find((item) => item.id === booking.room_id);
                      return (
                        <div key={booking.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm font-medium">{booking.student_name}</p>
                            <p className="text-xs text-muted-foreground">{room?.title || 'Unknown'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.status === 'pending' ? 'status-pending' : booking.status === 'accepted' ? 'status-available' : 'status-occupied'}`}>
                            {booking.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="glass p-6">
                    <h3 className="font-heading font-semibold mb-4">Platform Snapshot</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Occupancy Rate</span>
                        <span className="font-semibold">{analytics.occupancyRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Avg Room Price</span>
                        <span className="font-semibold">Rs{analytics.averageRoomPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Avg Approved Rating</span>
                        <span className="font-semibold">{analytics.averageRating}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Paid Bookings</span>
                        <span className="font-semibold">{analytics.paidBookings.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Open Reports</span>
                        <span className="font-semibold">{analytics.openReports.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="glass p-6">
                    <h3 className="font-heading font-semibold mb-4">Booking Status Mix</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.bookingStatusData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis allowDecimals={false} stroke="#94a3b8" />
                          <Tooltip />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {analytics.bookingStatusData.map((entry, index) => (
                              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass p-6">
                    <h3 className="font-heading font-semibold mb-4">Room Approval Mix</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analytics.roomApprovalData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
                            {analytics.roomApprovalData.map((entry, index) => (
                              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="glass p-6">
                    <h3 className="font-heading font-semibold mb-4">Revenue by Month</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.monthlyRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#19c37d" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass p-6">
                    <h3 className="font-heading font-semibold mb-4">Top Cities by Inventory</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.cityInventoryData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis type="number" stroke="#94a3b8" allowDecimals={false} />
                          <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#00c2ff" radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="glass p-6 xl:col-span-2">
                    <h3 className="font-heading font-semibold mb-4">User Distribution</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analytics.userRoleData} dataKey="value" nameKey="name" outerRadius={110}>
                            {analytics.userRoleData.map((entry, index) => (
                              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass p-6">
                    <h3 className="font-heading font-semibold mb-4">Trend Summary</h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Moderation Load</p>
                        <p className="font-medium">{analytics.pendingRooms.length} rooms pending approval and {analytics.openReports.length} open reports.</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Marketplace Health</p>
                        <p className="font-medium">{analytics.occupancyRate}% of approved rooms are occupied, with average rating {analytics.averageRating}.</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monetization</p>
                        <p className="font-medium">{analytics.paidBookings.length} bookings have been paid, totaling Rs{analytics.collectedRevenue.toLocaleString()}.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="glass p-6">
                <h3 className="font-heading font-semibold mb-4">All Users ({allUsers.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 font-medium text-muted-foreground">Name</th>
                        <th className="pb-3 font-medium text-muted-foreground">Email</th>
                        <th className="pb-3 font-medium text-muted-foreground">Role</th>
                        <th className="pb-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((item) => (
                        <tr key={item.id} className="border-b border-border/50 last:border-0">
                          <td className="py-3 font-medium">{item.name}</td>
                          <td className="py-3 text-muted-foreground">{item.email}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.role === 'admin' ? 'bg-neon-purple/10 text-neon-purple' : item.role === 'owner' ? 'bg-primary/10 text-primary' : 'bg-neon-cyan/10 text-neon-cyan'}`}>
                                {item.role}
                              </span>
                              <select
                                value={item.role}
                                onChange={(e) => void handleRoleChange(item.id, e.target.value as 'student' | 'owner' | 'admin')}
                                disabled={updatingUserId === item.id || item.id === user.id}
                                className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground disabled:opacity-60"
                              >
                                <option value="student">Student</option>
                                <option value="owner">Owner</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-3">
                            {item.role !== 'admin' && (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => void handleDeleteUser(item.id)}
                                className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Admins can change any user role here. Your own admin role is locked to prevent accidental lockout.</p>
              </div>
            )}

            {activeTab === 'rooms' && (
              <div className="space-y-4">
                <h3 className="font-heading font-semibold">All Rooms ({rooms.length})</h3>
                {rooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass p-4 flex flex-col md:flex-row gap-4"
                  >
                    <img src={room.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'} alt={room.title} className="w-full md:w-36 h-24 object-cover rounded-xl" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading font-semibold text-sm truncate">{room.title}</h4>
                      <p className="text-xs text-muted-foreground">{room.ownerName} • {room.area}, {room.city} • Rs{room.price.toLocaleString()}/mo</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${room.status === 'available' ? 'status-available' : 'status-occupied'}`}>
                          {room.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          room.approvalStatus === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : room.approvalStatus === 'rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'status-pending'
                        }`}>
                          {room.approvalStatus}
                        </span>
                        <button
                          onClick={() => updateRoomStatus(room.id, room.status === 'available' ? 'occupied' : 'available')}
                          className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Toggle Availability
                        </button>
                        <button
                          onClick={() => void handleRoomApprovalChange(room.id, 'approved')}
                          disabled={updatingRoomId === room.id || room.approvalStatus === 'approved'}
                          className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => void handleRoomApprovalChange(room.id, 'rejected')}
                          disabled={updatingRoomId === room.id || room.approvalStatus === 'rejected'}
                          className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteRoom(room.id)}
                      className="self-start p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="glass p-6">
                <h3 className="font-heading font-semibold mb-4">Room Reports ({roomReports.length})</h3>
                {roomReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reports yet.</p>
                ) : (
                  <div className="space-y-3">
                    {roomReports.map((report) => (
                      <div key={report.id} className="rounded-xl bg-secondary/50 p-4 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{report.room_title}</p>
                            <p className="text-xs text-muted-foreground">Reported by {report.reporter_name} on {new Date(report.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${report.status === 'open' ? 'status-pending' : report.status === 'resolved' ? 'status-available' : 'bg-secondary text-muted-foreground'}`}>
                            {report.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Reason</p>
                          <p className="text-sm">{report.reason}</p>
                        </div>
                        {report.details && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Details</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.details}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => void handleReportStatusChange(report.id, 'reviewed')}
                            disabled={report.status === 'reviewed'}
                            className="text-xs px-3 py-1 rounded-full bg-secondary border border-border disabled:opacity-60"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => void handleReportStatusChange(report.id, 'resolved')}
                            disabled={report.status === 'resolved'}
                            className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 disabled:opacity-60"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => void handleRoomApprovalChange(report.room_id, 'rejected')}
                            className="text-xs px-3 py-1 rounded-full bg-destructive/10 text-destructive"
                          >
                            Reject Room
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="glass p-6">
                <h3 className="font-heading font-semibold mb-4">All Bookings ({bookings.length})</h3>
                {bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bookings yet.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => {
                      const room = rooms.find((item) => item.id === booking.room_id);
                      return (
                        <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-secondary/50 gap-3">
                          <div>
                            <p className="text-sm font-medium">{booking.student_name} to {room?.title || 'Deleted Room'}</p>
                            <p className="text-xs text-muted-foreground">Owner: {room?.ownerName || 'N/A'} • {new Date(booking.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${booking.status === 'pending' ? 'status-pending' : booking.status === 'accepted' ? 'status-available' : 'status-occupied'}`}>
                            {booking.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
