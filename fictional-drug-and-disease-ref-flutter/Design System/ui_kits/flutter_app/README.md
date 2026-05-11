# Flutter App — UI Kit

Pixel-faithful web mirror of the Flutter components defined in the
`fictional-drug-and-disease-ref-flutter` codebase. The kit is **for
composing prototypes** — it is not the production code path, and it is
not a screen design.

## What's here

| File | Purpose |
| --- | --- |
| `Components.jsx` | The component library. Exports primitives to `window.*` so other Babel scripts can compose them. |
| `index.html`     | An interactive composition demo in a 390 dp phone frame. |
| `ios-frame.jsx`  | Spare iOS device-frame primitives (status bar, glass pill, list rows). Currently unused; keep available for further composition. |

## Component map (single source of truth)

```
atoms          : Icon, Hairline, Chip, AppliedFilterChip
form / inputs  : SegControl, SearchField
chrome         : SearchTopChrome, AppliedChipRail, SearchResultToolbar
overlays       : BottomSheet, FilterSheet
nav            : BottomNav
shell          : Disclaimer (always-on)
result cards   : DrugCard, DiseaseCard
footers        : DetailFooter (bookmark + secondary action)
fab            : FilterFab
data           : DRUG_FILTER_AXES, DISEASE_FILTER_AXES, CHIP_FG, CHIP_FG_DARK, labelFor
```

## Scope contract (do not violate)

This kit is the implementation of `lib/ui/search/widgets/*` and adjacent
shared widgets, surfaced as web components. It is **not** a recreation of:

- the Search screen as an information architecture (navigation labels are illustrative),
- the Detail screen,
- list pages, modals, or any concrete domain flow.

When using the kit in new designs, compose the primitives. Do not invent
new chip axes, do not localize or shorten the disclaimer copy, and do not
introduce new color tokens — use the variables in `colors_and_type.css`.

## Loading order

```html
<link rel="stylesheet" href="../../colors_and_type.css">
<link rel="stylesheet" href="../../disclaimer-ribbon.css">
<link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" rel="stylesheet">
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" ... ></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" ... ></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" ... ></script>
<script type="text/babel" src="Components.jsx"></script>
<script type="text/babel">/* compose window.* here */</script>
```
