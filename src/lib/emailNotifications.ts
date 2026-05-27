import { invokeEdgeFunction } from '@/lib/edgeFunctions';

interface BookingRequestEmailPayload {
  ownerEmail: string;
  ownerName: string;
  requesterName: string;
  requesterEmail: string;
  studentEmail?: string;
  roomTitle: string;
  roomLocation: string;
  rentAmount?: number;
  bookingDate: string;
  dashboardUrl?: string;
}

interface NewUserEmailPayload {
  userName: string;
  userEmail: string;
  role: string;
  registrationDate: string;
}

interface WelcomeEmailPayload {
  userName: string;
  userEmail: string;
  role: 'student' | 'owner';
  appUrl?: string;
}

interface SystemAlertPayload {
  channel: 'email' | 'sms';
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

const invokeNotification = async <T>(
  fn: string,
  payload: T,
  mode: 'public' | 'authenticated' = 'authenticated',
) => {
  try {
    console.info(`[email] Invoking ${fn}`, payload);
    const result = await invokeEdgeFunction<T, { success: boolean; error?: string }>(fn, {
      mode,
      body: payload,
    });

    if (!result.success) {
      console.error(`Failed to invoke ${fn}:`, result.error);
      return { success: false, error: result.error };
    }

    const data = result.data;
    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      console.error(`Function ${fn} reported a failure:`, data);
      return { success: false, error: data.error || 'Unknown function error' };
    }

    return { success: true };
  } catch (error) {
    console.error(`Failed to invoke ${fn}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown notification error',
    };
  }
};

export const notifyBookingRequestEmail = async (payload: BookingRequestEmailPayload) => {
  return invokeNotification('send-booking-request-email', payload, 'authenticated');
};

export const notifyAdminNewUserEmail = async (payload: NewUserEmailPayload) => {
  return invokeNotification('send-admin-new-user-email', payload, 'public');
};

export const notifyWelcomeEmail = async (payload: WelcomeEmailPayload) => {
  return invokeNotification('send-welcome-email', payload, 'public');
};

export const notifySystemAlertEmail = async (payload: SystemAlertPayload) => {
  return invokeNotification('send-system-alert-email', payload, 'authenticated');
};

export const notifySystemAlertSms = async (payload: SystemAlertPayload) => {
  return invokeNotification('send-system-alert-sms', payload, 'authenticated');
};
