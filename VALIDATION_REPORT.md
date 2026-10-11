# 4399AGI website validation — 9 October 2026

## Overall result

**PASS with accessibility and mobile-play limitations.** All five pages are present and visually coherent. The game can be launched. The strongest areas are visual hierarchy, consistent identity, and content grouping. Accessibility and learnability need the most attention, mainly around the game's desktop-only controls and very small supporting text.

## Test coverage and evidence

- Inspected Home, Gameplay, How to Play, Characters, and Play Now in a browser and reviewed their markup, styles, and scripts.
- Checked all five layouts at 1440, 1280, 1024, 768, 430, 390, and 375px. After the marquee fix, no page had document-level horizontal overflow at the checked widths. Images loaded in the responsive matrix. Fonts loaded in the browser.
- Tested menu opening and Escape, training control buttons, the Characters subject selector and spoiler reveal, game iframe loading, and Space plus all four arrow keys while the iframe was active. The game page's scroll position stayed unchanged for those five keys. Checked local page links: 83 references, no missing targets. No console errors appeared in the inspected flows. JavaScript syntax checks passed.
- Reviewed reduced-motion rules in CSS/JS. The browser was not switched into OS-level reduced-motion mode, so that path has a code-level check rather than a full visual check. Fullscreen availability and a complete game run were not verified.

## Principle assessment

| Principle | Status | Evidence |
|---|---|---|
| Effectiveness | PASS | Hero names a 2D platform adventure; primary Play Now links and fixed navigation are visible; all five destinations are reachable. |
| Learnability | PARTIAL | Familiar page labels and control diagrams help, but the exported game's right-click-to-start action is unusual and explained below the game frame. |
| Accessibility | PARTIAL | Skip links, semantic headings, alt text, iframe title, focus styling, and reduced-motion rules exist. The mobile menu focus boundary and missing mobile current-page states required fixes. Tiny labels remain. |
| Utility | PASS | Gameplay explains movement/progression, How to Play covers controls and goals, Characters covers player/hazards with protected endings, and Play Now loads the real game. |
| Safety | PASS | Endings start hidden, game-key scroll blocking is scoped to active gameplay, and Escape exits the mobile menu. |
| Colour and contrast | PARTIAL | White/green/cyan against the dark background give clear primary contrast; some secondary labels are only 9–10px, reducing practical legibility despite colour contrast. |
| Scale and hierarchy | PASS | Distinct hero, section, and CTA scales guide attention. Mobile headings and artwork stayed within the viewport at tested widths. |
| Space and balance | PASS | Large art and type are offset by quieter statement and footer areas; asymmetry remains readable. |
| Proximity | PASS | Control labels sit near demonstrations; gameplay copy sits near screenshots; CTAs sit near their prompts. |
| Repetition and consistency | PARTIAL | Shared fonts, navigation, colours, buttons, and footer create continuity. Three mobile current-page states were initially missing and are now fixed. |
| Motion and performance | PARTIAL | Reveals, parallax, and marquee serve the campaign style and did not block navigation in testing. Hero cursor parallax keeps a requestAnimationFrame loop alive even after the hero has scrolled away. |

## Confirmed issues

### 1. Home horizontal overflow — fixed

**PRINCIPLE:** Scale / responsiveness. **STATUS:** PARTIAL → PASS. **EVIDENCE:** The rotated and scaled marquee section made Home 12–35px wider than the viewport in the initial mobile/desktop pass. **IMPACT:** Unwanted side scrolling and clipped composition. **IMPROVEMENT:** Rotated the inner rows inside the clipped section, preserving the visual. Rechecked at 390 and 1440px and the full responsive matrix. **PRIORITY:** HIGH.

### 2. Mobile menu focus could leave the overlay — fixed

**PRINCIPLE:** Accessibility / navigation. **STATUS:** PARTIAL → PASS. **EVIDENCE:** Shift+Tab from the open menu could focus the underlying wordmark. **IMPACT:** Keyboard users could navigate obscured content. **IMPROVEMENT:** Wrap Tab and Shift+Tab within the menu button and links; Escape still closes and returns focus. **PRIORITY:** HIGH.

