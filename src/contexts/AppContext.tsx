import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { formatAuthError } from '@/lib/authErrors';
import { notifyAdminNewUserEmail, notifyBookingRequestEmail, notifySystemAlertEmail, notifySystemAlertSms, notifyWelcomeEmail } from '@/lib/emailNotifications';
import { processRazorpayPayment } from '@/lib/paymentGateway';

export type AppRole = 'student' | 'owner' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  mobile_number?: string;
  upi_id?: string;
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
  rent_due_date?: string | null;
  next_payment_date?: string | null;
  last_successful_payment_date?: string | null;
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
  note?: string | null;
  owner_response_note?: string | null;
  period_label?: string | null;
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
  order_id?: string | null;
  payment_id?: string | null;
  payment_signature?: string | null;
  payer_name?: string | null;
  payer_email?: string | null;
  payer_phone?: string | null;
  verified_at?: string | null;
  owner_confirmed_at?: string | null;
  owner_confirmed_by?: string | null;
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

export interface PaymentDateChangeRequest {
  id: string;
  booking_id: string;
  payment_request_id?: string | null;
  requester_id: string;
  responder_id?: string | null;
  current_due_date: string;
  requested_due_date: string;
  reason?: string | null;
  status: string;
  resolution_note?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface UserReport {
  id: string;
  booking_id?: string | null;
  reporter_id: string;
  reported_user_id: string;
  category: string;
  details?: string | null;
  status: string;
  created_at: string;
  resolution_note?: string | null;
  reporter_name?: string;
  reported_user_name?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

interface AuthActionResult extends ActionResult {
  needsEmailVerification?: boolean;
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
  paymentDateChangeRequests: PaymentDateChangeRequest[];
  userReports: UserReport[];
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
  login: (email: string, password: string) => Promise<AuthActionResult>;
  signup: (name: string, email: string, password: string, role: AppRole) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  updateProfile: (updates: { name: string; avatar_url?: string; mobile_number?: string; upi_id?: string; bio?: string }) => Promise<ActionResult>;
  fetchRooms: () => Promise<void>;
  uploadRoomImages: (files: File[]) => Promise<string[]>;
  addRoom: (room: AddRoomInput) => Promise<boolean>;
  updateRoomStatus: (roomId: string, status: string) => Promise<void>;
  updateRoomApprovalStatus: (roomId: string, approvalStatus: string) => Promise<boolean>;
  deleteRoom: (roomId: string) => Promise<void>;
  bookRoom: (roomId: string) => Promise<boolean>;
  updateBookingStatus: (bookingId: string, status: string) => Promise<void>;
  completeBookingStay: (bookingId: string, reason?: string) => Promise<ActionResult>;
  completeBookingPayment: (bookingId: string) => Promise<ActionResult>;
  acceptAgreement: (agreementId: string) => Promise<boolean>;
  createMonthlyPaymentRequest: (bookingId: string, input?: { amount?: number; dueDate?: string; note?: string }) => Promise<boolean>;
  payMonthlyPaymentRequest: (requestId: string) => Promise<ActionResult>;
  confirmMonthlyPaymentRequest: (requestId: string, resolutionNote?: string) => Promise<boolean>;
  rejectMonthlyPaymentRequest: (requestId: string, resolutionNote: string) => Promise<boolean>;
  requestPaymentDateChange: (bookingId: string, requestedDueDate: string, reason: string) => Promise<boolean>;
  respondToPaymentDateChangeRequest: (requestId: string, status: 'approved' | 'rejected', resolutionNote?: string) => Promise<boolean>;
  toggleWishlist: (roomId: string) => Promise<void>;
  sendMessage: (bookingId: string, content: string) => Promise<void>;
  fetchMessages: (bookingId: string) => Promise<void>;
  markConversationRead: (bookingId: string) => Promise<void>;
  fetchReviews: (roomId: string) => Promise<void>;
  submitReview: (bookingId: string, rating: number, comment: string) => Promise<boolean>;
  fetchRoomReports: () => Promise<void>;
  submitRoomReport: (roomId: string, reason: string, details: string) => Promise<boolean>;
  updateRoomReportStatus: (reportId: string, status: string) => Promise<boolean>;
  fetchUserReports: () => Promise<void>;
  submitUserReport: (bookingId: string, reportedUserId: string, category: string, details: string) => Promise<boolean>;
  updateUserReportStatus: (reportId: string, status: 'reviewed' | 'resolved', resolutionNote?: string) => Promise<boolean>;
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
  note: string | null;
  owner_response_note: string | null;
  period_label: string | null;
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
  order_id: string | null;
  payment_id: string | null;
  payment_signature: string | null;
  payer_name: string | null;
  payer_email: string | null;
  payer_phone: string | null;
  verified_at: string | null;
  owner_confirmed_at: string | null;
  owner_confirmed_by: string | null;
  payment_request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type PaymentDateChangeRequestRow = {
  id: string;
  booking_id: string;
  payment_request_id: string | null;
  requester_id: string;
  responder_id: string | null;
  current_due_date: string;
  requested_due_date: string;
  reason: string | null;
  status: string;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

type UserReportRow = {
  id: string;
  booking_id: string | null;
  reporter_id: string;
  reported_user_id: string;
  category: string;
  details: string | null;
  status: string;
  created_at: string;
  resolution_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

type ProfileRow = {
  id: string;
  name: string;
  full_name?: string | null;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  mobile_number?: string | null;
  upi_id?: string | null;
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
  const [paymentDateChangeRequests, setPaymentDateChangeRequests] = useState<PaymentDateChangeRequest[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
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
  const profileFetchVersionRef = useRef(0);

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

  const isEmailVerified = useCallback((authUser: SupabaseUser) => {
    const userWithConfirmation = authUser as SupabaseUser & { confirmed_at?: string | null };
    return Boolean(authUser.email_confirmed_at || userWithConfirmation.confirmed_at);
  }, []);

  const mapProfileRow = useCallback((profileData: ProfileRow, role?: AppRole | null): Profile => {
    const resolvedName = profileData.full_name || profileData.name;
    return {
      id: profileData.id,
      name: resolvedName,
      email: profileData.email,
      avatar_url: profileData.avatar_url || undefined,
      bio: profileData.bio || undefined,
      mobile_number: profileData.mobile_number || undefined,
      upi_id: profileData.upi_id || undefined,
      role: role || 'student',
    };
  }, []);

  const sleep = useCallback((ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms)), []);

  const fetchProfile = useCallback(async (userId: string) => {
    const requestVersion = profileFetchVersionRef.current + 1;
    profileFetchVersionRef.current = requestVersion;
    console.info('[auth] Profile initialization started', { userId, requestVersion });

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[auth] Profile fetch failed', { userId, attempt, profileError });
      }

      if (profileData) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (roleError) {
          console.error('[auth] Role fetch failed', { userId, attempt, roleError });
        }

        const nextProfile = mapProfileRow(profileData as ProfileRow, roleData?.role as AppRole | undefined);
        if (profileFetchVersionRef.current === requestVersion) {
          setProfile(nextProfile);
        }
        console.info('[auth] Profile initialized', { userId, role: nextProfile.role, attempt });
        return nextProfile;
      }

      if (attempt === 1) {
        const { error: ensureError } = await supabase.rpc('ensure_user_profile', {});
        if (ensureError) {
          console.error('[auth] ensure_user_profile failed', { userId, ensureError });
        } else {
          console.info('[auth] ensure_user_profile completed', { userId });
        }
      }

      await sleep(180 * attempt);
    }

    if (profileFetchVersionRef.current === requestVersion) {
      setProfile(null);
    }
    console.error('[auth] Profile initialization exhausted retries', { userId });
    return null;
  }, [mapProfileRow, sleep]);

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
      rent_due_date: 'rent_due_date' in booking ? booking.rent_due_date : null,
      next_payment_date: 'next_payment_date' in booking ? booking.next_payment_date : null,
      last_successful_payment_date: 'last_successful_payment_date' in booking ? booking.last_successful_payment_date : null,
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
    console.debug('[payment] Fetched monthly payment requests', {
      userId: user.id,
      count: data?.length || 0,
      role: profile?.role,
    });
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
    console.debug('[payment] Fetched payment transactions', {
      userId: user.id,
      count: data?.length || 0,
      role: profile?.role,
    });
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

  const isValidMobileNumber = useCallback((value?: string) => {
    if (!value) return false;
    const normalized = value.trim().replace(/[\s-]+/g, '');
    return /^(?:\+91)?[6-9]\d{9}$/.test(normalized);
  }, []);

  const isValidUpiId = useCallback((value?: string) => {
    if (!value) return false;
    return /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(value.trim());
  }, []);

  const formatSupabaseError = useCallback((error: unknown, fallback: string) => {
    if (!error || typeof error !== 'object') return fallback;

    const parts = [
      'message' in error ? String(error.message || '') : '',
      'details' in error ? String(error.details || '') : '',
      'hint' in error ? String(error.hint || '') : '',
      'code' in error ? `code=${String(error.code || '')}` : '',
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' | ') : fallback;
  }, []);

  const addDays = useCallback((dateValue: string | Date, days: number) => {
    const nextDate = new Date(dateValue);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }, []);

  const formatDateOnly = useCallback((dateValue: string | Date) => {
    return new Date(dateValue).toISOString().slice(0, 10);
  }, []);

  const getAdminUsers = useCallback(async () => {
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    const adminIds = (adminRoles || []).map((item) => item.user_id).filter(Boolean);
    if (adminIds.length === 0) return [] as Array<{ id: string; name: string; email: string; mobile_number?: string | null }>;

    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, name, full_name, email, mobile_number')
      .in('id', adminIds);

    return (adminProfiles || []).map((item) => ({
      ...item,
      name: item.full_name || item.name,
    }));
  }, []);

  const createInAppNotifications = useCallback(async (entries: Array<{ user_id: string; title: string; message: string }>) => {
    const dedupedEntries = entries.filter((entry, index, source) =>
      !!entry.user_id && source.findIndex((item) => item.user_id === entry.user_id && item.title === entry.title && item.message === entry.message) === index,
    );
    if (dedupedEntries.length === 0) return;

    await supabase.from('notifications').insert(dedupedEntries);
  }, []);

  const dispatchExternalAlerts = useCallback(async (entries: Array<{
    recipientName?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }>) => {
    await Promise.all(entries.flatMap((entry) => {
      const tasks: Array<Promise<{ success: boolean; error?: string } | undefined>> = [];
      if (entry.recipientEmail) {
        tasks.push(notifySystemAlertEmail({
          channel: 'email',
          recipientName: entry.recipientName,
          recipientEmail: entry.recipientEmail,
          title: entry.title,
          message: entry.message,
          metadata: entry.metadata,
        }));
      }
      if (entry.recipientPhone) {
        tasks.push(notifySystemAlertSms({
          channel: 'sms',
          recipientName: entry.recipientName,
          recipientPhone: entry.recipientPhone,
          title: entry.title,
          message: entry.message,
          metadata: entry.metadata,
        }));
      }
      return tasks;
    }));
  }, []);

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
      name: ('full_name' in item && item.full_name) ? item.full_name : item.name,
      email: item.email,
      avatar_url: item.avatar_url,
      bio: 'bio' in item ? item.bio || undefined : undefined,
      mobile_number: 'mobile_number' in item ? item.mobile_number || undefined : undefined,
      upi_id: 'upi_id' in item ? item.upi_id || undefined : undefined,
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

  const fetchPaymentDateChangeRequests = useCallback(async () => {
    if (!user) {
      setPaymentDateChangeRequests([]);
      return;
    }

    let query = supabase.from('payment_date_change_requests').select('*').order('created_at', { ascending: false });
    if (profile?.role !== 'admin') {
      const bookingIds = bookingsRef.current
        .filter((booking) => booking.student_id === user.id || booking.owner_id === user.id)
        .map((booking) => booking.id);

      if (bookingIds.length === 0) {
        setPaymentDateChangeRequests([]);
        return;
      }

      query = query.in('booking_id', bookingIds);
    }

    const { data } = await query;
    setPaymentDateChangeRequests((data || []) as PaymentDateChangeRequestRow[]);
  }, [profile?.role, user]);

  const fetchUserReports = useCallback(async () => {
    if (!user) {
      setUserReports([]);
      return;
    }

    let query = supabase.from('user_reports').select('*').order('created_at', { ascending: false });
    if (profile?.role !== 'admin') {
      query = query.or(`reporter_id.eq.${user.id},reported_user_id.eq.${user.id}`);
    }

    const { data } = await query;
    if (!data) {
      setUserReports([]);
      return;
    }

    const relatedUserIds = [...new Set(data.flatMap((report) => [report.reporter_id, report.reported_user_id]))];
    const { data: relatedProfiles } = await supabase.from('profiles').select('id, name').in('id', relatedUserIds);
    const profileMap = new Map(relatedProfiles?.map((item) => [item.id, item.name]) || []);

    setUserReports(data.map((report) => ({
      id: report.id,
      booking_id: report.booking_id,
      reporter_id: report.reporter_id,
      reported_user_id: report.reported_user_id,
      category: report.category,
      details: report.details || '',
      status: report.status,
      created_at: report.created_at,
      resolution_note: report.resolution_note || '',
      reporter_name: profileMap.get(report.reporter_id) || 'Unknown',
      reported_user_name: profileMap.get(report.reported_user_id) || 'Unknown',
    })));
  }, [profile?.role, user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.info('[auth] State changed', {
        event: _event,
        hasSession: !!session,
        userId: session?.user.id,
      });
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        window.setTimeout(() => {
          void fetchProfile(session.user.id).finally(() => setLoading(false));
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
        setWishlist([]);
        setWishlistLoaded(true);
        setChatMessagesByBooking({});
        setChatLoadingByBooking({});
        setChatHasLoadedByBooking({});
        setPaymentDateChangeRequests([]);
        setUserReports([]);
        chatMessagesRef.current = {};
        chatLoadingRef.current = {};
        chatHasLoadedRef.current = {};
        chatFetchInFlightRef.current = {};
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.info('[auth] Initial session loaded', {
        hasSession: !!session,
        userId: session?.user.id,
      });
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
      void fetchPaymentDateChangeRequests();
      void fetchUserReports();
      void fetchWishlist();
    } else if (!user) {
      setBookings([]);
      setAgreements([]);
      setMonthlyPaymentRequests([]);
      setPaymentTransactions([]);
      setNotifications([]);
      setPaymentDateChangeRequests([]);
      setUserReports([]);
      setWishlist([]);
      setWishlistLoaded(true);
    }
  }, [fetchAgreements, fetchBookings, fetchMonthlyPaymentRequests, fetchNotifications, fetchPaymentDateChangeRequests, fetchPaymentTransactions, fetchUserReports, fetchWishlist, profile, user]);

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
    console.info('[auth] Login started', { email: email.trim().toLowerCase() });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      console.error('[auth] Login failed', error);
      return { success: false, error: formatAuthError(error, 'Login failed.') };
    }

    if (data.user && !isEmailVerified(data.user)) {
      console.warn('[auth] Login blocked until email verification', { userId: data.user.id });
      await supabase.auth.signOut();
      return { success: false, needsEmailVerification: true, error: 'Please verify your email before signing in.' };
    }

    if (data.session) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('[auth] Session refresh after login failed', refreshError);
      }
    }

