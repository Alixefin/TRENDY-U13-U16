
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // We will create this file later for types

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `Supabase URL or anon key is missing. 
      Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
      Falling back to a mock client for development purposes. NO DATA WILL BE SAVED.`
    );
    // Provide a mock client if in development and keys are missing
    // This allows the app to run without actual Supabase connection for UI development
    const mockSupabase = {
      from: (table: string) => ({
        select: async () => ({ data: [], error: { message: `Mock Supabase: select from ${table} - no connection`, details: '', hint: '', code: '' } }),
        insert: async (rowData: any) => ({ data: Array.isArray(rowData) ? rowData : [rowData] , error: { message: `Mock Supabase: insert into ${table} - no connection`, details: '', hint: '', code: '' } }),
        update: async () => ({ data: [], error: { message: `Mock Supabase: update ${table} - no connection`, details: '', hint: '', code: '' } }),
        delete: async () => ({ data: [], error: { message: `Mock Supabase: delete from ${table} - no connection`, details: '', hint: '', code: '' } }),
        upload: async () => ({ data: null, error: { message: `Mock Supabase: upload - no connection`, details: '', hint: '', code: '' } }), // For storage
      }),
      storage: {
        from: (bucket: string) => ({
            upload: async () => ({ data: { path: `mock/path/to/file.png` }, error: null }),
            getPublicUrl: (path: string) => ({ data: { publicUrl: `https://placehold.co/128x128.png?text=MOCK` } }),
        }),
      }
    };
    // Type assertion to SupabaseClient to satisfy TypeScript, actual methods are mocked.
    // You might need to expand mocks for more complex scenarios or specific types if used directly.
    globalThis.supabaseClientInstance = mockSupabase as any as SupabaseClient<Database>;
  } else {
    throw new Error("Supabase URL and anon key are required. Application cannot start in production without them.");
  }
} else {
   globalThis.supabaseClientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = globalThis.supabaseClientInstance;
