# Ijabah CSS architecture

## Audit

The original stylesheets combined shared structure, route layout, painted surfaces and responsive overrides. The same selectors meant different things depending on their position in the cascade. Navigation, du’a cards, reading dialogs and the opening animation depended on both the base and painted sheets. The organizer stylesheet also placed unrelated rules on the same physical lines, making reviews and diffs difficult.

The old hero family was obsolete. The rendered home route uses the separate desert hero classes. A repository search checked the old class names against JSX, conditional class assignments, and other assets before removal. The active desert hero, painted canvases, animation classes and responsive variants retain their styles.

Repeated font stacks and control timings can share tokens. Similar-looking colors, artwork positioning and animation timings are often specific to a scene, so they retain their original values. Arabic and reduced-motion priority rules protect real overrides and stay in place. The tiny navigation captions, du’a metadata, opening eyebrow and Tahajjud captions were promoted to the shared 12px caption token. The Ummah page uses the existing button pseudo-element for its brown and cream fills, giving both inactive and active links a contrasting text color.

## Cascade and ownership

1. Existing shared component imports retain their position relative to the global entry points. Route-specific sheets remain with their lazy routes.
2. [Base](../src/styles/base.css) loads tokens and global defaults, component structure, page layout, shared accessibility and responsive behavior.
3. [Painted](../src/styles/painted.css) applies canvas treatment and localized painted variations, including responsive and animation finishing rules. Its import order reflects dependencies in the original artwork.
4. The desert hero, organizer, desert page theme and safe-area sheets retain their previous order and scope.

Add a new component’s structural styles in its component stylesheet. Use a route stylesheet for styles local to that route. Use the painted layer for shared canvas treatments. Keep selector and declaration order when moving a rule across files. Values remain in CSS pixels where their original behavior depended on them.

## Scope

The baseline is the committed Uplifters feature branch. The CSS-only branch excludes pending changes in the original worktree. Older general breakpoints are retained where merging them would change layout or artwork. Native-device typography and screen-reader checks remain separate from headless Chromium checks.
