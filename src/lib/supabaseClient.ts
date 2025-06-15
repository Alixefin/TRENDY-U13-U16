
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // We will create this file later for types

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Helper type for the mock client's error structure
type MockError = { message: string; details: string; hint: string; code: string } | null;

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `Supabase URL or anon key is missing. 
      Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
      Falling back to a mock client for development purposes. NO DATA WILL BE SAVED.`
    );

    const mockSupabase = {
      from: (tableName: string) => {
        let currentError: MockError = { message: `Mock Supabase: Query on ${tableName} - no connection`, details: '', hint: '', code: '' };
        let currentData: any = []; // Default to array for multi-row select
        let isSingleQuery = false;

        const builder = {
          select: function(columns: string = '*') {
            // console.warn(`Mock Supabase: .select("${columns}") called on ${tableName}`);
            currentData = isSingleQuery ? null : [];
            currentError = { message: `Mock Supabase: select on ${tableName} - no connection`, details: '', hint: '', code: '' };
            if (isSingleQuery && currentData === null) {
              currentError.message = `Mock Supabase: single select on ${tableName} - no connection`;
            }
            return this;
          },
          insert: function(rowData: any) {
            // console.warn(`Mock Supabase: .insert() called on ${tableName}`);
            // For insert().select().single(), Supabase returns the inserted object (or first if array)
            const dataToReturn = Array.isArray(rowData) ? (rowData[0] || {}) : (rowData || {});
            currentData = dataToReturn;
            currentError = null; // Simulate successful insert for mock
            isSingleQuery = true; // insert().select().single() implies single result
            return this;
          },
          update: function(rowData: any) {
            // console.warn(`Mock Supabase: .update() called on ${tableName}`);
            const dataToReturn = Array.isArray(rowData) ? (rowData[0] || {}) : (rowData || {});
            currentData = dataToReturn;
            currentError = null;
            isSingleQuery = true;
            return this;
          },
          delete: function() {
            // console.warn(`Mock Supabase: .delete() called on ${tableName}`);
            currentData = []; // Supabase delete often returns the deleted items
            currentError = null;
            isSingleQuery = false; // delete can affect multiple, but select might follow
            return this;
          },
          order: function(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
            console.warn(`Mock Supabase: .order() called on ${tableName} for ${column}. Data will not actually be ordered.`);
            return this;
          },
          eq: function(column: string, value: any) {
            console.warn(`Mock Supabase: .eq() called on ${tableName} for ${column}=${value}. Data will not actually be filtered.`);
            // if (isSingleQuery) { // If .single() was called before .eq(), this might adjust currentData based on a mock scenario
            //    currentData = null; // Reset if filter means no match
            // }
            return this;
          },
          single: function() {
            // console.warn(`Mock Supabase: .single() called on ${tableName}`);
            isSingleQuery = true;
            currentData = null; 
            currentError = { message: `Mock Supabase: single select on ${tableName} - no record found or connection error`, details: '', hint: '', code: '' };
            return this;
          },
          // Make the builder thenable (awaitable)
          then: function(onFulfilled: (value: { data: any; error: MockError; }) => void, onRejected?: (reason: any) => void) {
            let resultData = isSingleQuery ? currentData : currentData;
            if (isSingleQuery && resultData === undefined) resultData = null;
            if (!isSingleQuery && resultData === undefined) resultData = [];
            
            // if single and error, data should be null (Supabase behavior)
            if(isSingleQuery && currentError && resultData !== null) {
                 // resultData = null; // Be careful with this, as sometimes Supabase returns partial data + error
            }

            const result = { data: resultData, error: currentError };
            // console.log(`Mock promise for ${tableName} resolving with:`, JSON.stringify(result));
            return Promise.resolve(result).then(onFulfilled, onRejected);
          },
          catch: function(onRejected: (reason: any) => void) {
            // Ensure then is defined if catch is called directly on the builder.
            // This is a simplified catch. A full promise implementation would be more complex.
            return this.then(undefined, onRejected);
          }
        };
        return builder;
      },
      storage: {
        from: (bucket: string) => ({
            upload: async (path: string, file: File | Blob, options?: any) => {
                 console.warn(`Mock Supabase Storage: .upload() called for bucket ${bucket}. File will not be uploaded.`);
                 return ({ data: { path: `mock/${bucket}/${path}` }, error: null });
            },
            getPublicUrl: (path: string) => {
                console.warn(`Mock Supabase Storage: .getPublicUrl() called for path ${path} in bucket ${bucket}.`);
                return ({ data: { publicUrl: `https://placehold.co/128x128.png?text=MOCK` } });
            },
        }),
      }
    };
    globalThis.supabaseClientInstance = mockSupabase as any as SupabaseClient<Database>;
  } else {
    throw new Error("Supabase URL and anon key are required. Application cannot start in production without them.");
  }
} else {
   globalThis.supabaseClientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = globalThis.supabaseClientInstance;
