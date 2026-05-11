# Sample Design Spec

This page is the canary for the VRT pipeline. Treat any change to colors, font sizes, paddings, or copy as significant.

## Layout

- Page background: `#1c1f26`
- Two stacked sections: header + action area, with a footer divider on top
- Body font: system sans-serif, with default body text color `#f4f7fb`

## Header

- Padding: `48px 24px 24px`
- Title `<h1>` color: `#1f3a93` (brand navy), font size `32px`
- Description paragraph max width `720px`, line height `1.6`

## Action button

- Background: brand navy `#1f3a93`
- Text color: white
- Padding: `12px 24px`, border-radius `8px`
- Label: exactly "Primary Action"

## Footer

- Top border `1px solid #ddd`
- Text color `#555`, font-size `14px`
- Content: `design-blueprint · sample`

## VRT acceptance criteria

- viewport 1280x800, deviceScaleFactor 1 (Chromium)
- pixel diff threshold 10% (any change beyond mere antialiasing is a regression)
