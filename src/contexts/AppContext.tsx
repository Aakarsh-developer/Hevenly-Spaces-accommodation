import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { notifyAdminNewUserEmail, notifyBookingRequestEmail } from '@/lib/emailNotifications';
import { processRazorpayPayment } from '@/lib/paymentGateway';

export type AppRole = 'student' | 'owner' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: AppRole;
}

export interface Room {
  id: string;
  owner_id: string;
  ownerName?: string;
  roomType: string;
  approvalStatus: string;
  title: string;
  description: string;
  price: number;
  city: string;
  area: string;
  college?: string;
  latitude: number;
  longitude: number;
  images: string[];
  facilities: string[];
  status: string;
  rating: number;
  reviewCount: number;
  nearbyPlaces?: string[];
  created_at: string;
}

export interface AddRoomInput {
  title: string;
  description: string;
  price: number;
  city: string;
  area: string;
  college?: string;
  latitude: number;
  longitude: number;
  images: string[];
  facilities: string[];
  roomType: string;
  status: string;
  approvalStatus?: string;
  nearbyPlaces?: string[];
}

export interface Booking {
  id: string;
  room_id: string;
  student_id: string;
  owner_id: string;
  status: string;
  payment_status?: string;
  payment_reference?: string | null;
  paid_at?: string | null;
  created_at: string;
  student_last_read_at?: string | null;
  owner_last_read_at?: string | null;
  room?: Room;
  student_name?: string;
  owner_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface Agreement {
  id: string;
  booking_id: string;
  room_id: string;
  student_id: string;
  owner_id: string;
  monthly_rent: number;
  start_date: string;
  duration_months: number;
  rules: string[];
  content: string;
  owner_accepted: boolean;
  student_accepted: boolean;
  generated_at: string;
  updated_at: string;
}

export interface MonthlyPaymentRequest {
  id: string;
  booking_id: string;
  owner_id: string;
  student_id: string;
  due_month: string;
  due_date: string;
  amount: number;
  status: string;
  payment_reference?: string | null;
  transaction_id?: string | null;
  created_at: string;
  paid_at?: string | null;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
}

export interface PaymentTransaction {
  id: string;
  booking_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  kind: string;
  provider: string;
  status: string;
  reference: string;
  payment_request_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  room_id: string;
  booking_id: string;
  student_id: string;
  rating: number;
  comment: string;
  created_at: string;
  student_name?: string;
}

export interface RoomReport {
  id: string;
  room_id: string;
  reporter_id: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
  room_title?: string;
  reporter_name?: string;
}

interface AppContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  roomsLoaded: boolean;
  roomsError: string | null;
  wishlistLoaded: boolean;
  roomReviews: Review[];
  roomReports: RoomReport[];
  rooms: Room[];
  bookings: Booking[];
  agreements: Agreement[];
  monthlyPaymentRequests: MonthlyPaymentRequest[];
  paymentTransactions: PaymentTransaction[];
  notifications: Notification[];
  wishlist: string[];
  chatMessagesByBooking: Record<string, ChatMessage[]>;
  chatLoadingByBooking: Record<string, boolean>;
  chatHasLoadedByBooking: Record<string, boolean>;
  allUsers: Profile[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, role: AppRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  updateProfile: (updates: { name: string; avatar_url?: string }) => Promise<boolean>;
  fetchRooms: () => Promise<void>;
  uploadRoomImages: (files: File[]) => Promise<string[]>;
  addRoom: (room: AddRoomInput) => Promise<boolean>;
  updateRoomStatus: (roomId: string, status: string) => Promise<void>;
  updateRoomApprovalStatus: (roomId: string, approvalStatus: string) => Promise<boolean>;
  deleteRoom: (roomId: string) => Promise<void>;
  bookRoom: (roomId: string) => Promise<boolean>;
  updateBookingStatus: (bookingId: string, status: string) => Promise<void>;
  completeBookingPayment: (bookingId: string) => Promise<boolean>;
  acceptAgreement: (agreementId: string) => Promise<boolean>;
  createMonthlyPaymentRequest: (bookingId: string) => Promise<boolean>;
  payMonthlyPaymentRequest: (requestId: string) => Promise<boolean>;
  confirmMonthlyPaymentRequest: (requestId: string) => Promise<boolean>;
  toggleWishlist: (roomId: string) => Promise<void>;
  sendMessage: (bookingId: string, content: string) => Promise<void>;
  fetchMessages: (bookingId: string) => Promise<void>;
  markConversationRead: (bookingId: string) => Promise<void>;
  fetchReviews: (roomId: string) => Promise<void>;
  submitReview: (bookingId: string, rating: number, comment: string) => Promise<boolean>;
  fetchRoomReports: () => Promise<void>;
  submitRoomReport: (roomId: string, reason: string, details: string) => Promise<boolean>;
  updateRoomReportStatus: (reportId: string, status: string) => Promise<boolean>;
  markNotificationRead: (id: string) => Promise<void>;
  fetchBookings: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: AppRole) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
}

type RoomRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  price: number;
  city: string;
  area: string;
  approval_status: string;
  college: string | null;
  latitude: number;
  longitude: number;
  images: string[];
  facilities: string[];
  room_type: string;
  status: string;
  rating: number;
  review_count: number;
  nearby_places: string[] | null;
  created_at: string;
};

type AgreementRow = {
  id: string;
  booking_id: string;
  room_id: string;
  student_id: string;
  owner_id: string;
  monthly_rent: number;
  start_date: string;
  duration_months: number;
  rules: string[];
  content: string;
  owner_accepted: boolean;
  student_accepted: boolean;
  generated_at: string;
  updated_at: string;
};

