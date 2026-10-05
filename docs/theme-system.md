# Frontend Theme System

## Purpose

All active frontend colors are defined as semantic CSS custom properties at the
top of [`globals.css`](../src/app/globals.css). Component selectors consume
those roles instead of literal colors, so changing or adding a color scheme
does not require editing individual components.

The names describe purpose rather than hue. For example, a primary action can
change from violet to green in another theme without renaming the token, while
text, borders, and selected states can still use different shades.

## Theme Definitions

- `:root` is the complete light theme and the fallback when no theme attribute
  is present.
- `html[data-theme="dark"]` is the complete dark theme.
- Both blocks intentionally list every theme token, including values that are
  currently identical. This makes either block self-contained and safe to copy
  when creating another scheme.
- Typography and layout tokens are not theme colors and remain separate.

### Structural Parity

Light and dark have the same theme format:

| Check | Result |
| --- | --- |
| Semantic declarations | 32 light and 32 dark |
| Token names | Exact same set; no light-only or dark-only token |
| Component consumers | Exact same selectors because components reference roles, not theme values |
| Roles with different values | 11 |
| Roles retaining the same value | 21 |
| Distinct resolved values | 29 light and 31 dark |

The last count differs because multiple light roles intentionally share white,
while dark surfaces and on-color text use separate values. That does not change
the structure: both themes still define the same 32 roles in the same places.
The only theme-specific component selectors outside the token blocks switch
the light and dark logo assets; they do not assign colors.

Run `npm run check:themes` after palette or component-color changes. It fails
when the token sets differ, a token is unused, or a component selector contains
a raw color instead of a semantic role.

## Text And Actions

| Token | Light | Dark | Applied to |
| --- | --- | --- | --- |
| `--color-text-primary` | `#1C1B22` | `#EAEAEA` | Body text, headings, inputs, ordinary controls, and hover text |
| `--color-text-secondary` | `#606060` | `#EDEDED` | Supporting copy, metadata, hints, labels, counts, and footer text |
| `--color-text-on-primary` | `#FFFFFF` | `#121212` | Text on primary action buttons and navigation pills |
| `--color-text-on-solid` | `#FFFFFF` | `#FFFFFF` | Text on selected-state and destructive solid fills |
| `--color-action-primary` | `#A55BFF` | `#9B5CFD` | Primary buttons, login controls, and normal navigation pills |
| `--color-action-selected` | `#7B4DFF` | `#9A6DFF` | Links, selected filters, active categories, badges, and segmented controls |
| `--color-action-hover` | `#56CFE1` | `#56CFE1` | Hover/active navigation, control emphasis, and cyan callouts |

## Surfaces And Structure

| Token | Light | Dark | Applied to |
| --- | --- | --- | --- |
| `--color-surface-page` | `#F5F5FA` | `#1C1B22` | Page, frame, forms, controls, and table-header surfaces |
| `--color-surface-panel` | `#FFFFFF` | `#121212` | Sidebars, dropdowns, table bodies, settings panels, and modal-like surfaces |
| `--color-surface-chrome` | `#EDEDED` | `#24232A` | Navigation and footer containers |
| `--color-surface-selected` | Violet at 12% | Violet at 12% | Selected sidebar and category rows |
| `--color-surface-row-hover` | Violet at 8% | Violet at 8% | Table-row hover feedback |
| `--color-border-primary` | `#7A42D9` | `#7A42D9` | Main frames, panels, controls, tables, and structural separators |
| `--color-border-strong` | Violet at 35% | Violet at 35% | Section boundaries and framed secondary panels |
| `--color-border-subtle` | Violet at 20% | Violet at 20% | Table rows and light section dividers |
| `--color-border-divider` | Violet at 18% | Violet at 18% | Compact category-menu dividers |
| `--color-border-card` | White at 70% | White at 70% | Form-card edge |
| `--color-border-glass` | White at 60% | White at 60% | Home feature-card edge |
| `--color-border-control` | Dark neutral at 15% | Dark neutral at 15% | Standard text-input border |
| `--color-border-ghost` | Dark neutral at 20% | Dark neutral at 20% | Ghost-button border |
| `--shadow-panel` | Dark neutral at 18% | Black at 45% | Elevated panels, menus, tables, and button hover |

## Focus And Status

| Token | Light | Dark | Applied to |
| --- | --- | --- | --- |
| `--color-focus-ring` | Orange at 40% | Orange at 40% | Focus outline around text inputs |
| `--color-focus-border` | Orange at 60% | Orange at 60% | Focused text-input border |
| `--color-status-success-message` | `#15803D` | `#15803D` | Inline success helper text |
| `--color-status-success-border` | `#18794E` | `#18794E` | Verified/success status-pill border |
| `--color-status-success-text` | `#18794E` | `#72D6A3` | Verified/success status-pill text |
| `--color-status-error-message` | `#B91C1C` | `#B91C1C` | Inline error helper text |
| `--color-status-danger-outline` | `#D64550` | `#D64550` | Destructive table-action text and border |
| `--color-status-danger-surface` | Red at 12% | Red at 12% | Destructive table-action hover fill |
| `--color-status-danger-primary` | `#B42332` | `#B42332` | Solid destructive buttons and danger-zone border |
| `--color-status-danger-hover` | `#8F1724` | `#8F1724` | Solid destructive-button hover fill |
| `--background-featured-card` | Orange-tinted light gradient | Charcoal/violet dark gradient | Highlighted home feature card |

The three structural surfaces preserve one hierarchy and invert its lightness
between themes. Light mode is `panel > page > chrome`; dark mode is
`panel < page < chrome`. The theme check enforces this relationship so the
sidebars, center page, and navigation/footer retain the same visual pattern
instead of merely reusing unrelated dark values.

## Adding A Theme

1. Copy one complete theme block and change its selector to a new
   `html[data-theme="name"]` value.
2. Assign every documented token. Do not add literal colors to component
   selectors.
3. Add the new theme name to the theme selector/persistence logic.
4. Check ordinary, hover, focus, selected, success, error, and destructive
   states on both compact and wide layouts.
5. Verify text/background contrast before exposing the theme to users.

Use `rg -n 'var\(--color-|var\(--background-|var\(--shadow-' src` to find
every consumer. A raw-color scan outside the theme definitions should remain
empty.

## Cleanup Baseline

The earlier ambiguous variables (`--ink`, `--muted`, `--accent`,
`--accent-strong`, `--accent-cyan`, `--surface`, `--surface-strong`,
`--chrome-surface`, `--border`, and `--shadow`) have been removed. The unused
legacy catalog/list card rules and their blue-gray cover gradient were also
removed. Every remaining color token has an active stylesheet consumer.
