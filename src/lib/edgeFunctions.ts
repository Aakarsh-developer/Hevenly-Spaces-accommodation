import { supabase } from '@/integrations/supabase/client';

type EdgeFunctionMode = 'public' | 'authenticated';

interface InvokeEdgeFunctionOptions<TBody> {
  body: TBody;
  mode?: EdgeFunctionMode;
}

interface EdgeFunctionResponse<TData> {
  success: boolean;
  data?: TData;
  error?: string;
  status: number;
}

const EDGE_FUNCTION_TIMEOUT_MS = 20000;

const getSupabaseFunctionUrl = (functionName: string) => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL');
  }

  return `${baseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`;
};

const getSupabaseAnonKey = () => {
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY');
  }

  return anonKey;
};

export const invokeEdgeFunction = async <TBody, TData = unknown>(
  functionName: string,
  options: InvokeEdgeFunctionOptions<TBody>,
): Promise<EdgeFunctionResponse<TData>> => {
  const mode = options.mode || 'authenticated';
  const url = getSupabaseFunctionUrl(functionName);
  const anonKey = getSupabaseAnonKey();
  const headers: Record<string, string> = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };

  if (mode === 'authenticated') {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  console.info('[edge-function] invoking', {
    functionName,
    mode,
    url,
    hasAuthorization: !!headers.Authorization,
  });

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), EDGE_FUNCTION_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(options.body),
      signal: controller.signal,
    });

    const rawText = await response.text();
    let parsed: unknown = null;

    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch (parseError) {
        console.error('[edge-function] failed to parse response', {
          functionName,
          status: response.status,
          rawText,
          parseError,
        });
      }
    }

    if (!response.ok) {
      const structuredError = parsed && typeof parsed === 'object' && 'error' in parsed
        ? String((parsed as { error?: unknown }).error || '')
        : rawText || `HTTP ${response.status}`;

      console.error('[edge-function] request failed', {
        functionName,
        status: response.status,
        error: structuredError,
      });

      return {
        success: false,
        error: structuredError,
        status: response.status,
      };
    }

    return {
      success: true,
      data: parsed as TData,
      status: response.status,
    };
  } catch (error) {
    console.error('[edge-function] request threw', {
      functionName,
      error,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown network error',
      status: 0,
    };
  } finally {
    window.clearTimeout(timeout);
  }
};