type MonthlyPaymentRequestRow = {
  id: string;
  booking_id: string;
  owner_id: string;
  student_id: string;
  due_month: string;
  due_date: string;
  amount: number;
  status: string;
  payment_reference: string | null;
  transaction_id: string | null;
  created_at: string;
  paid_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
};

type PaymentTransactionRow = {
  id: string;
  booking_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  kind: string;
  provider: string;
  status: string;
  reference: string;
  payment_request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomsLoaded, setRoomsLoaded] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);
  const [roomReviews, setRoomReviews] = useState<Review[]>([]);
  const [roomReports, setRoomReports] = useState<RoomReport[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [monthlyPaymentRequests, setMonthlyPaymentRequests] = useState<MonthlyPaymentRequest[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [chatMessagesByBooking, setChatMessagesByBooking] = useState<Record<string, ChatMessage[]>>({});
  const [chatLoadingByBooking, setChatLoadingByBooking] = useState<Record<string, boolean>>({});
  const [chatHasLoadedByBooking, setChatHasLoadedByBooking] = useState<Record<string, boolean>>({});
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const bookingsRef = useRef<Booking[]>([]);
  const profileRef = useRef<Profile | null>(null);
  const userRef = useRef<SupabaseUser | null>(null);
  const chatMessagesRef = useRef<Record<string, ChatMessage[]>>({});
  const chatHasLoadedRef = useRef<Record<string, boolean>>({});
  const chatLoadingRef = useRef<Record<string, boolean>>({});
  const chatFetchInFlightRef = useRef<Record<string, boolean>>({});
  const chatRealtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const mergeConversationMessages = useCallback((bookingId: string, incomingMessages: ChatMessage[]) => {
    setChatMessagesByBooking((prev) => {
      const current = prev[bookingId] || [];
      const deduped = new Map<string, ChatMessage>();
      [...current, ...incomingMessages].forEach((message) => {
        deduped.set(message.id, message);
      });

      return {
        ...prev,
        [bookingId]: Array.from(deduped.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
      };
    });
  }, []);

  const mapRoom = useCallback((room: RoomRow, ownerName?: string): Room => {
    const rawStatus = (room.status || 'available').toLowerCase();
    const rawApproval = (room.approval_status || '').toLowerCase();
    const inferredApprovalStatus = rawApproval || (
      rawStatus === 'approved' || rawStatus === 'pending' || rawStatus === 'rejected'
        ? rawStatus
        : 'approved'
    );
    const normalizedStatus = rawStatus === 'approved' || rawStatus === 'pending' || rawStatus === 'rejected'
      ? 'available'
      : rawStatus === 'occupied'
        ? 'occupied'
        : 'available';

    return {
      id: room.id,
      owner_id: room.owner_id,
      ownerName: ownerName || 'Unknown',
      roomType: room.room_type,
      approvalStatus: inferredApprovalStatus,
      title: room.title,
      description: room.description || '',
      price: room.price,
      city: room.city,
      area: room.area,
      college: room.college || undefined,
      latitude: room.latitude,
      longitude: room.longitude,
      images: room.images || [],
      facilities: room.facilities || [],
      status: normalizedStatus,
      rating: room.rating,
      reviewCount: room.review_count,
      nearbyPlaces: room.nearby_places || [],
      created_at: room.created_at,
    };
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userId).single();

    if (profileData) {
      const nextProfile: Profile = {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        avatar_url: profileData.avatar_url,
        role: (roleData?.role as AppRole) || 'student',
      };
      setProfile(nextProfile);
      return nextProfile;
    }

    setProfile(null);
    return null;
  }, []);

  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    chatMessagesRef.current = chatMessagesByBooking;
  }, [chatMessagesByBooking]);

  useEffect(() => {
    chatHasLoadedRef.current = chatHasLoadedByBooking;
  }, [chatHasLoadedByBooking]);

  useEffect(() => {
    chatLoadingRef.current = chatLoadingByBooking;
  }, [chatLoadingByBooking]);

  const fetchRooms = useCallback(async () => {
    setRoomsLoaded(false);
    setRoomsError(null);

    const { data, error } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
    if (error) {
      setRooms([]);
      setRoomsError(error.message);
      setRoomsLoaded(true);
      return;
    }

    if (!data) {
      setRooms([]);
      setRoomsLoaded(true);
      return;
    }

    const ownerIds = [...new Set(data.map((room) => room.owner_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', ownerIds);
    const profileMap = new Map(profiles?.map((item) => [item.id, item.name]) || []);

    setRooms(data.map((room) => mapRoom(room, profileMap.get(room.owner_id))));
    setRoomsLoaded(true);
  }, [mapRoom]);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setWishlistLoaded(true);
      return;
    }

    setWishlistLoaded(false);
    const { data } = await supabase.from('wishlists').select('room_id').eq('user_id', user.id);
    setWishlist((data || []).map((item) => item.room_id));
    setWishlistLoaded(true);
  }, [user]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (profile?.role !== 'admin') {
      query = query.or(`student_id.eq.${user.id},owner_id.eq.${user.id}`);
    }

    const { data } = await query;
    if (!data) {
      setBookings([]);
      return;
    }

    const studentIds = [...new Set(data.map((booking) => booking.student_id))];
    const ownerIds = [...new Set(data.map((booking) => booking.owner_id))];
    const roomIds = [...new Set(data.map((booking) => booking.room_id))];
    const bookingIds = data.map((booking) => booking.id);
    const allProfileIds = [...new Set([...studentIds, ...ownerIds])];

    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', allProfileIds);
    const { data: roomRows } = await supabase.from('rooms').select('*').in('id', roomIds);
    const { data: messageRows } = bookingIds.length > 0
      ? await supabase.from('chat_messages').select('booking_id, sender_id, content, created_at').in('booking_id', bookingIds).order('created_at', { ascending: false })
      : { data: [] };

    const profileMap = new Map(profiles?.map((item) => [item.id, item.name]) || []);
    const roomMap = new Map(
      (roomRows || []).map((room) => [room.id, mapRoom(room, profileMap.get(room.owner_id))]),
    );
    const messagesByBooking = new Map<string, Array<{ booking_id: string; sender_id: string; content: string; created_at: string }>>();
    (messageRows || []).forEach((message) => {
      const existingMessages = messagesByBooking.get(message.booking_id) || [];
      existingMessages.push(message);
      messagesByBooking.set(message.booking_id, existingMessages);
    });

    setBookings(data.map((booking) => ({
      id: booking.id,
      room_id: booking.room_id,
      student_id: booking.student_id,
      owner_id: booking.owner_id,
      status: booking.status,
      payment_status: 'payment_status' in booking ? booking.payment_status : 'unpaid',
      payment_reference: 'payment_reference' in booking ? booking.payment_reference : null,
      paid_at: 'paid_at' in booking ? booking.paid_at : null,
      created_at: booking.created_at,
      student_last_read_at: 'student_last_read_at' in booking ? booking.student_last_read_at : null,
      owner_last_read_at: 'owner_last_read_at' in booking ? booking.owner_last_read_at : null,
      room: roomMap.get(booking.room_id),
      student_name: profileMap.get(booking.student_id) || 'Unknown',
      owner_name: profileMap.get(booking.owner_id) || 'Unknown',
      last_message: messagesByBooking.get(booking.id)?.[0]?.content,
      last_message_at: messagesByBooking.get(booking.id)?.[0]?.created_at,
      unread_count: (messagesByBooking.get(booking.id) || []).filter((message) => {
        const lastReadAt = booking.student_id === user.id ? booking.student_last_read_at : booking.owner_last_read_at;
        return message.sender_id !== user.id && (!lastReadAt || new Date(message.created_at) > new Date(lastReadAt));
      }).length,
    })));
  }, [mapRoom, profile?.role, user]);

  const fetchAgreements = useCallback(async () => {
    if (!user) {
      setAgreements([]);
      return;
    }

    let query = supabase.from('agreements').select('*').order('generated_at', { ascending: false });
    if (profile?.role !== 'admin') {
      query = query.or(`student_id.eq.${user.id},owner_id.eq.${user.id}`);
    }

    const { data } = await query;
    setAgreements((data || []) as AgreementRow[]);
  }, [profile?.role, user]);

  const fetchMonthlyPaymentRequests = useCallback(async () => {
    if (!user) {
      setMonthlyPaymentRequests([]);
      return;
    }

    let query = supabase.from('monthly_payment_requests').select('*').order('due_month', { ascending: false });
    if (profile?.role !== 'admin') {
      query = query.or(`student_id.eq.${user.id},owner_id.eq.${user.id}`);
    }

    const { data } = await query;
    setMonthlyPaymentRequests((data || []) as MonthlyPaymentRequestRow[]);
  }, [profile?.role, user]);

  const fetchPaymentTransactions = useCallback(async () => {
    if (!user) {
      setPaymentTransactions([]);
      return;
    }

    let query = supabase.from('payment_transactions').select('*').order('created_at', { ascending: false });
    if (profile?.role !== 'admin') {
      query = query.or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`);
    }

    const { data } = await query;
    setPaymentTransactions((data || []) as PaymentTransactionRow[]);
  }, [profile?.role, user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!data) {
      setNotifications([]);
      return;
    }

    setNotifications(data.map((notification) => ({
      id: notification.id,
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      created_at: notification.created_at,
    })));
  }, [user]);

  const fetchAllUsers = useCallback(async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (!profiles) {
      setAllUsers([]);
      return;
    }

    const { data: roles } = await supabase.from('user_roles').select('*');
    const roleMap = new Map(roles?.map((role) => [role.user_id, role.role as AppRole]) || []);

    setAllUsers(profiles.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      avatar_url: item.avatar_url,
      role: roleMap.get(item.id) || 'student',
    })));
  }, []);

  const fetchReviews = useCallback(async (roomId: string) => {
    const { data } = await supabase.from('reviews').select('*').eq('room_id', roomId).order('created_at', { ascending: false });
    if (!data) {
      setRoomReviews([]);
      return;
    }

    const studentIds = [...new Set(data.map((review) => review.student_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', studentIds);
    const profileMap = new Map(profiles?.map((item) => [item.id, item.name]) || []);

    setRoomReviews(data.map((review) => ({
      id: review.id,
      room_id: review.room_id,
      booking_id: review.booking_id,
      student_id: review.student_id,
      rating: review.rating,
      comment: review.comment || '',
      created_at: review.created_at,
      student_name: profileMap.get(review.student_id) || 'Unknown',
    })));
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          void fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setWishlist([]);
        setWishlistLoaded(true);
        setChatMessagesByBooking({});
        setChatLoadingByBooking({});
        setChatHasLoadedByBooking({});
        chatMessagesRef.current = {};
        chatLoadingRef.current = {};
        chatHasLoadedRef.current = {};
        chatFetchInFlightRef.current = {};
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
        setWishlistLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    void fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (user && profile) {
      void fetchBookings();
      void fetchAgreements();
      void fetchMonthlyPaymentRequests();
      void fetchPaymentTransactions();
      void fetchNotifications();
      void fetchWishlist();
    } else if (!user) {
      setBookings([]);
      setAgreements([]);
      setMonthlyPaymentRequests([]);
      setPaymentTransactions([]);
      setNotifications([]);
      setWishlist([]);
      setWishlistLoaded(true);
    }
  }, [fetchAgreements, fetchBookings, fetchMonthlyPaymentRequests, fetchNotifications, fetchPaymentTransactions, fetchWishlist, profile, user]);

  useEffect(() => {
    if (chatRealtimeChannelRef.current) return;

    chatRealtimeChannelRef.current = supabase
      .channel('chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new as { id: string; booking_id: string; sender_id: string; content: string; created_at: string };
        const liveBookings = bookingsRef.current;
        const liveProfile = profileRef.current;
        const liveUser = userRef.current;
        const relatedBooking = liveBookings.find((booking) => booking.id === newMsg.booking_id);
        const senderName = newMsg.sender_id === liveUser?.id
          ? liveProfile?.name || 'You'
          : relatedBooking?.student_id === newMsg.sender_id
            ? relatedBooking?.student_name || 'Unknown'
            : relatedBooking?.owner_name || 'Unknown';

        console.debug('[chat] realtime message', { bookingId: newMsg.booking_id, messageId: newMsg.id });

        mergeConversationMessages(newMsg.booking_id, [{
          id: newMsg.id,
          booking_id: newMsg.booking_id,
          sender_id: newMsg.sender_id,
          sender_name: senderName,
          content: newMsg.content,
          created_at: newMsg.created_at,
        }]);
        setBookings((prev) => prev.map((booking) => {
          if (booking.id !== newMsg.booking_id) return booking;
          const nextUnread = newMsg.sender_id === liveUser?.id ? booking.unread_count || 0 : (booking.unread_count || 0) + 1;
          return {
            ...booking,
            last_message: newMsg.content,
            last_message_at: newMsg.created_at,
            unread_count: nextUnread,
          };
        }));
      })
      .subscribe();

    return () => {
      if (chatRealtimeChannelRef.current) {
        void supabase.removeChannel(chatRealtimeChannelRef.current);
        chatRealtimeChannelRef.current = null;
      }
    };
  }, [mergeConversationMessages]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notif-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        const next = payload.new as Notification;
        setNotifications((prev) => [next, ...prev]);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const signup = async (name: string, email: string, password: string, role: AppRole) => {
    const safeRole: Exclude<AppRole, 'admin'> = role === 'owner' ? 'owner' : 'student';
    const registrationDate = new Date().toISOString();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: safeRole } },
    });
    if (error) return { success: false, error: error.message };

    void notifyAdminNewUserEmail({
      userName: name,
      userEmail: email,
      role: safeRole,
      registrationDate,
    });

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setBookings([]);
    setAgreements([]);
    setMonthlyPaymentRequests([]);
    setPaymentTransactions([]);
    setNotifications([]);
    setChatMessagesByBooking({});
    setChatLoadingByBooking({});
    setChatHasLoadedByBooking({});
    chatMessagesRef.current = {};
    chatLoadingRef.current = {};
    chatHasLoadedRef.current = {};
    chatFetchInFlightRef.current = {};
    setWishlist([]);
    setRoomReviews([]);
    setRoomReports([]);
    setWishlistLoaded(true);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return null;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filePath = `${user.id}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('avatars').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) return null;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const updateProfile = async (updates: { name: string; avatar_url?: string }) => {
    if (!user || !profile) return false;

    const payload = {
      name: updates.name,
      avatar_url: updates.avatar_url ?? profile.avatar_url ?? null,
    };

    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    if (error) return false;

    setProfile((prev) => prev ? { ...prev, ...payload } : prev);
    setAllUsers((prev) => prev.map((item) => item.id === user.id ? { ...item, ...payload } : item));
    return true;
  };

  const uploadRoomImages = async (files: File[]) => {
    if (!user || files.length === 0) return [];

    const uploadedUrls: string[] = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const filePath = `${user.id}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('room-images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        return [];
      }

      const { data } = supabase.storage.from('room-images').getPublicUrl(filePath);
      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const addRoom = async (room: AddRoomInput) => {
    if (!user) return false;

    const { error } = await supabase.from('rooms').insert({
      owner_id: user.id,
      title: room.title,
      description: room.description,
      price: room.price,
      city: room.city,
      area: room.area,
      college: room.college || null,
      latitude: room.latitude,
      longitude: room.longitude,
      images: room.images,
      facilities: room.facilities,
      room_type: room.roomType,
      status: room.status,
      approval_status: room.approvalStatus || 'pending',
      nearby_places: room.nearbyPlaces || [],
    });

    if (error) return false;
    await fetchRooms();
    return true;
  };

  const updateRoomStatus = async (roomId: string, status: string) => {
    await supabase.from('rooms').update({ status }).eq('id', roomId);
    setRooms((prev) => prev.map((room) => room.id === roomId ? { ...room, status } : room));
  };

  const updateRoomApprovalStatus = async (roomId: string, approvalStatus: string) => {
    const { error } = await supabase.from('rooms').update({ approval_status: approvalStatus }).eq('id', roomId);
    if (error) return false;

    setRooms((prev) => prev.map((room) => room.id === roomId ? { ...room, approvalStatus } : room));
    return true;
  };

  const deleteRoom = async (roomId: string) => {
    await supabase.from('rooms').delete().eq('id', roomId);
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
    setWishlist((prev) => prev.filter((id) => id !== roomId));
  };

  const bookRoom = async (roomId: string) => {
    if (!user) return false;

    const room = rooms.find((item) => item.id === roomId);
    if (!room || room.status !== 'available' || room.approvalStatus !== 'approved') return false;

    const existing = bookings.find((booking) => booking.room_id === roomId && booking.student_id === user.id && booking.status !== 'rejected');
    if (existing) return false;

    const { error } = await supabase.from('bookings').insert({
      room_id: roomId,
      student_id: user.id,
      owner_id: room.owner_id,
      status: 'pending',
      payment_status: 'pending',
    });

    if (error) return false;

    await supabase.from('notifications').insert({
      user_id: room.owner_id,
      title: 'New Booking Request',
      message: `${profile?.name || 'A student'} wants to book "${room.title}"`,
    });

    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', room.owner_id)
      .single();

    if (ownerProfile?.email) {
      void notifyBookingRequestEmail({
        ownerEmail: ownerProfile.email,
        ownerName: ownerProfile.name,
        requesterName: profile?.name || 'Student',
        requesterEmail: profile?.email || user.email || 'Unknown',
        roomTitle: room.title,
        roomLocation: `${room.area}, ${room.city}`,
        bookingDate: new Date().toISOString(),
      });
    }

    await fetchBookings();
    return true;
  };

  const generateAgreementContent = useCallback((booking: Booking, room: Room) => {
    const startDate = new Date().toLocaleDateString();
    return [
      'Rental Agreement',
      `Room: ${room.title}`,
      `Location: ${room.area}, ${room.city}`,
      `Monthly Rent: Rs${room.price.toLocaleString()}`,
      `Tenant: ${booking.student_name || 'Student'}`,
      `Owner: ${booking.owner_name || room.ownerName || 'Owner'}`,
      `Start Date: ${startDate}`,
      'Duration: 11 months',
      'Rules:',
      '- Rent must be paid on time every month',
      '- No property damage is allowed',
      '- Follow building and community rules',
    ].join('\n');
  }, []);

  const createAgreementForBooking = useCallback(async (booking: Booking) => {
    const room = booking.room || rooms.find((item) => item.id === booking.room_id);
    if (!room) return false;

    const { error } = await supabase.from('agreements').upsert({
      booking_id: booking.id,
      room_id: booking.room_id,
      student_id: booking.student_id,
      owner_id: booking.owner_id,
      monthly_rent: room.price,
      start_date: new Date().toISOString().slice(0, 10),
      duration_months: 11,
      content: generateAgreementContent(booking, room),
      rules: [
        'Rent must be paid on time every month',
        'No property damage is allowed',
        'Follow building and community rules',
      ],
      owner_accepted: true,
      student_accepted: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'booking_id' });

    if (error) return false;

    await fetchAgreements();
    return true;
  }, [fetchAgreements, generateAgreementContent, rooms]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const booking = bookings.find((item) => item.id === bookingId);
    const updatePayload = status === 'accepted'
      ? { status, payment_status: 'pending' }
      : { status };

    await supabase.from('bookings').update(updatePayload).eq('id', bookingId);

    if (booking && status === 'accepted') {
      await supabase.from('bookings')
        .update({ status: 'rejected' })
        .eq('room_id', booking.room_id)
        .eq('status', 'pending')
        .neq('id', bookingId);

      await supabase.from('rooms').update({ status: 'occupied' }).eq('id', booking.room_id);
      await createAgreementForBooking(booking);
      await supabase.from('notifications').insert({
        user_id: booking.student_id,
        title: 'Booking Accepted!',
        message: 'Your booking has been accepted. Proceed to payment and review your rental agreement.',
      });
    }

    if (booking && status === 'rejected') {
      await supabase.from('notifications').insert({
        user_id: booking.student_id,
        title: 'Booking Rejected',
        message: 'Unfortunately, your booking was rejected.',
      });
    }

    await Promise.all([fetchBookings(), fetchRooms(), fetchMonthlyPaymentRequests(), fetchPaymentTransactions()]);
  };

  const completeBookingPayment = async (bookingId: string) => {
    if (!user) return false;
    const booking = bookings.find((item) => item.id === bookingId);
    const room = booking?.room || rooms.find((item) => item.id === booking?.room_id);
    if (!booking || !room || booking.student_id !== user.id || booking.status !== 'accepted') return false;
    if (booking.payment_status === 'paid') return true;

    const paymentResult = await processRazorpayPayment({
      amount: room.price,
      bookingId,
      kind: 'initial_booking',
      metadata: {
        room_id: booking.room_id,
        room_title: room.title,
        stage: 'initial_booking',
      },
      customerName: profile?.name || booking.student_name,
      customerEmail: profile?.email || user.email,
    });

    if (!paymentResult.success) {
      const nextStatus = paymentResult.status === 'pending' ? 'pending' : 'failed';
      await supabase.from('bookings').update({ payment_status: nextStatus }).eq('id', bookingId);
      setBookings((prev) => prev.map((item) => item.id === bookingId ? { ...item, payment_status: nextStatus } : item));
      return false;
    }

    const paymentReference = paymentResult.reference;
    const paidAt = paymentResult.processedAt;
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        booking_id: bookingId,
        payer_id: user.id,
        payee_id: booking.owner_id,
        amount: room.price,
        kind: 'initial_booking',
        provider: paymentResult.provider,
        status: paymentResult.status,
        reference: paymentReference,
        metadata: paymentResult.metadata,
      })
      .select()
      .single();

    if (transactionError) {
      await supabase.from('bookings').update({ payment_status: 'failed' }).eq('id', bookingId);
      setBookings((prev) => prev.map((item) => item.id === bookingId ? { ...item, payment_status: 'failed' } : item));
      return false;
    }

    const { error } = await supabase.from('bookings').update({
      payment_status: 'paid',
      payment_reference: paymentReference,
      paid_at: paidAt,
    }).eq('id', bookingId);

    if (error) return false;

    await supabase.from('notifications').insert([
      {
        user_id: booking.owner_id,
        title: 'Payment Received',
        message: `Initial booking payment received for "${room.title}" (${paymentReference}).`,
      },
      {
        user_id: booking.student_id,
        title: 'Payment Successful',
        message: `Your initial payment for "${room.title}" is complete.`,
      },
    ]);

    setPaymentTransactions((prev) => [transaction as PaymentTransactionRow, ...prev]);
    setBookings((prev) => prev.map((item) => item.id === bookingId ? {
      ...item,
      payment_status: 'paid',
      payment_reference: paymentReference,
      paid_at: paidAt,
    } : item));
    return true;
  };

  const acceptAgreement = async (agreementId: string) => {
    if (!user) return false;
    const agreement = agreements.find((item) => item.id === agreementId);
    if (!agreement) return false;

    const update = agreement.student_id === user.id
      ? { student_accepted: true, updated_at: new Date().toISOString() }
      : agreement.owner_id === user.id
        ? { owner_accepted: true, updated_at: new Date().toISOString() }
        : null;

    if (!update) return false;

    const { error } = await supabase.from('agreements').update(update).eq('id', agreementId);
    if (error) return false;

    await supabase.from('notifications').insert({
      user_id: agreement.student_id === user.id ? agreement.owner_id : agreement.student_id,
      title: 'Agreement Updated',
      message: 'The rental agreement has been accepted and updated.',
    });

    await fetchAgreements();
    return true;
  };

  const createMonthlyPaymentRequest = async (bookingId: string) => {
    if (!user) return false;
    const booking = bookings.find((item) => item.id === bookingId);
    const agreement = agreements.find((item) => item.booking_id === bookingId);
    if (!booking || booking.owner_id !== user.id || booking.status !== 'accepted' || !agreement) return false;

    const existingRequests = monthlyPaymentRequests
      .filter((item) => item.booking_id === bookingId)
      .sort((a, b) => a.due_month.localeCompare(b.due_month));
    const hasOpenCycle = existingRequests.some((item) => item.status !== 'accepted');
    if (hasOpenCycle) return false;

    const latestRequest = existingRequests[existingRequests.length - 1];
    const acceptedRequests = existingRequests
      .filter((item) => item.status === 'accepted' && item.confirmed_at)
      .sort((a, b) => new Date(a.confirmed_at || 0).getTime() - new Date(b.confirmed_at || 0).getTime());
    const lastAcceptedRequest = acceptedRequests[acceptedRequests.length - 1];
    const anchorDate = lastAcceptedRequest?.confirmed_at
      ? new Date(lastAcceptedRequest.confirmed_at)
      : booking.paid_at
        ? new Date(booking.paid_at)
        : null;

    if (!anchorDate) return false;

    const nextAllowedDate = new Date(anchorDate);
    nextAllowedDate.setDate(nextAllowedDate.getDate() + 30);
    if (new Date() < nextAllowedDate) return false;

    const nextDueMonthDate = new Date(nextAllowedDate.getFullYear(), nextAllowedDate.getMonth(), 1);
    const dueMonth = nextDueMonthDate.toISOString().slice(0, 10);
    const dueDate = new Date(nextDueMonthDate.getFullYear(), nextDueMonthDate.getMonth(), 5).toISOString().slice(0, 10);
    if (latestRequest && latestRequest.due_month === dueMonth) return false;

    const { error } = await supabase.from('monthly_payment_requests').insert({
      booking_id: bookingId,
      owner_id: booking.owner_id,
      student_id: booking.student_id,
      due_month: dueMonth,
      due_date: dueDate,
      amount: agreement.monthly_rent,
      status: 'pending',
    });

    if (error) return false;

    await supabase.from('notifications').insert({
      user_id: booking.student_id,
      title: 'Monthly Rent Due',
      message: `A new monthly rent request is available for ${new Date(dueMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.`,
    });

    await fetchMonthlyPaymentRequests();
    return true;
  };

  const payMonthlyPaymentRequest = async (requestId: string) => {
    if (!user) return false;
    const request = monthlyPaymentRequests.find((item) => item.id === requestId);
    if (!request || request.student_id !== user.id || request.status === 'paid' || request.status === 'accepted') return false;

    const booking = bookings.find((item) => item.id === request.booking_id);
    if (!booking || booking.status !== 'accepted') return false;

    const paymentResult = await processRazorpayPayment({
      amount: request.amount,
      bookingId: request.booking_id,
      kind: 'monthly_rent',
      metadata: {
        due_month: request.due_month,
        due_date: request.due_date,
        payment_request_id: request.id,
      },
      customerName: profile?.name || booking.student_name,
      customerEmail: profile?.email || user.email,
    });

    if (!paymentResult.success) return false;

    const paymentReference = paymentResult.reference;
    const paidAt = paymentResult.processedAt;
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        booking_id: request.booking_id,
        payer_id: request.student_id,
        payee_id: request.owner_id,
        amount: request.amount,
        kind: 'monthly_rent',
        provider: paymentResult.provider,
        status: paymentResult.status,
        reference: paymentReference,
        payment_request_id: request.id,
        metadata: paymentResult.metadata,
      })
      .select()
      .single();

    if (transactionError) return false;

    const { error } = await supabase.from('monthly_payment_requests').update({
      status: 'paid',
      payment_reference: paymentReference,
      paid_at: paidAt,
      transaction_id: transaction.id,
    }).eq('id', requestId);

    if (error) return false;

    await supabase.from('notifications').insert({
      user_id: request.owner_id,
      title: 'Monthly Rent Received',
      message: `Monthly rent payment received (${paymentReference}). Please verify and accept it.`,
    });

    await Promise.all([fetchMonthlyPaymentRequests(), fetchPaymentTransactions()]);
    return true;
  };

  const confirmMonthlyPaymentRequest = async (requestId: string) => {
    if (!user) return false;
    const request = monthlyPaymentRequests.find((item) => item.id === requestId);
    if (!request || request.owner_id !== user.id || request.status !== 'paid') return false;

    const confirmedAt = new Date().toISOString();
    const { error } = await supabase.from('monthly_payment_requests').update({
      status: 'accepted',
      confirmed_at: confirmedAt,
      confirmed_by: user.id,
    }).eq('id', requestId);

    if (error) return false;

    await supabase.from('notifications').insert({
      user_id: request.student_id,
      title: 'Monthly Payment Accepted',
      message: `Your rent payment for ${new Date(request.due_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} has been accepted by the owner.`,
    });

    await fetchMonthlyPaymentRequests();
    return true;
  };

  const toggleWishlist = async (roomId: string) => {
    if (!user || profile?.role !== 'student') return;

    const isWishlisted = wishlist.includes(roomId);
    if (isWishlisted) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('room_id', roomId);
      setWishlist((prev) => prev.filter((id) => id !== roomId));
      return;
    }

    const { error } = await supabase.from('wishlists').insert({
      user_id: user.id,
      room_id: roomId,
    });

    if (!error) {
      setWishlist((prev) => [...prev, roomId]);
    }
  };

  const sanitizeMessage = useCallback((text: string): string => {
    const phoneRegex = /(\+?\d[\d\s-]{7,})/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const urlRegex = /https?:\/\/[^\s]+/g;

    let sanitized = text.replace(phoneRegex, '***Contact sharing is not allowed***');
    sanitized = sanitized.replace(emailRegex, '***Contact sharing is not allowed***');
    sanitized = sanitized.replace(urlRegex, '***Contact sharing is not allowed***');
    return sanitized;
  }, []);

  const sendMessage = useCallback(async (bookingId: string, content: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    const sanitizedContent = sanitizeMessage(content);
    const optimisticId = `temp-${bookingId}-${Date.now()}`;
    console.debug('[chat] sendMessage optimistic append', { bookingId, optimisticId });
    mergeConversationMessages(bookingId, [{
      id: optimisticId,
      booking_id: bookingId,
      sender_id: user.id,
      sender_name: profile?.name || 'You',
      content: sanitizedContent,
      created_at: now,
    }]);

    const { data, error } = await supabase.from('chat_messages').insert({
      booking_id: bookingId,
      sender_id: user.id,
      content: sanitizedContent,
    }).select().single();

    if (error || !data) {
      setChatMessagesByBooking((prev) => ({
        ...prev,
        [bookingId]: (prev[bookingId] || []).filter((message) => message.id !== optimisticId),
      }));
      return;
    }

    setChatMessagesByBooking((prev) => {
      const existing = (prev[bookingId] || []).filter((message) => message.id !== optimisticId);
      const deduped = new Map<string, ChatMessage>();
      [...existing, {
        id: data.id,
        booking_id: data.booking_id,
        sender_id: data.sender_id,
        sender_name: profile?.name || 'You',
        content: data.content,
        created_at: data.created_at,
      }].forEach((message) => {
        deduped.set(message.id, message);
      });

      return {
        ...prev,
        [bookingId]: Array.from(deduped.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
      };
    });
    setBookings((prev) => prev.map((booking) => booking.id === bookingId ? {
      ...booking,
      last_message: data.content,
      last_message_at: data.created_at,
      unread_count: 0,
    } : booking));
    const relatedBooking = bookingsRef.current.find((booking) => booking.id === bookingId);

    await supabase.from('bookings').update(
      user.id === relatedBooking?.student_id
        ? { student_last_read_at: now }
        : { owner_last_read_at: now },
    ).eq('id', bookingId);
  }, [mergeConversationMessages, profile?.name, sanitizeMessage, user]);

  const fetchMessages = useCallback(async (bookingId: string) => {
    if (chatHasLoadedRef.current[bookingId]) {
      console.debug('[chat] fetchMessages skipped already loaded', { bookingId });
      return;
    }

    if (chatFetchInFlightRef.current[bookingId]) {
      console.debug('[chat] fetchMessages skipped already in flight', { bookingId });
      return;
    }

    console.debug('[chat] fetchMessages first load', { bookingId });
    chatFetchInFlightRef.current[bookingId] = true;

    const hasExistingMessages = (chatMessagesRef.current[bookingId] || []).length > 0;

    if (!chatLoadingRef.current[bookingId] && !hasExistingMessages) {
      chatLoadingRef.current = { ...chatLoadingRef.current, [bookingId]: true };
    }

    setChatLoadingByBooking((prev) => {
      if (prev[bookingId] || chatHasLoadedRef.current[bookingId] || hasExistingMessages) return prev;
      return { ...prev, [bookingId]: true };
    });

    try {
      const { data } = await supabase.from('chat_messages').select('*').eq('booking_id', bookingId).order('created_at', { ascending: true });

      if (!data) {
        chatHasLoadedRef.current = { ...chatHasLoadedRef.current, [bookingId]: true };
        setChatHasLoadedByBooking((prev) => ({ ...prev, [bookingId]: true }));
        return;
      }

      const senderIds = [...new Set(data.map((message) => message.sender_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', senderIds);
      const profileMap = new Map(profiles?.map((item) => [item.id, item.name]) || []);

      mergeConversationMessages(bookingId, data.map((message) => ({
        id: message.id,
        booking_id: message.booking_id,
        sender_id: message.sender_id,
        sender_name: profileMap.get(message.sender_id) || 'Unknown',
        content: message.content,
        created_at: message.created_at,
      })));

      chatHasLoadedRef.current = { ...chatHasLoadedRef.current, [bookingId]: true };
      setChatHasLoadedByBooking((prev) => ({ ...prev, [bookingId]: true }));
    } finally {
      chatFetchInFlightRef.current[bookingId] = false;
      chatLoadingRef.current = { ...chatLoadingRef.current, [bookingId]: false };
      setChatLoadingByBooking((prev) => ({ ...prev, [bookingId]: false }));
    }
  }, [mergeConversationMessages]);

  const markConversationRead = useCallback(async (bookingId: string) => {
    if (!user) return;
    const booking = bookingsRef.current.find((item) => item.id === bookingId);
    if (!booking) return;

    const now = new Date().toISOString();
    const update = booking.student_id === user.id
      ? { student_last_read_at: now }
      : { owner_last_read_at: now };

    await supabase.from('bookings').update(update).eq('id', bookingId);
    setBookings((prev) => prev.map((item) => item.id === bookingId ? { ...item, ...update, unread_count: 0 } : item));
  }, [user]);

  const submitReview = async (bookingId: string, rating: number, comment: string) => {
    if (!user) return false;

    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking || booking.student_id !== user.id || booking.status !== 'accepted') return false;

    const { error } = await supabase.from('reviews').upsert({
      booking_id: booking.id,
      room_id: booking.room_id,
      student_id: user.id,
      rating,
      comment,
    }, { onConflict: 'booking_id' });

    if (error) return false;

    await Promise.all([fetchRooms(), fetchReviews(booking.room_id)]);
    return true;
  };

  const fetchRoomReports = useCallback(async () => {
    if (!user || profile?.role !== 'admin') {
      setRoomReports([]);
      return;
    }

    const { data } = await supabase.from('room_reports').select('*').order('created_at', { ascending: false });
    if (!data) {
      setRoomReports([]);
      return;
    }

    const reporterIds = [...new Set(data.map((report) => report.reporter_id))];
    const roomIds = [...new Set(data.map((report) => report.room_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', reporterIds);
    const { data: reportRooms } = await supabase.from('rooms').select('id, title').in('id', roomIds);
    const profileMap = new Map(profiles?.map((item) => [item.id, item.name]) || []);
    const roomMap = new Map(reportRooms?.map((item) => [item.id, item.title]) || []);

    setRoomReports(data.map((report) => ({
      id: report.id,
      room_id: report.room_id,
      reporter_id: report.reporter_id,
      reason: report.reason,
      details: report.details || '',
      status: report.status,
      created_at: report.created_at,
      room_title: roomMap.get(report.room_id) || 'Unknown Room',
      reporter_name: profileMap.get(report.reporter_id) || 'Unknown',
    })));
  }, [profile?.role, user]);

  const submitRoomReport = async (roomId: string, reason: string, details: string) => {
    if (!user) return false;

    const { error } = await supabase.from('room_reports').insert({
      room_id: roomId,
      reporter_id: user.id,
      reason,
      details,
    });

    if (error) return false;
    return true;
  };

  const updateRoomReportStatus = async (reportId: string, status: string) => {
    const { error } = await supabase.from('room_reports').update({ status }).eq('id', reportId);
    if (error) return false;

    setRoomReports((prev) => prev.map((report) => report.id === reportId ? { ...report, status } : report));
    return true;
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
    if (error) return false;

    await Promise.all([fetchAllUsers(), fetchRooms(), fetchBookings(), fetchRoomReports()]);
    setNotifications((prev) => prev.filter((item) => item.user_id !== userId));
    return true;
  };

  const updateUserRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.rpc('admin_set_user_role', {
      target_user_id: userId,
      new_role: role,
    });

    if (error) return false;

    await Promise.all([fetchAllUsers(), fetchRooms(), fetchBookings()]);
    if (profile?.id === userId) {
      setProfile((prev) => prev ? { ...prev, role } : prev);
    }
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        loading,
        roomsLoaded,
        roomsError,
        wishlistLoaded,
        roomReviews,
        roomReports,
        rooms,
        bookings,
        agreements,
        monthlyPaymentRequests,
        paymentTransactions,
        notifications,
        wishlist,
        chatMessagesByBooking,
        chatLoadingByBooking,
        chatHasLoadedByBooking,
        allUsers,
        login,
        signup,
        logout,
        uploadAvatar,
        updateProfile,
        fetchRooms,
        uploadRoomImages,
        addRoom,
        updateRoomStatus,
        updateRoomApprovalStatus,
        deleteRoom,
        bookRoom,
        updateBookingStatus,
        completeBookingPayment,
        acceptAgreement,
        createMonthlyPaymentRequest,
        payMonthlyPaymentRequest,
        confirmMonthlyPaymentRequest,
        toggleWishlist,
        sendMessage,
        fetchMessages,
        markConversationRead,
        fetchReviews,
        submitReview,
        fetchRoomReports,
        submitRoomReport,
        updateRoomReportStatus,
        markNotificationRead,
        fetchBookings,
        fetchNotifications,
        fetchAllUsers,
        updateUserRole,
        deleteUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
