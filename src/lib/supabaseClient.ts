import { demoSupabaseClient } from './demoSupabaseMock';

// ── MITHAQ DEMO SANDBOX ──
// Completely isolated in-memory & local-storage mock engine.
// ZERO network requests to any production database.
export const isDemoMode = true;

export const supabase = demoSupabaseClient;
