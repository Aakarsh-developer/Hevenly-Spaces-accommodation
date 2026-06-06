import { supabase } from '@/integrations/supabase/client';
import { formatAuthError } from '@/lib/authErrors';

export interface RecoveryActionResult {
  success: boolean;
  error?: string;
  cooldownSeconds?: number;
  details?: unknown;
}

interface PasswordResetProvider {
  requestReset: (email: string, redirectTo?: string) => Promise<RecoveryActionResult>;
  updatePassword: (newPassword: string) => Promise<RecoveryActionResult>;
}

const RECOVERY_EMAIL_COOLDOWN_SECONDS = 60;
const PASSWORD_RESET_PATH = '/auth?mode=reset';

const buildSafeRedirectUrl = (redirectTo?: string) => {
  if (typeof window === 'undefined') return redirectTo;

  const fallback = new URL(PASSWORD_RESET_PATH, window.location.origin).toString();
  if (!redirectTo) return fallback;

  try {
    const candidate = new URL(redirectTo, window.location.origin);
    if (candidate.origin !== window.location.origin) {
      console.warn('[password-reset] Rejected cross-origin redirect URL', { redirectTo });
      return fallback;
    }

    return candidate.toString();
  } catch (error) {
    console.error('[password-reset] Invalid redirect URL provided', { redirectTo, error });
    return fallback;
  }
};

export const getPasswordResetRedirectUrl = () => {
  if (typeof window === 'undefined') return PASSWORD_RESET_PATH;
  return new URL(PASSWORD_RESET_PATH, window.location.origin).toString();
};

const emailRecoveryProvider: PasswordResetProvider = {
  async requestReset(email, redirectTo) {
    const normalizedEmail = email.trim().toLowerCase();
    const safeRedirectTo = buildSafeRedirectUrl(redirectTo);
    console.info('[password-reset] Requesting Supabase password reset email', {
      email: normalizedEmail,
      redirectTo: safeRedirectTo,
    });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: safeRedirectTo,
      });

      if (error) {
        console.error('[password-reset] Supabase resetPasswordForEmail failed', error);
        return {
          success: false,
          error: formatAuthError(
            error,
            'We could not send a password reset email right now. Please try again shortly.',
          ),
          details: error,
        };
      }

      console.info('[password-reset] Supabase recovery email requested successfully', {
        email: normalizedEmail,
      });

      return {
        success: true,
        cooldownSeconds: RECOVERY_EMAIL_COOLDOWN_SECONDS,
      };
    } catch (error) {
      console.error('[password-reset] Unexpected reset request failure', error);
      return {
        success: false,
        error: 'We could not send a password reset email right now. Please try again shortly.',
        details: error,
      };
    }
  },

  async updatePassword(newPassword) {
    console.info('[password-reset] Updating user password');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error('[password-reset] Password update failed', error);
      return {
        success: false,
        error: formatAuthError(
          error,
          'We could not update your password. Please request a fresh reset and try again.',
        ),
        details: error,
      };
    }

    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('[password-reset] Session refresh after password update failed', refreshError);
    }

    await supabase.auth.signOut();
    console.info('[password-reset] Password update succeeded and recovery session was cleared');
    return { success: true };
  },
};

export const passwordRecoveryService = {
  currentProvider: emailRecoveryProvider,
};
