# Dark Mode Design Comparison

## Purpose

This document compares the dark theme from the original CS2800 version of OmniMediaTrak with the current frontend. It is intended as a reference for reviewing visual refinements with a graphic designer.

The comparison separates:

- exact colors that were retained;
- colors or component assignments that changed;
- changes that affect hierarchy, readability, or interaction states;
- decisions that still need design direction.

## Source Files

| Version | Stylesheet |
| --- | --- |
| Original CS2800 version | [`style.css`](</run/media/brandon/EEB0F0D1B0F0A0EF/Classes/CS2800/final-project-rabiddoughnuts/style.css:38>) |
| Current frontend | [`globals.css`](../src/app/globals.css) |

## Executive Summary

The current dark mode still uses the original charcoal, violet, and cyan color
family. The main background, deepest content surface, violet border, cyan
accent, and danger red remain exact matches. The navigation/footer surface is
now deliberately lighter to complete the reversed three-level hierarchy.

The largest changes are:

1. Primary text is slightly darker; secondary text has been restored to the
   original value.
2. The bright violet used for interactive controls is slightly darker and bluer.
3. Cyan hover and active states now use light text instead of the original dark text.
4. The center content and sidebar surface colors have exchanged roles, while
   navigation/footer chrome is lighter than both in dark mode.
5. Controls now rely more on dark surfaces with violet borders instead of solid violet fills.
6. Shadows are substantially stronger.
7. Tables have gained separate header coloring and a translucent violet hover state.

The current design is more layered and subdued. The original design used brighter controls and stronger foreground/background contrast in interactive states.

## Core Palette Comparison

| Semantic role | Original dark mode | Current dark mode | Status | Visual effect |
| --- | --- | --- | --- | --- |
| Main background | `#1C1B22` | `#1C1B22` | Exact match | Preserves the original page-level charcoal. |
| Dark content surface | `#121212` | `#121212` | Exact match | Preserves the deepest content surface. |
| Navigation/footer surface | `#1A1A1A` | `#24232A` | Changed | Makes chrome the lightest dark-theme structural surface. |
| Primary text | `#F5F5FA` | `#EAEAEA` | Changed | Current text is slightly darker and less cool-toned. |
| Secondary light text | `#EDEDED` | `#EDEDED` | Exact match | Restores the original supporting-text brightness. |
| Violet border | `#7A42D9` | `#7A42D9` | Exact match | Preserves the original structural accent. |
| Bright violet | `#A55BFF` | `#9B5CFD` | Changed | Current violet is darker and slightly bluer. |
| Interactive/selected-state violet | `#7A42D9` | `#9A6DFF` | Role split | The original shared one violet across structure and selected text. The current theme retains `#7A42D9` for borders and uses `#9A6DFF` for selected controls, links, and interactive emphasis. |
| Cyan accent | `#56CFE1` | `#56CFE1` | Exact match | Preserves the original hover and active accent. |
| Danger red | `#D64550` | `#D64550` | Exact match | Still used for destructive table actions. |
| Shadow | Dark blue at 18% opacity | Black at 45% opacity | Changed significantly | Current shadows are darker and more pronounced. |

## Component Comparison

### Header

The header background is unchanged, while its text and button treatment have changed.

| Header element or state | Original | Current | Effect |
| --- | --- | --- | --- |
| Background | `#1C1B22` | `#1C1B22` | Exact match. |
| Primary text | `#F5F5FA` | `#EAEAEA` | Slightly darker in the current version. |
| Button background | `#A55BFF` | `#9B5CFD` | Darker and bluer violet. |
| Button text | `#F5F5FA` | `#121212` | Current normal state uses dark text. |
| Button hover background | `#56CFE1` | `#56CFE1` | Exact match. |
| Button hover text | `#1C1B22` | `#EAEAEA` | Current hover state changed from dark to light text. |

**Design review point:** The original cyan hover state deliberately paired cyan with dark text. The current cyan-and-light-text combination has weaker visual contrast and should be reviewed for readability and consistency.

### Navigation

The navigation container uses the original component role but now participates
in the mirrored surface hierarchy; navigation button states also differ.

#### Container

| Property | Original | Current | Status |
| --- | --- | --- | --- |
| Background | `#1A1A1A` | `#24232A` | Current chrome is lighter. |
| Border | `4px solid #7A42D9` | Bottom `2px solid #7A42D9` | Current border is thinner and only separates navigation from content. |

#### Buttons

| Navigation state | Original | Current | Effect |
| --- | --- | --- | --- |
| Normal background | `#A55BFF` | `#9B5CFD` | Current violet is darker and bluer. |
| Normal text | `#EDEDED` | `#121212` | Current normal state uses dark text. |
| Active/hover background | `#56CFE1` | `#56CFE1` | Exact match. |
| Active/hover text | `#1A1A1A` | `#EAEAEA` | Current active state uses light rather than dark text. |

**Design review point:** Header and navigation interactions should use the same semantic rules for normal, hover, selected, keyboard-focus, and disabled states.

### Main Surfaces

Both original surface colors remain, but their layout assignments have effectively reversed.

| Layout region | Original | Current |
| --- | --- | --- |
| Center content | `#121212` | `#1C1B22` |
| Sidebars | `#1C1B22` | `#121212` |

This changes which part of the page appears elevated or visually dominant. The
original design placed the darkest surface in the center. The current design
uses a deliberate progression: sidebars `#121212`, center `#1C1B22`, and
navigation/footer `#24232A`. That order reverses light mode's white sidebars,
off-white center, and darker gray chrome.

**Current rule:** Light mode descends `panel > page > chrome`; dark mode ascends
`panel < page < chrome`. The automated theme check enforces both orders.

