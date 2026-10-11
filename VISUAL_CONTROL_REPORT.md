# 4399AGI visual and game-control refinement — 9 October 2026

## Changes

| Area | Change |
|---|---|
| Background | Set the shared stage and browser theme colour to neutral `#050505`, alternating quiet sections at `#0b0b0b` and `#080808`, with the footer at `#030303`. Removed blue-grey section fills while retaining blue/cyan inside game art and accents. |
| Typography | Reduced display-scale hero and repeated section headings, transition words, marquee rows, background words, and Play Now titles by roughly 15–20%. Body, navigation, functional labels, and CTA button text retain their readable sizes. |
| Rhythm | Calmer black sections and smaller mid-page headings now separate the large hero and final CTA moments. The Home marquee is shorter. |
| Home imagery | Replaced both small previews that repeated the player/mountain scene with real game warning, moving-platform, key, and door assets. One broad game-world image remains the anchor. |
| Gameplay imagery | The Level 2 and 3 progression/showcase panels now use distinct crops of the actual game's tile atlas behind their existing player/platform/enemy art, instead of reusing the same mountain backdrop everywhere. |
| How to Play imagery | Changed its hero player from the reused jumping pose to the actual walking pose, with a subdued environment so the instruction flow is dominant. |
| Characters / Play Now imagery | The archive gallery uses the walking character pose; Play Now uses that pose as title art and keeps the live game frame as the primary visual. |
| Pause / resume | Added a small, origin-checked message bridge inside the exported Construct project script. The site only reveals PAUSE after that bridge reports ready. Construct `runtime.timeScale` becomes `0` on pause and restores its previous value on resume; the custom movement tick also stops. A PAUSED overlay retains the visible canvas, and P/Escape work while the game has focus. |

## Retest

- Five pages at **1440, 1280, 1024, 768, 430, 390, and 375px**: no document-level horizontal overflow or broken images. Computed body background was `rgb(5, 5, 5)` at the checked widths. Mobile hero compositions, Home preview, and Play Now controls were visually inspected.
- The exported game launched and entered Level 1. PAUSE showed the overlay without reloading. Its reported Construct game time stayed at `9.8495s` over an approximately `1.8s` real-time pause and advanced to `10.0246s` after resume. The iframe source remained `game/index.html` and the level view remained in place.
- Mouse and keyboard pause/resume, including P and Escape, worked. Escape still closed the mobile menu without pausing the game. Space and all four arrow keys still caused zero surrounding-page scroll during active gameplay. No console errors appeared in the tested flows; changed JavaScript files passed syntax checks.

## Remaining limits and manual decisions

- The export still requires a mouse and keyboard. The existing touch-device notice remains; pause does not make the game touch-playable.
- All promotional art comes from the supplied game assets, which contain one mountain background and a small set of character poses. The new crops and detail views reduce repetition, but more varied **true gameplay screenshots** would require capturing additional game states or levels and choosing them editorially.
- The pause bridge lives in the current exported `game/scripts/project/main.js`. A future Construct export will replace that file unless the same bridge is added to the editable `.c3p` project script before re-exporting. Construct's documented `runtime.timeScale` is the engine control used here: https://www.construct.net/en/make-games/manuals/construct-3/scripting/scripting-reference/iruntime
