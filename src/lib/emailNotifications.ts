import { supabase } from '@/integrations/supabase/client';

interface BookingRequestEmailPayload {
  ownerEmail: string;
  ownerName: string;
  requesterName: string;
  requesterEmail: string;
  roomTitle: string;
  roomLocation: string;
  bookingDate: string;
}

interface NewUserEmailPayload {
  userName: string;
  userEmail: string;
  role: string;
  registrationDate: string;
}

const invokeNotification = async <T>(fn: string, payload: T) => {
  try {
    await supabase.functions.invoke(fn, { body: payload });
  } catch (error) {
    console.error(`Failed to invoke ${fn}:`, error);
  }
};

export const notifyBookingRequestEmail = async (payload: BookingRequestEmailPayload) => {
  await invokeNotification('send-booking-request-email', payload);
};

export const notifyAdminNewUserEmail = async (payload: NewUserEmailPayload) => {
  await invokeNotification('send-admin-new-user-email', payload);
};