### 3. Mobile current-page indication missing on three pages — fixed

**PRINCIPLE:** Consistency / accessibility. **STATUS:** PARTIAL → PASS. **EVIDENCE:** Home, Gameplay, and How to Play had `aria-current="page"` in desktop navigation but not mobile navigation. **IMPACT:** Assistive technology did not announce the current page consistently. **IMPROVEMENT:** Added `aria-current="page"` to those mobile links. **PRIORITY:** MEDIUM.

### 4. Training keyboard demo reacted while using controls — fixed

**PRINCIPLE:** Accessibility / learnability. **STATUS:** PARTIAL → PASS. **EVIDENCE:** The document-level key listener excluded form fields but not focused links or buttons. **IMPACT:** Space/arrow use on another control could also animate the training demo. **IMPROVEMENT:** Excluded interactive targets, composition, and modifier-key shortcuts. Control buttons still update the readout. **PRIORITY:** MEDIUM.

### 5. Play Now remains keyboard dependent on touch devices — manual decision

**PRINCIPLE:** Utility / accessibility. **STATUS:** PARTIAL. **EVIDENCE:** The embedded Construct export uses right-click to start and arrow keys plus Space to play; the page itself says it is best played on desktop. **IMPACT:** Phone users can reach the prominent Play Now CTA but cannot reliably play with touch alone. **IMPROVEMENT:** Add touch controls inside the game export or explicitly route mobile visitors to a desktop-play explanation before launch. This requires a game design/export decision. **PRIORITY:** HIGH.

### 6. In-game start instruction is distant from the launch state — manual decision

**PRINCIPLE:** Learnability / proximity. **STATUS:** PARTIAL. **EVIDENCE:** The page-level START GAME button loads a separate game title screen that needs a right-click on Play; its reminder is below the game frame. **IMPACT:** A new player may believe the game is stuck after loading. **IMPROVEMENT:** Put a short right-click instruction beside the GAME LOADED status or inside the frame overlay until input begins. **PRIORITY:** MEDIUM.

### 7. Supporting labels are very small — manual design decision

**PRINCIPLE:** Scale / accessibility. **STATUS:** PARTIAL. **EVIDENCE:** Computed Home hero metadata is 9px; several navigation and micro-labels are 10px. **IMPACT:** Readability falls on small screens and at ordinary viewing distance. **IMPROVEMENT:** Raise functional labels to at least 12px and preserve the smallest type only for purely decorative metadata. Check wrapping at 375px. **PRIORITY:** MEDIUM.

### 8. Hero cursor loop runs offscreen — future optimization

**PRINCIPLE:** Motion / performance. **STATUS:** PARTIAL. **EVIDENCE:** Home's `parallax()` schedules another animation frame continuously while the hero is outside the viewport. **IMPACT:** Avoidable work during long-page reading, particularly on lower-powered devices. **IMPROVEMENT:** Pause the loop with an intersection/visibility state and resume when the hero returns. Apply the same audit to other cursor loops. **PRIORITY:** LOW.

## Final evaluation

**Strongest three aspects:** striking campaign identity without losing clear page functions; useful, grouped gameplay and training content; reliable embedded game launch and scoped gameplay keyboard handling.

**Most important five weaknesses:** touch-unplayable export, initial overflow, mobile focus escape, unfamiliar right-click start, and tiny secondary labels. The first three navigation/layout bugs were fixed where safe; the game export and type scale need deliberate product/design decisions.

**School summary:** The five-page 4399AGI website was tested in a browser at seven viewport widths, with checks for navigation, controls, image loading, keyboard behaviour, and the embedded game. Testing found a homepage overflow bug, mobile keyboard-navigation inconsistencies, and a training-control conflict; these were corrected and rechecked. The site now more consistently supports accessible navigation and responsive layout while retaining its strong visual hierarchy and motion-led identity. Further work should address mobile game controls and the clarity of the exported game's start instruction.
