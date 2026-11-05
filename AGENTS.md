# AGENTS.md

## Architecture
- The whole app is `index.html`: the `<head>` holds metadata, the favicon (an inline SVG data URI) and fonts, then one `<style>` block, the body markup, the main `<script>`, and a small visual-only drag-highlight script.
- `netlify.toml` publishes the repo root as a static site. There is no build step.

## Conventions and non-obvious decisions
- **Don't change IDs, class names, markup order or the main script.** The JS builds the results with `innerHTML` templates and looks up elements by ID.
- The brand name is "CareBridge" (no "AI"). The logo is the user's heart, house and hand mark redrawn in the pastel green and peach palette: `assets/logo.svg`, inlined in the header and favicon; the original upload is `assets/carebridge-logo-original.jpg`. The logo is drawn with gradients, soft shadows and highlights so it looks polished and dimensional, not flat or emoji-like. The header restyles the roof gradient stops (`.r1`, `.r2`) to `--link`/`--primary-900` so the roof shows in dark mode.
- The hero (`#welcome`) is a single centred text column (`.hx`, max 760px). The decorative illustration and floating chips were removed at the user's request; don't add photos or illustrations back. Content sections are capped at 900px inside the 1180px page.
- Theme tokens are CSS custom properties on `:root`. The dark tokens appear twice, once in the `prefers-color-scheme: dark` query (`:root:not([data-theme="light"])`) and once in `:root[data-theme="dark"]`. Keep the two copies in sync.
- The Warning signs card has no class of its own, so CSS selects it as `#out>.card:nth-child(9)`. If the order in `render()` changes, update this selector.
- Card hover lift uses the `translate` property so it doesn't clash with the `transform`-based entrance animations, which use `animation-fill-mode: backwards`.
- Chat typing dots restyle the existing `.sp` element when it sits inside `.a`.
- The print styles override the tokens with `:root:root:root` so they beat the dark-theme selectors.
- `prefers-reduced-motion` turns off all motion except the loading spinner, which slows down instead.
- Keep text contrast at WCAG AA or better. Text on the primary gradients is white.
