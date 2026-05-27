import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/lib/edgeFunctions';

export interface RecoveryActionResult {
  success: boolean;
  error?: string;
  cooldownSeconds?: number;
}

interface PasswordResetProvider {
  requestReset: (email: string, redirectTo?: string) => Promise<RecoveryActionResult>;
  verifyCode: (email: string, token: string) => Promise<RecoveryActionResult>;
  verifyTokenHash: (tokenHash: string) => Promise<RecoveryActionResult>;
  updatePassword: (newPassword: string) => Promise<RecoveryActionResult>;
}

const recoveryErrorMessage = 'This recovery link or code is invalid or has expired. Please request a new one.';

const emailRecoveryProvider: PasswordResetProvider = {
  async requestReset(email, redirectTo) {
    try {
      const result = await invokeEdgeFunction<
        { email: string; redirectTo?: string },
        { success: boolean; error?: string; cooldownSeconds?: number }
      >('send-password-reset-email', {
        mode: 'public',
        body: { email, redirectTo },
      });

      if (!result.success) {
        console.error('[auth-recovery] Reset request invoke failed', result);
        return {
          success: false,
          error: result.error || 'Password recovery request could not be started.',
        };
      }

      const data = result.data;
      if (data && data.success === false) {
        console.error('[auth-recovery] Reset request reported failure', data);
        return {
          success: false,
          error: data.error || 'Password recovery request could not be started.',
        };
      }

      return {
        success: true,
        cooldownSeconds: typeof data?.cooldownSeconds === 'number' ? data.cooldownSeconds : 60,
      };
    } catch (error) {
      console.error('[auth-recovery] Reset request failed', error);
      return { success: false, error: 'We could not start password recovery right now. Please try again shortly.' };
    }
  },

  async verifyCode(email, token) {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (error) {
      console.error('[auth-recovery] OTP verification failed', error);
      return { success: false, error: recoveryErrorMessage };
    }

    console.info('[auth-recovery] OTP verification succeeded', { email });
    return { success: true };
  },

  async verifyTokenHash(tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });

    if (error) {
      console.error('[auth-recovery] Token hash verification failed', error);
      return { success: false, error: recoveryErrorMessage };
    }

    console.info('[auth-recovery] Token hash verification succeeded');
    return { success: true };
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error('[auth-recovery] Password update failed', error);
      return { success: false, error: error.message || 'We could not update your password. Please request a fresh reset and try again.' };
    }

    await supabase.auth.signOut();
    console.info('[auth-recovery] Password update succeeded and user was signed out');
    return { success: true };
  },
};

export const passwordRecoveryService = {
  currentProvider: emailRecoveryProvider,
};
