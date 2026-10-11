# 4399AGI targeted refinement — 9 October 2026

## Changes and validation results

| Validation issue | Refinement | Result |
|---|---|---|
| Mobile game limitation | Added a concise Play Now notice for coarse-pointer or no-hover devices, immediately above the game. It states that the export has no touch controls and lists the actual mouse/keyboard inputs. | **PASS for honest guidance; game remains desktop-controlled.** Desktop fine-pointer browser hides the notice. A physical touch device was not available for this test. |
| Unfamiliar right-click start | Added “Right-click PLAY inside the game to begin” beside the loaded status, above the frame. The hint hides after an in-frame right click and reappears on restart. | **PASS.** Browser test confirmed appearance on load and disappearance after right click. |
| Small functional text | Raised functional navigation, status, control, section, and cross-link labels to at least 12px with shared `refinements.css`; left decorative microtype small. Raised utility link/button tap height. | **PASS.** Browser inspection at 375px found no visible functional links/buttons or selected labels below 12px. |
| Offscreen cursor loops | Home, Gameplay, and Characters now share an IntersectionObserver-driven cursor-parallax lifecycle. It cancels its animation frame offscreen, while hidden, or under reduced motion, and resumes without duplicate loops. | **PASS by code review and normal browser operation.** A reduced-motion OS/browser emulation was unavailable; existing CSS fallbacks were also reviewed. |
| Accessibility / learnability | Rechecked menu Tab/Shift+Tab/Escape, current-page states, spoiler reveal/hide, iframe title, status and control text, game keyboard isolation, and console errors. | **PASS for the tested website interactions.** The Construct export's touch accessibility remains limited. |

## Retest

- All five pages checked at **1440, 1280, 1024, 768, 430, 390, and 375px**: no document-level horizontal overflow or broken images.
- Embedded game loaded; Space and ArrowUp/Down/Left/Right caused **zero surrounding-page scroll** while active. Normal Space scrolling resumed after leaving the game area.
- Characters spoiler revealed and hid through its button. The mobile menu kept reverse Tab focus inside and Escape returned focus to its toggle. Every page exposed the correct mobile `aria-current` link.
- No console errors appeared in the five-page browser pass. Changed JavaScript files passed `node --check`.

## Remaining limitation and decision

The Construct export has no usable touch movement/jump controls. Making the game genuinely playable on phones requires changing and re-exporting the game, then testing its touch input. The website now explains that limit without suggesting that decorative controls can play the game. Physical touch hardware and browser-level reduced-motion emulation were not available in this pass, so those two conditions should receive a final device check before publication.
