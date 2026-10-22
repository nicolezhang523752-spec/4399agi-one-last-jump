// The official Supabase JavaScript v2 client is loaded before this file.
const config = window.AGI_SUPABASE_CONFIG || {};
const configured = /^https:\/\/[a-z0-9.-]+\/?$/i.test(config.url || '')
  && !String(config.url).includes('YOUR_')
  && /^(sb_publishable_|eyJ)/.test(config.anonKey || '');

window.AGI_AUTH_CLIENT = configured && window.supabase?.createClient
  ? window.supabase.createClient(config.url.replace(/\/$/, ''), config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;