### Controls and Tables

| Element | Original | Current | Effect |
| --- | --- | --- | --- |
| Controls bar | `#1C1B22` | `#121212` | Current controls sit on the deepest surface. |
| Control buttons | Solid `#A55BFF` with light text | `#1C1B22` with `#EAEAEA` text and violet borders | Current controls are quieter and more outlined. |
| Dropdown background | `#121212` | `#121212` | Exact match. |
| Dropdown text | `#FFFFFF` | `#EAEAEA` | Slightly softer current text. |
| Table body/cells | Explicit `#121212` cells | Body uses the `#121212` container | Similar appearance with different implementation. |
| Table headers | `#121212` | `#1C1B22` | Current version separates headers from body rows. |
| Table row hover | No distinct violet treatment | Translucent violet highlight | Current version adds interaction feedback. |

**Design review point:** Decide whether primary controls should read as prominent solid actions or quieter outlined tools. The final system may need both treatments, assigned by action importance rather than by page.

#### Interactive/Selected-State Violet

The palette entry previously called "selection violet" does **not** control
native browser text selection. Neither stylesheet defines a `::selection`
rule, so selecting text with the mouse will continue to use the browser's
default highlight.

In the original stylesheet, `#7A42D9` was the shared `--violet` token used for
structural borders, input focus borders, and active media-type text. The current
stylesheet separates those responsibilities:

| Current token | Dark value | Visible uses |
| --- | --- | --- |
| `--color-border-primary` | `#7A42D9` | Navigation, panels, controls, tables, inputs, and other structural borders. |
| `--color-action-selected` | `#9A6DFF` | Active/hovered media types, active filter categories, category selection counts, active segmented controls, action links, sort hover/focus, and feedback-review emphasis. |

Because most `--color-action-selected` uses are small text or conditional
active states, the difference is easiest to inspect with an active sidebar
media type, an open category filter, or the active half of a segmented control.
Changing it while none of those states is visible may appear to do nothing.

### Footer

| Footer property | Original | Current | Status |
| --- | --- | --- | --- |
| Background | `#1A1A1A` | `#24232A` | Current chrome is lighter. |
| Text | `#EDEDED` | `#EDEDED` | Exact match |

**Design review point:** Determine whether footer links and actions should remain subdued or use a brighter value for accessibility and discoverability.

## Exact Matches

These values can be treated as stable unless the broader palette is redesigned:

| Role | Color |
| --- | --- |
| Main background | `#1C1B22` |
| Dark content surface | `#121212` |
| Violet border | `#7A42D9` |
| Cyan accent | `#56CFE1` |
| Danger red | `#D64550` |

## Primary Design Questions

| Priority | Decision | Options to review | Why it matters |
| --- | --- | --- | --- |
| High | Text color on cyan controls | Original dark text vs. current light text | Affects readability, accessibility, and state consistency. |
| Resolved | Surface hierarchy | Mirrored three-level order across themes | Sidebars, center, and chrome now preserve one inverted relationship. |
| High | Interactive violet | Original `#A55BFF` vs. current `#9B5CFD` | Affects visual energy, contrast, and brand recognition. |
| High | Primary text | Original `#F5F5FA` vs. current `#EAEAEA` | Affects overall readability and warmth. |
| Medium | Secondary/footer text | Keep `#EDEDED` or introduce a deliberately muted alternative | Balances hierarchy against legibility. |
| Medium | Control style | Solid violet vs. outlined dark controls, with both available by action importance | Clarifies primary and secondary actions. |
| Medium | Table hierarchy | Uniform cells vs. separate header surface | Affects scanning and information density. |
| Medium | Table hover | No highlight vs. translucent violet highlight | Affects row tracking and interaction feedback. |
| Medium | Shadow strength | Dark blue at 18% vs. black at 45% | Affects depth, visual weight, and softness. |
| Low | Dropdown text | `#FFFFFF` vs. `#EAEAEA` | Small tonal difference, but should match the text system. |

## Suggested Review Order

1. Confirm the surface hierarchy for the center content, sidebars, controls, table headers, navigation, and footer.
2. Select primary and secondary text values based on contrast testing and the desired level of visual softness.
3. Define semantic interaction colors for normal, hover, active, focus, selected, and disabled states.
4. Decide when controls use solid fills versus outlined treatments.
5. Tune shadows and table hover effects after the larger hierarchy is settled.
6. Apply the resulting tokens consistently to both desktop and mobile layouts.

## Designer Decision Record

Use this table during the design review so approved choices can be translated into theme tokens without ambiguity.

| Topic | Approved choice | Notes or mockup reference |
| --- | --- | --- |
| Main background | TBD | |
| Center content surface | TBD | |
| Sidebar surface | TBD | |
| Navigation/footer surface | TBD | |
| Primary text | TBD | |
| Secondary text | TBD | |
| Primary violet | TBD | |
| Interactive/selected-state violet | TBD | Decide separately whether native `::selection` highlighting needs a theme token. |
| Cyan-state text | TBD | |
| Primary button treatment | TBD | |
| Secondary button treatment | TBD | |
| Table header treatment | TBD | |
| Table row hover treatment | TBD | |
| Shadow color and opacity | TBD | |

## Current Interpretation

The current dark theme is more muted, layered, and utility-oriented than the original. The original is brighter and uses stronger solid-color controls. Neither direction needs to be adopted wholesale: the final design can retain the current structural hierarchy while restoring the original's clearer dark text on cyan states and selectively using brighter violet for primary actions.

Any recommendation in this document is a discussion point. The hexadecimal comparisons and component assignments are the factual reference baseline.