    if (data.user) {
      setUser(data.user);
      const nextProfile = await fetchProfile(data.user.id);
      if (!nextProfile) {
        return { success: false, error: 'Your account was created, but profile initialization failed. Please refresh and try again.' };
      }
    }

    console.info('[auth] Login success', { userId: data.user?.id });
    return { success: true };
  };

  const signup = async (name: string, email: string, password: string, role: AppRole) => {
    const safeRole: Exclude<AppRole, 'admin'> = role === 'owner' ? 'owner' : 'student';
    const registrationDate = new Date().toISOString();
    const normalizedEmail = email.trim().toLowerCase();
    const appUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const emailRedirectTo = appUrl ? `${appUrl}/auth?verified=true` : undefined;

    console.info('[auth] Signup started', {
      email: normalizedEmail,
      role: safeRole,
      emailRedirectTo,
    });

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name, full_name: name, role: safeRole },
        emailRedirectTo,
      },
    });
    if (error) {
      console.error('[auth] Signup failed', error);
      return { success: false, error: formatAuthError(error, 'Signup failed.') };
    }

    const needsEmailVerification = Boolean(data.user && !data.session && !isEmailVerified(data.user));
    console.info('[auth] Signup success', {
      userId: data.user?.id,
      hasSession: !!data.session,
      needsEmailVerification,
      verificationMailTriggered: needsEmailVerification,
    });

    if (data.session) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('[auth] Session refresh after signup failed', refreshError);
      }
    }

    if (data.user && data.session) {
      setUser(data.user);
      const nextProfile = await fetchProfile(data.user.id);
      if (!nextProfile) {
        console.error('[auth] Signup profile initialization failed', { userId: data.user.id });
      }
    }

    const emailTasks = await Promise.allSettled([
      notifyAdminNewUserEmail({
        userName: name,
        userEmail: normalizedEmail,
        role: safeRole,
        registrationDate,
      }),
      notifyWelcomeEmail({
        userName: name,
        userEmail: normalizedEmail,
        role: safeRole,
        appUrl,
      }),
    ]);

    emailTasks.forEach((task, index) => {
      if (task.status === 'rejected') {
        console.error('[email] Signup notification promise rejected', {
          target: index === 0 ? 'admin' : 'welcome',
          error: task.reason,
        });
        return;
      }

      if (!task.value?.success) {
        console.error('[email] Signup notification failed', {
          target: index === 0 ? 'admin' : 'welcome',
          error: task.value?.error,
        });
      }
    });

    return { success: true, needsEmailVerification };
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
    setPaymentDateChangeRequests([]);
    setUserReports([]);
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

  const updateProfile = async (updates: { name: string; avatar_url?: string; mobile_number?: string; upi_id?: string; bio?: string }) => {
    if (!user || !profile) return { success: false, error: 'You must be signed in to update your profile.' };

    const mobileNumber = updates.mobile_number?.trim().replace(/[\s-]+/g, '') || '';
    const upiId = updates.upi_id?.trim() || '';
    const bio = updates.bio?.trim() || '';
    const fullName = updates.name.trim();
    if (!fullName) return { success: false, error: 'Full name is required.' };
    if (!isValidMobileNumber(mobileNumber)) {
      return { success: false, error: 'Enter a valid Indian mobile number such as 9876543210 or +919876543210.' };
    }
    if (profile.role === 'owner' && !isValidUpiId(upiId)) return { success: false, error: 'Enter a valid UPI ID such as owner@upi.' };

    const payload = {
      name: fullName,
      full_name: fullName,
      avatar_url: updates.avatar_url ?? profile.avatar_url ?? null,
      mobile_number: mobileNumber,
      upi_id: profile.role === 'owner' ? upiId : null,
      bio: bio || null,
    };

    console.info('[profile] Updating profile', { userId: user.id, payload });
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select('id, name, full_name, email, avatar_url, mobile_number, upi_id, bio')
      .maybeSingle();
    if (error) {
      console.error('[profile] Update failed', error);
      return { success: false, error: formatSupabaseError(error, 'Profile update failed.') };
    }
    if (!data) {
      console.error('[profile] Update returned no row', { userId: user.id });
      return { success: false, error: 'Profile update did not return updated data. Check RLS and select permissions.' };
    }

    const resolvedName = data?.full_name || data?.name || fullName;
    setProfile((prev) => prev ? {
      ...prev,
      name: resolvedName,
      avatar_url: data?.avatar_url || undefined,
      mobile_number: data?.mobile_number || undefined,
      upi_id: data?.upi_id || undefined,
      bio: data?.bio || undefined,
    } : prev);
    setAllUsers((prev) => prev.map((item) => item.id === user.id ? {
      ...item,
      name: resolvedName,
      avatar_url: data?.avatar_url || undefined,
      mobile_number: data?.mobile_number || undefined,
      upi_id: data?.upi_id || undefined,
      bio: data?.bio || undefined,
    } : item));
    return { success: true };
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
    console.info('[booking] Updating room status', { roomId, status });
    const { error } = await supabase.from('rooms').update({ status }).eq('id', roomId);
    if (error) {
      console.error('[booking] Failed to update room status', { roomId, status, error });
      return;
    }

    setRooms((prev) => prev.map((room) => room.id === roomId ? { ...room, status } : room));

    if (status === 'available') {
      const activeBooking = bookings.find((booking) => booking.room_id === roomId && booking.status === 'accepted');
      if (activeBooking) {
        await completeBookingStay(activeBooking.id, 'Room was marked available again, so the active stay was completed.');
        return;
      }
    }

    await fetchRooms();
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

    const existing = bookings.find((booking) =>
      booking.room_id === roomId &&
      booking.student_id === user.id &&
      !['rejected', 'completed', 'cancelled'].includes(booking.status),
    );
    if (existing) return false;

    const { error } = await supabase.from('bookings').insert({
      room_id: roomId,
      student_id: user.id,
      owner_id: room.owner_id,
      status: 'pending',
      payment_status: 'pending',
    });

    if (error) return false;

    const { data: ownerProfile, error: ownerProfileError } = await supabase
      .from('profiles')
      .select('email, name, full_name, mobile_number')
      .eq('id', room.owner_id)
      .maybeSingle();
    if (ownerProfileError) {
      console.error('[booking] Failed to fetch owner profile for booking email', {
        roomId,
        ownerId: room.owner_id,
        error: ownerProfileError,
      });
    }

    const adminUsers = await getAdminUsers();
    await createInAppNotifications([
      {
        user_id: room.owner_id,
        title: 'New Booking Request',
        message: `${profile?.name || 'A student'} wants to book "${room.title}"`,
      },
      ...adminUsers.map((adminUser) => ({
        user_id: adminUser.id,
        title: 'Booking Request Submitted',
        message: `${profile?.name || 'A student'} requested "${room.title}" in ${room.area}, ${room.city}.`,
      })),
    ]);

    if (ownerProfile?.email) {
      void notifyBookingRequestEmail({
        ownerEmail: ownerProfile.email,
        ownerName: ownerProfile.full_name || ownerProfile.name || 'Owner',
        requesterName: profile?.name || 'Student',
        requesterEmail: profile?.email || user.email || 'Unknown',
        studentEmail: profile?.email || user.email || undefined,
        roomTitle: room.title,
        roomLocation: `${room.area}, ${room.city}`,
        rentAmount: room.price,
        bookingDate: new Date().toISOString(),
        dashboardUrl: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
      }).then((result) => {
        if (!result?.success) {
          console.error('[email] Booking request notification failed', {
            roomId: room.id,
            ownerEmail: ownerProfile.email,
            error: result?.error,
          });
        }
      }).catch((error) => {
        console.error('[email] Booking request notification threw', {
          roomId: room.id,
          ownerEmail: ownerProfile.email,
          error,
        });
      });
    }

    void dispatchExternalAlerts([
      {
        recipientName: ownerProfile?.name,
        recipientEmail: ownerProfile?.email,
        recipientPhone: ownerProfile?.mobile_number || undefined,
        title: 'New Booking Request',
        message: `${profile?.name || 'A student'} requested "${room.title}" for booking.`,
        metadata: { room_id: room.id, room_title: room.title, event: 'booking_request_created' },
      },
      ...adminUsers.map((adminUser) => ({
        recipientName: adminUser.name,
        recipientEmail: adminUser.email,
        recipientPhone: adminUser.mobile_number || undefined,
        title: 'Booking Request Submitted',
        message: `${profile?.name || 'A student'} requested "${room.title}" for booking.`,
        metadata: { room_id: room.id, room_title: room.title, event: 'booking_request_created' },
      })),
    ]);

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

  const completeBookingStay = async (bookingId: string, reason?: string) => {
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };
    if (booking.status !== 'accepted') return { success: false, error: 'Only active accepted bookings can be completed.' };

    const completedAt = new Date().toISOString();
    const resolutionNote = reason?.trim() || 'Stay completed and room marked available again.';

    console.info('[booking] Completing active stay', {
      bookingId,
      roomId: booking.room_id,
      ownerId: booking.owner_id,
      studentId: booking.student_id,
      resolutionNote,
    });

    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('[booking] Failed to complete booking', { bookingId, bookingError });
      return { success: false, error: bookingError.message };
    }

    const { error: roomError } = await supabase
      .from('rooms')
      .update({ status: 'available' })
      .eq('id', booking.room_id);

    if (roomError) {
      console.error('[booking] Failed to reopen room after completion', { bookingId, roomError });
      return { success: false, error: roomError.message };
    }

    const { error: monthlyError } = await supabase
      .from('monthly_payment_requests')
      .update({
        status: 'cancelled',
        owner_response_note: resolutionNote,
      })
      .eq('booking_id', bookingId)
      .in('status', ['pending', 'failed', 'processing', 'owner_confirmation_pending']);

    if (monthlyError) {
      console.error('[booking] Failed to close active monthly payment requests', { bookingId, monthlyError });
      return { success: false, error: monthlyError.message };
    }

    const { error: dateChangeError } = await supabase
      .from('payment_date_change_requests')
      .update({
        status: 'rejected',
        resolution_note: 'Stay completed, so the active payment cycle was closed.',
        resolved_at: completedAt,
        responder_id: user?.id || null,
      })
      .eq('booking_id', bookingId)
      .eq('status', 'pending');

    if (dateChangeError) {
      console.error('[booking] Failed to resolve pending payment date requests', { bookingId, dateChangeError });
      return { success: false, error: dateChangeError.message };
    }

    const adminUsers = await getAdminUsers();
    await createInAppNotifications([
      {
        user_id: booking.student_id,
        title: 'Stay Completed',
        message: `Your stay for "${booking.room?.title || 'this room'}" has been marked complete.`,
      },
      {
        user_id: booking.owner_id,
        title: 'Stay Completed',
        message: `${booking.student_name || 'The tenant'} has been moved to booking history and the room is available again.`,
      },
      ...adminUsers.map((adminUser) => ({
        user_id: adminUser.id,
        title: 'Stay Completed',
        message: `Booking ${bookingId} was completed and the room is available again.`,
      })),
    ]);

    setBookings((prev) => prev.map((item) => item.id === bookingId ? { ...item, status: 'completed' } : item));
    setRooms((prev) => prev.map((room) => room.id === booking.room_id ? { ...room, status: 'available' } : room));
    setMonthlyPaymentRequests((prev) => prev.map((item) =>
      item.booking_id === bookingId && ['pending', 'failed', 'processing', 'owner_confirmation_pending'].includes(item.status)
        ? { ...item, status: 'cancelled', owner_response_note: resolutionNote }
        : item,
    ));
    setPaymentDateChangeRequests((prev) => prev.map((item) =>
      item.booking_id === bookingId && item.status === 'pending'
        ? {
          ...item,
          status: 'rejected',
          resolution_note: 'Stay completed, so the active payment cycle was closed.',
          resolved_at: completedAt,
          responder_id: user?.id || undefined,
        }
        : item,
    ));

    await Promise.all([fetchBookings(), fetchRooms(), fetchMonthlyPaymentRequests(), fetchPaymentDateChangeRequests(), fetchPaymentTransactions()]);
    return { success: true };
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const booking = bookings.find((item) => item.id === bookingId);
    if (status === 'completed') {
      await completeBookingStay(bookingId);
      return;
    }

    const acceptedAt = new Date();
    const updatePayload = status === 'accepted'
      ? {
        status,
        payment_status: 'pending',
        rent_due_date: formatDateOnly(addDays(acceptedAt, 30)),
        next_payment_date: formatDateOnly(addDays(acceptedAt, 30)),
      }
      : { status };

    console.info('[booking] Updating booking status', { bookingId, status, updatePayload });
    await supabase.from('bookings').update(updatePayload).eq('id', bookingId);

    if (booking && status === 'accepted') {
      await supabase.from('bookings')
        .update({ status: 'rejected' })
        .eq('room_id', booking.room_id)
        .eq('status', 'pending')
        .neq('id', bookingId);

      await supabase.from('rooms').update({ status: 'occupied' }).eq('id', booking.room_id);
      await createAgreementForBooking(booking);
      const adminUsers = await getAdminUsers();
      await createInAppNotifications([
        {
          user_id: booking.student_id,
          title: 'Booking Accepted!',
          message: 'Your booking has been accepted. Proceed to payment and review your rental agreement.',
        },
        ...adminUsers.map((adminUser) => ({
          user_id: adminUser.id,
          title: 'Booking Accepted',
          message: `${booking.student_name || 'A student'} has been accepted for booking ${booking.room?.title || 'a room'}.`,
        })),
      ]);
    }

    if (booking && status === 'rejected') {
      await createInAppNotifications([
        {
          user_id: booking.student_id,
          title: 'Booking Rejected',
          message: 'Unfortunately, your booking was rejected.',
        },
      ]);
    }

    if (booking && status === 'cancelled') {
      await supabase.from('rooms').update({ status: 'available' }).eq('id', booking.room_id);
      setRooms((prev) => prev.map((room) => room.id === booking.room_id ? { ...room, status: 'available' } : room));
    }

    await Promise.all([fetchBookings(), fetchRooms(), fetchMonthlyPaymentRequests(), fetchPaymentTransactions(), fetchPaymentDateChangeRequests()]);
  };

  const completeBookingPayment = async (bookingId: string) => {
    if (!user) return { success: false, error: 'You must be signed in to continue payment.' };
    const booking = bookings.find((item) => item.id === bookingId);
    const room = booking?.room || rooms.find((item) => item.id === booking?.room_id);
    if (!booking || !room || booking.student_id !== user.id || booking.status !== 'accepted') {
      return { success: false, error: 'This booking is not eligible for payment.' };
    }
    if (booking.payment_status === 'paid') return { success: true };
    if (!profile?.mobile_number || !isValidMobileNumber(profile.mobile_number)) {
      return { success: false, error: 'Add a valid mobile number in your profile before paying.' };
    }

    console.info('[payment] Initial booking payment requested', {
      bookingId,
      roomId: booking.room_id,
      ownerId: booking.owner_id,
      studentId: booking.student_id,
      amount: room.price,
    });

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
      customerPhone: profile.mobile_number,
    });

    if (!paymentResult.success) {
      const nextStatus = paymentResult.status === 'pending' ? 'pending' : 'failed';
      console.error('[payment] Initial booking payment failed before persistence', { bookingId, paymentResult, nextStatus });
      await supabase.from('bookings').update({ payment_status: nextStatus }).eq('id', bookingId);
      setBookings((prev) => prev.map((item) => item.id === bookingId ? { ...item, payment_status: nextStatus } : item));
      return { success: false, error: paymentResult.error || String(paymentResult.metadata.reason || 'Initial payment failed') };
    }

    const paymentReference = paymentResult.reference;
    const paidAt = paymentResult.processedAt;
    console.info('[payment] Initial booking verified, saving transaction', {
      bookingId,
      paymentReference,
      paidAt,
      metadata: paymentResult.metadata,
    });
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
        order_id: typeof paymentResult.metadata.order_id === 'string' ? paymentResult.metadata.order_id : null,
        payment_id: typeof paymentResult.metadata.payment_id === 'string' ? paymentResult.metadata.payment_id : paymentReference,
        payment_signature: typeof paymentResult.metadata.payment_signature === 'string' ? paymentResult.metadata.payment_signature : null,
        payer_name: profile?.name || booking.student_name || null,
        payer_email: profile?.email || user.email || null,
        payer_phone: profile.mobile_number || null,
        verified_at: paidAt,
        metadata: paymentResult.metadata,
      })
      .select()
      .single();

    if (transactionError) {
      await supabase.from('bookings').update({ payment_status: 'failed' }).eq('id', bookingId);
      setBookings((prev) => prev.map((item) => item.id === bookingId ? { ...item, payment_status: 'failed' } : item));
      console.error('[payment] Failed to save initial payment transaction', transactionError);
      return { success: false, error: transactionError.message };
    }

    const nextPaymentDate = formatDateOnly(addDays(paidAt, 30));
    console.info('[payment] Updating booking payment state', {
      bookingId,
      paymentReference,
      paidAt,
      nextPaymentDate,
    });
    const { error } = await supabase.from('bookings').update({
      payment_status: 'paid',
      payment_reference: paymentReference,
      paid_at: paidAt,
      last_successful_payment_date: paidAt,
      rent_due_date: nextPaymentDate,
      next_payment_date: nextPaymentDate,
    }).eq('id', bookingId);

    if (error) {
      console.error('[payment] Failed to update booking payment state', error);
      return { success: false, error: error.message };
    }

    const adminUsers = await getAdminUsers();
    await createInAppNotifications([
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
      ...adminUsers.map((adminUser) => ({
        user_id: adminUser.id,
        title: 'Initial Payment Completed',
        message: `Initial booking payment completed for "${room.title}" (${paymentReference}).`,
      })),
    ]);

    setPaymentTransactions((prev) => [transaction as PaymentTransactionRow, ...prev]);
    setBookings((prev) => prev.map((item) => item.id === bookingId ? {
      ...item,
      payment_status: 'paid',
      payment_reference: paymentReference,
      paid_at: paidAt,
      last_successful_payment_date: paidAt,
      rent_due_date: nextPaymentDate,
      next_payment_date: nextPaymentDate,
    } : item));
    console.info('[payment] Initial booking state updated locally', { bookingId, paymentReference });
    return { success: true };
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

  const createMonthlyPaymentRequest = async (bookingId: string, input?: { amount?: number; dueDate?: string; note?: string }) => {
    if (!user) return false;
    const booking = bookings.find((item) => item.id === bookingId);
    const agreement = agreements.find((item) => item.booking_id === bookingId);
    if (!booking || booking.owner_id !== user.id || booking.status !== 'accepted' || !agreement) return false;

    const existingRequests = monthlyPaymentRequests
      .filter((item) => item.booking_id === bookingId)
      .sort((a, b) => a.due_month.localeCompare(b.due_month));
    const hasOpenCycle = existingRequests.some((item) => item.status !== 'accepted');
    if (hasOpenCycle) return false;

    const nextPaymentDate = booking.next_payment_date || booking.rent_due_date;
    if (!nextPaymentDate) return false;

    const minimumAllowedDate = new Date(nextPaymentDate);
    const requestedDueDate = input?.dueDate ? new Date(input.dueDate) : minimumAllowedDate;
    if (requestedDueDate < minimumAllowedDate) return false;

    const dueDate = formatDateOnly(requestedDueDate);
    const dueMonth = `${requestedDueDate.getFullYear()}-${String(requestedDueDate.getMonth() + 1).padStart(2, '0')}-01`;
    const periodLabel = requestedDueDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (existingRequests.some((item) => item.due_month === dueMonth)) return false;

    const { error } = await supabase.from('monthly_payment_requests').insert({
      booking_id: bookingId,
      owner_id: booking.owner_id,
      student_id: booking.student_id,
      due_month: dueMonth,
      due_date: dueDate,
      amount: input?.amount || agreement.monthly_rent,
      note: input?.note?.trim() || null,
      period_label: periodLabel,
      status: 'pending',
    });

    if (error) return false;

    const adminUsers = await getAdminUsers();
    await createInAppNotifications([
      {
        user_id: booking.student_id,
        title: 'Monthly Rent Due',
        message: `A new monthly rent request is available for ${periodLabel}.`,
      },
      {
        user_id: booking.owner_id,
        title: 'Payment Request Created',
        message: `Monthly payment request created for ${periodLabel}.`,
      },
      ...adminUsers.map((adminUser) => ({
        user_id: adminUser.id,
        title: 'Payment Request Created',
        message: `Monthly payment request created for ${periodLabel}.`,
      })),
    ]);

    await fetchMonthlyPaymentRequests();
    return true;
  };

  const payMonthlyPaymentRequest = async (requestId: string) => {
    if (!user) return { success: false, error: 'You must be signed in to continue payment.' };
    const request = monthlyPaymentRequests.find((item) => item.id === requestId);
    if (!request || request.student_id !== user.id || request.status === 'accepted' || request.status === 'owner_confirmation_pending' || request.status === 'processing') {
      return { success: false, error: 'This rent request cannot be paid right now.' };
    }
    if (!request.booking_id || !request.owner_id || !request.student_id || !request.amount) {
      return { success: false, error: 'This rent request is missing payment details. Please ask the owner to create it again.' };
    }

    const booking = bookings.find((item) => item.id === request.booking_id);
    if (!booking || booking.status !== 'accepted') return { success: false, error: 'The booking is not active for rent payment.' };
    if (!profile?.mobile_number || !isValidMobileNumber(profile.mobile_number)) {
      return { success: false, error: 'Add a valid mobile number in your profile before paying rent.' };
    }

    console.info('[payment] Monthly rent payment requested', {
      requestId,
      bookingId: request.booking_id,
      ownerId: request.owner_id,
      studentId: request.student_id,
      amount: request.amount,
      dueDate: request.due_date,
      dueMonth: request.due_month,
    });

    const { error: processingError } = await supabase.from('monthly_payment_requests').update({ status: 'processing' }).eq('id', requestId);
    if (processingError) {
      console.error('[payment] Failed to mark monthly request as processing', { requestId, processingError });
      return { success: false, error: processingError.message };
    }

    setMonthlyPaymentRequests((prev) => prev.map((item) => item.id === requestId ? { ...item, status: 'processing' } : item));
    console.info('[payment] Monthly rent payment started', { requestId, bookingId: request.booking_id, amount: request.amount });

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
      customerPhone: profile.mobile_number,
    });

    if (!paymentResult.success) {
      const nextStatus = paymentResult.status === 'pending' ? 'pending' : 'failed';
      await supabase.from('monthly_payment_requests').update({ status: nextStatus }).eq('id', requestId);
      setMonthlyPaymentRequests((prev) => prev.map((item) => item.id === requestId ? { ...item, status: nextStatus } : item));
      console.error('[payment] Monthly rent payment gateway failed', { requestId, paymentResult });
      return { success: false, error: paymentResult.error || String(paymentResult.metadata.reason || 'Monthly payment failed') };
    }

    const paymentReference = paymentResult.reference;
    const paidAt = paymentResult.processedAt;
    console.info('[payment] Monthly rent verified, saving transaction', {
      requestId,
      bookingId: request.booking_id,
      paymentReference,
      paidAt,
      metadata: paymentResult.metadata,
    });
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
        order_id: typeof paymentResult.metadata.order_id === 'string' ? paymentResult.metadata.order_id : null,
        payment_id: typeof paymentResult.metadata.payment_id === 'string' ? paymentResult.metadata.payment_id : paymentReference,
        payment_signature: typeof paymentResult.metadata.payment_signature === 'string' ? paymentResult.metadata.payment_signature : null,
        payer_name: profile?.name || booking.student_name || null,
        payer_email: profile?.email || user.email || null,
        payer_phone: profile.mobile_number || null,
        verified_at: paidAt,
        payment_request_id: request.id,
        metadata: paymentResult.metadata,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('[payment] Failed to save monthly payment transaction', transactionError);
      await supabase.from('monthly_payment_requests').update({ status: 'failed' }).eq('id', requestId);
      setMonthlyPaymentRequests((prev) => prev.map((item) => item.id === requestId ? { ...item, status: 'failed' } : item));
      return { success: false, error: transactionError.message };
    }

    const { error } = await supabase.from('monthly_payment_requests').update({
      status: 'owner_confirmation_pending',
      payment_reference: paymentReference,
      paid_at: paidAt,
      transaction_id: transaction.id,
    }).eq('id', requestId);

    if (error) {
      console.error('[payment] Failed to update monthly payment request after verification', error);
      await supabase.from('monthly_payment_requests').update({ status: 'failed' }).eq('id', requestId);
      setMonthlyPaymentRequests((prev) => prev.map((item) => item.id === requestId ? { ...item, status: 'failed' } : item));
      return { success: false, error: error.message };
    }

    const adminUsers = await getAdminUsers();
    await createInAppNotifications([
      {
        user_id: request.owner_id,
        title: 'Owner Confirmation Pending',
        message: `Monthly rent payment received (${paymentReference}). Please verify and accept it.`,
      },
      {
        user_id: request.student_id,
        title: 'Payment Submitted',
        message: `Your rent payment for ${request.period_label || new Date(request.due_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} was submitted successfully.`,
      },
      ...adminUsers.map((adminUser) => ({
        user_id: adminUser.id,
        title: 'Monthly Payment Completed',
        message: `A monthly rent payment was submitted and is waiting for owner confirmation (${paymentReference}).`,
      })),
    ]);

    setMonthlyPaymentRequests((prev) => prev.map((item) => item.id === requestId ? {
      ...item,
      status: 'owner_confirmation_pending',
      payment_reference: paymentReference,
      paid_at: paidAt,
      transaction_id: transaction.id,
    } : item));
    setPaymentTransactions((prev) => [transaction as PaymentTransactionRow, ...prev]);
    console.info('[payment] Monthly rent state updated locally', {
      requestId,
      transactionId: transaction.id,
      paymentReference,
      status: 'owner_confirmation_pending',
    });
    await Promise.all([fetchMonthlyPaymentRequests(), fetchPaymentTransactions()]);
    return { success: true };
  };

  const confirmMonthlyPaymentRequest = async (requestId: string, resolutionNote?: string) => {
    if (!user) return false;
    const request = monthlyPaymentRequests.find((item) => item.id === requestId);
    if (!request || request.owner_id !== user.id || request.status !== 'owner_confirmation_pending') return false;

    const confirmedAt = new Date().toISOString();
    const nextCycleDate = formatDateOnly(addDays(request.paid_at || confirmedAt, 30));
    const { error } = await supabase.from('monthly_payment_requests').update({
      status: 'accepted',
      confirmed_at: confirmedAt,
      confirmed_by: user.id,
      owner_response_note: resolutionNote?.trim() || null,
    }).eq('id', requestId);

    if (error) return false;

    await supabase.from('bookings').update({
      last_successful_payment_date: request.paid_at || confirmedAt,
      rent_due_date: nextCycleDate,
      next_payment_date: nextCycleDate,
    }).eq('id', request.booking_id);

    await supabase
      .from('payment_transactions')
      .update({
        status: 'accepted',
        owner_confirmed_at: confirmedAt,
        owner_confirmed_by: user.id,
      })
      .eq('payment_request_id', requestId);

    const adminUsers = await getAdminUsers();
    await createInAppNotifications([
      {
        user_id: request.student_id,
        title: 'Monthly Payment Accepted',
        message: `Your rent payment for ${request.period_label || new Date(request.due_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} has been accepted by the owner.`,
      },
      ...adminUsers.map((adminUser) => ({
        user_id: adminUser.id,
        title: 'Monthly Payment Accepted',
        message: `Monthly payment for ${request.period_label || new Date(request.due_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} has been accepted.`,
      })),
    ]);

    await Promise.all([fetchMonthlyPaymentRequests(), fetchPaymentTransactions(), fetchBookings()]);
    return true;
  };

  const rejectMonthlyPaymentRequest = async (requestId: string, resolutionNote: string) => {
    if (!user) return false;
    const request = monthlyPaymentRequests.find((item) => item.id === requestId);
    if (!request || request.owner_id !== user.id || request.status !== 'owner_confirmation_pending') return false;

    const { error } = await supabase.from('monthly_payment_requests').update({
      status: 'failed',
      owner_response_note: resolutionNote.trim() || 'Owner reported an issue with the payment.',
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
    }).eq('id', requestId);

    if (error) return false;

    await supabase
      .from('payment_transactions')
      .update({ status: 'failed' })
      .eq('payment_request_id', requestId);

    const adminUsers = await getAdminUsers();
    await createInAppNotifications([
      {
        user_id: request.student_id,
        title: 'Payment Issue Reported',
        message: 'The owner reported an issue with your rent payment. Please check the request details and contact support if needed.',
      },
      ...adminUsers.map((adminUser) => ({
        user_id: adminUser.id,
        title: 'Payment Issue Reported',
        message: `A monthly rent payment issue was reported for ${request.period_label || new Date(request.due_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.`,
      })),
    ]);

    await Promise.all([fetchMonthlyPaymentRequests(), fetchPaymentTransactions()]);
    return true;
  };

  const requestPaymentDateChange = async (bookingId: string, requestedDueDate: string, reason: string) => {
    if (!user) return false;
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking || booking.student_id !== user.id || !booking.rent_due_date) return false;

    const currentDueDate = booking.rent_due_date;
    if (new Date(requestedDueDate) <= new Date(currentDueDate)) return false;

    const activeRequest = paymentDateChangeRequests.find((item) => item.booking_id === bookingId && item.status === 'pending');
    if (activeRequest) return false;

    const openMonthlyRequest = monthlyPaymentRequests.find((item) => item.booking_id === bookingId && item.status !== 'accepted');
    const { error } = await supabase.from('payment_date_change_requests').insert({
      booking_id: bookingId,
      payment_request_id: openMonthlyRequest?.id || null,
      requester_id: user.id,
      current_due_date: currentDueDate,
      requested_due_date: requestedDueDate,
      reason: reason.trim() || null,
      status: 'pending',
    });

    if (error) return false;

    const adminUsers = await getAdminUsers();
    await createInAppNotifications([
      {
        user_id: booking.owner_id,
        title: 'Payment Date Change Requested',
        message: `The renter requested to move the due date from ${new Date(currentDueDate).toLocaleDateString()} to ${new Date(requestedDueDate).toLocaleDateString()}.`,
      },
      ...adminUsers.map((adminUser) => ({
        user_id: adminUser.id,
        title: 'Payment Date Change Requested',
        message: `A renter requested a due date change for booking ${bookingId}.`,
      })),
    ]);

    await fetchPaymentDateChangeRequests();
    return true;
  };

  const respondToPaymentDateChangeRequest = async (requestId: string, status: 'approved' | 'rejected', resolutionNote?: string) => {
    if (!user) return false;
    const request = paymentDateChangeRequests.find((item) => item.id === requestId);
    const booking = request ? bookings.find((item) => item.id === request.booking_id) : null;
    if (!request || !booking || booking.owner_id !== user.id || request.status !== 'pending') return false;

    const resolvedAt = new Date().toISOString();
    const { error } = await supabase.from('payment_date_change_requests').update({
      status,
      responder_id: user.id,
      resolution_note: resolutionNote?.trim() || null,
      resolved_at: resolvedAt,
    }).eq('id', requestId);

    if (error) return false;

    if (status === 'approved') {
      await supabase.from('bookings').update({
        rent_due_date: request.requested_due_date,
        next_payment_date: request.requested_due_date,
      }).eq('id', request.booking_id);

      if (request.payment_request_id) {
        await supabase.from('monthly_payment_requests').update({
          due_date: request.requested_due_date,
        }).eq('id', request.payment_request_id);
      }
    }

    await createInAppNotifications([
      {
        user_id: booking.student_id,
        title: status === 'approved' ? 'Payment Date Change Approved' : 'Payment Date Change Rejected',
        message: status === 'approved'
          ? `Your requested payment date change was approved. New due date: ${new Date(request.requested_due_date).toLocaleDateString()}.`
          : 'Your requested payment date change was rejected.',
      },
    ]);

    await Promise.all([fetchPaymentDateChangeRequests(), fetchMonthlyPaymentRequests(), fetchBookings()]);
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

  const submitUserReport = async (bookingId: string, reportedUserId: string, category: string, details: string) => {
    if (!user) return false;

    const { error } = await supabase.from('user_reports').insert({
      booking_id: bookingId,
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      category,
      details: details.trim() || null,
    });

    if (error) return false;

    const adminUsers = await getAdminUsers();
    await createInAppNotifications(adminUsers.map((adminUser) => ({
      user_id: adminUser.id,
      title: 'User Safety Report',
      message: `A ${category.toLowerCase()} report was submitted for booking ${bookingId}.`,
    })));

    await fetchUserReports();
    return true;
  };

  const updateUserReportStatus = async (reportId: string, status: 'reviewed' | 'resolved', resolutionNote?: string) => {
    if (!user || profile?.role !== 'admin') return false;

    const resolvedAt = new Date().toISOString();
    const { error } = await supabase.from('user_reports').update({
      status,
      resolution_note: resolutionNote?.trim() || null,
      reviewed_at: resolvedAt,
      reviewed_by: user.id,
    }).eq('id', reportId);

    if (error) return false;

    setUserReports((prev) => prev.map((report) => report.id === reportId ? {
      ...report,
      status,
      resolution_note: resolutionNote?.trim() || '',
    } : report));
    return true;
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
    if (error) return false;

    await Promise.all([fetchAllUsers(), fetchRooms(), fetchBookings(), fetchRoomReports(), fetchUserReports()]);
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
        paymentDateChangeRequests,
        userReports,
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
        completeBookingStay,
        completeBookingPayment,
        acceptAgreement,
        createMonthlyPaymentRequest,
        payMonthlyPaymentRequest,
        confirmMonthlyPaymentRequest,
        rejectMonthlyPaymentRequest,
        requestPaymentDateChange,
        respondToPaymentDateChangeRequest,
        toggleWishlist,
        sendMessage,
        fetchMessages,
        markConversationRead,
        fetchReviews,
        submitReview,
        fetchRoomReports,
        submitRoomReport,
        updateRoomReportStatus,
        fetchUserReports,
        submitUserReport,
        updateUserReportStatus,
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
