import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
};

export const shouldShowDbStatus = (): boolean => {
  if (process.env.NEXT_PUBLIC_SHOW_DB_STATUS === 'true') return true;
  if (process.env.NEXT_PUBLIC_SHOW_DB_STATUS === 'false') return false;

  const vercelEnv =
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.VERCEL_ENV;

  if (vercelEnv === 'production') return false;
  if (vercelEnv === 'preview') return true;

  return process.env.NODE_ENV === 'development';
};

declare global {
  var __supabaseClient: SupabaseClient | undefined;
}

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!globalThis.__supabaseClient) {
    globalThis.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return globalThis.__supabaseClient;
};

export const DEFAULT_CAFE_ID = 'CAFE-001';

// Supabase Authentication Helpers
export const getAuthUser = async (): Promise<User | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.warn('Gagal mengambil auth user:', err);
    return null;
  }
};

export const getStaffMembership = async (
  userId: string,
  cafeId: string = DEFAULT_CAFE_ID
): Promise<{ id: string; cafe_id: string; user_id: string; role: 'staff' | 'owner'; email?: string } | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('staff_memberships')
      .select('id, cafe_id, user_id, role')
      .eq('user_id', userId)
      .eq('cafe_id', cafeId)
      .maybeSingle();

    if (!error && data) {
      return data as { id: string; cafe_id: string; user_id: string; role: 'staff' | 'owner'; email?: string };
    }
    return null;
  } catch (err) {
    console.warn('Gagal mengambil staff membership:', err);
    return null;
  }
};

export const getAuthSession = async (): Promise<Session | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (err) {
    console.warn('Gagal mengambil session:', err);
    return null;
  }
};

export const signInAdmin = async (email: string, password: string) => {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: new AuthError('Supabase belum terhubung. Harap isi NEXT_PUBLIC_SUPABASE_URL dan KEY di .env.local'),
    };
  }
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signUpAdmin = async (email: string, password: string) => {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: new AuthError('Supabase belum terhubung. Harap isi NEXT_PUBLIC_SUPABASE_URL dan KEY di .env.local'),
    };
  }
  return await supabase.auth.signUp({ email, password });
};

export const signOutAdmin = async () => {
  const supabase = getSupabase();
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
};

export const uploadMenuImage = async (file: File): Promise<string | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `items/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Error upload gambar ke Supabase Storage:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error('Gagal mengunggah foto ke Supabase Storage:', err);
    return null;
  }
};
