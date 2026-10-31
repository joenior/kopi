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

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return clientInstance;
};

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
