# 4399AGI account setup

1. Create a Supabase project. In its SQL Editor, run [`profiles.sql`](profiles.sql).
   This creates `public.profiles`, a case-insensitive unique username index, three owner-only RLS policies, and an `auth.users` trigger that creates profiles at sign-up. The trigger supports email confirmation because a new user may have no browser session yet.
2. The project URL and **publishable** key are already set in `js/supabase-config.js`. Do not replace the public key with a secret or service role key.
3. In Authentication → URL Configuration, set **Site URL** to `https://4399agi-one-last-jump.pages.dev/`. Add `https://4399agi-one-last-jump.pages.dev/index.html` to **Redirect URLs**. Add a custom domain and localhost development URL only if you use them. The site sends the current origin's `index.html` as `emailRedirectTo`.
4. In Authentication → Providers → Email, enable email/password and decide whether to require email confirmation. Configure a production SMTP provider if you expect regular public sign-ups; Supabase's default email sending has limits.
5. Deploy the changed static files to Cloudflare Pages. The browser uses the official `@supabase/supabase-js` v2 client from jsDelivr. If you use a Content Security Policy, permit that script origin and connections to your Supabase project URL.

No leaderboard or score data is part of this setup.

## Live verification

On the production domain, check sign-up, email confirmation, duplicate email, duplicate username, incorrect password, sign-in, refresh persistence, sign-out, and missing-profile handling. Test the dialog with Tab, Shift+Tab, Escape, and a narrow mobile viewport. Network and database behavior cannot be verified until the project URL, public key, and SQL migration are applied.
