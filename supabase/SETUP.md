# 4399AGI account setup

1. Create a Supabase project. In its SQL Editor, run [`profiles.sql`](profiles.sql).
   This creates `public.profiles`, a case-insensitive unique username index, three owner-only RLS policies, and an `auth.users` trigger that creates profiles at sign-up. The trigger supports email confirmation because a new user may have no browser session yet.
2. The project URL and **publishable** key are already set in `js/supabase-config.js`. Do not replace the public key with a secret or service role key.
3. In Authentication → URL Configuration, set **Site URL** to `https://4399agi-one-last-jump.pages.dev/`. Add `https://4399agi-one-last-jump.pages.dev/index.html` to **Redirect URLs**. Add a custom domain and localhost development URL only if you use them. The site sends the current origin's `index.html` as `emailRedirectTo`.
4. In Authentication → Providers → Email, enable email/password and decide whether to require email confirmation. Configure a production SMTP provider if you expect regular public sign-ups; Supabase's default email sending has limits.
5. Deploy the changed static files to Cloudflare Pages. The browser uses the official `@supabase/supabase-js` v2 client from jsDelivr. If you use a Content Security Policy, permit that script origin and connections to your Supabase project URL.

The account setup above must be complete before applying the leaderboard migration below.

## Live verification

On the production domain, check sign-up, email confirmation, duplicate email, duplicate username, incorrect password, sign-in, refresh persistence, sign-out, and missing-profile handling. Test the dialog with Tab, Shift+Tab, Escape, and a narrow mobile viewport. Network and database behavior cannot be verified until the project URL, public key, and SQL migration are applied.

## Leaderboard

Run [`leaderboard.sql`](leaderboard.sql) in the same project's SQL Editor **after** `profiles.sql`. It creates `public.scores` and a public, narrow `public.leaderboard_view`. The view lists each player's best run and username; direct score history remains readable only by its owner. The view intentionally uses its privileged owner to read across players while projecting only public leaderboard fields. Do not change it to `security_invoker` without also redesigning the read policies, or the public leaderboard will become empty. No service-role key belongs in browser code.

The Construct game script `game/scripts/project/main.js` emits `4399agi:run-complete` when its real `WinScreen` or `Gameover Screen` starts. `play.js` accepts messages only from its same-origin game iframe; `js/score-submission.js` attaches the authenticated user ID and inserts the result. A failed insert is shown as **FAILED TO SAVE SCORE**, with a retry button. Logged-out runs are not saved until the player signs in and retries on the still-open page.

After entering Level1, the player can also click **END RUN** below the game. This enters the existing Gameover Screen and records the gameplay reached so far; it helps players submit a score without waiting for a loss or win.

The game export has no native score variable. The current score is calculated from real gameplay state: `level_reached × 1000 + total gold collected × 100 + (on win: 500 + remaining seconds × 5)`. Elapsed gameplay time is stored as `completion_time` in milliseconds; pausing does not add time. `attempts` stays null because the export does not expose a reliable attempt count. Each run has a `run_id` UUID to prevent duplicate inserts.

Ranking uses one best run per player. Sort by score descending, level descending, completion time ascending (unknown times last), creation time ascending, then row ID for a stable final tie. The leaderboard is visible to guests. A signed-in user sees their best score, latest run, approximate rank, and their five most recent runs.

**Integrity limit:** this is a browser game. A determined player can forge client-side result data and submit it with their own account. RLS prevents writing for another user, but it cannot prove that a score came from honest gameplay. A competition with prizes needs trusted server-side verification or server-observed gameplay before treating scores as authoritative.

After running SQL, verify a real signed-in game-over/win result is inserted, its username appears on the leaderboard, a second run creates a second history row while only the best appears in ranking, guest display, rank ordering, sign-out, and mobile layout. Until this migration runs, the page shows a load error and submissions report failure.
