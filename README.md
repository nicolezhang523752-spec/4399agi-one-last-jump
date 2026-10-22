# 4399AGI — One Last Jump

Home, Gameplay, How to Play, Characters, and Play Now campaign pages for the supplied Construct 3 game. The site uses copied visual assets from `4399AGI_MODERN_FIXED.c3p`; the original game project is unchanged.

## Cloudflare Pages

Connect this GitHub repository to Cloudflare Pages. Use the `main` branch, leave the framework preset as None, leave the build command blank, and set the output directory to `/` (repository root). This is a static site; no build or environment variables are required.

## Structure

- `index.html` — homepage.
- `gameplay.html` — Gameplay page with a sticky mechanics sequence and level compositions.
- `how-to-play.html` — interactive training sequence for controls and the level objective.
- `characters.html` — interactive archive of the player, enemies, obstacles, and hidden ending artwork.
- `play.html` — focused launch page for the HTML5 export, with loading, pause/resume, fullscreen, restart, and missing-build states.
- `styles.css` — shared design system, navigation, footer, and homepage styling.
- `gameplay.css`, `how-to-play.css`, `characters.css`, `play.css` — page layouts and responsive styles.
- `refinements.css`, `visual-tuning.css` — targeted readability, neutral-black, and display-scale refinements.
- `script.js` — shared navigation and pointer behavior.
- `gameplay.js`, `how-to-play.js`, `characters.js`, `play.js` — page interactions.
- `source_assets/images/` — original game backgrounds and sprites.
- `game/` — the supplied Construct 3 HTML5 export; see its README.

The Play Now page is connected throughout the site and loads the playable Construct 3 export from `game/`. The exported title screen currently requires a right-click on its Play button, so the launch page states this clearly. The Gameplay and training compositions use the game's own art because the supplied project has no full-quality screenshot files.

## Accounts

The five pages share a Supabase email/password account dialog. The public project URL and publishable key are set in `js/supabase-config.js`. Follow [supabase/SETUP.md](supabase/SETUP.md) to run the SQL migration and configure the production auth redirect. No scores or leaderboard are stored.

Pause/resume uses a message bridge in `game/scripts/project/main.js` to set Construct's runtime time scale to zero and restore it. The Play Now page only displays the pause control when this bridge reports ready. The editable `.c3p` source has not been changed; port the bridge into its project script before a future re-export, or the new export will overwrite pause support.
