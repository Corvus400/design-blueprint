---
name: drug-disease-ref-design
description: Use this skill to generate well-branded interfaces and assets for the 医薬品・疾患リファレンス (fictional drug & disease reference) — a Japanese-language Flutter / Material 3 healthcare-professional reference app — either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files (`colors_and_type.css`, `disclaimer-ribbon.css`, `ui_kits/flutter_app/Components.jsx`, and the `preview/` cards).

Hard contract — read before doing anything:

1. **Locale is ja-JP only.** Never retranslate Japanese chip labels — copy them verbatim from `Components.jsx` (`DRUG_FILTER_AXES`, `DISEASE_FILTER_AXES`) or `lib/l10n/app_ja.arb`.
2. **Disclaimer ribbon is always-on.** Any view with medical content must render `<Disclaimer />` at the shell layer above the bottom safe-area inset. Never shorten or remove the ribbon copy.
3. **Two color systems, one app.** Round6 (`#007AFF`) for shell / nav / search. Material 3 *Detail* (`#1F5BB5`) for content-dense detail surfaces. Don't mix.
4. **No emoji, no gradients, no full-bleed photography, no inner shadows, no glow.** Material Symbols Outlined only; FILL=1 for selected.
5. **Domain-flavored examples are not prescriptions.** The seed says: do NOT design new search/detail/list screens by default; compose from primitives instead.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out (`fonts/`, `colors_and_type.css`, `disclaimer-ribbon.css`, `ui_kits/flutter_app/Components.jsx`) and create static HTML files for the user to view. If working on production code (Flutter / Dart), copy the design tokens and read the rules here to become an expert in designing with this brand — do not paste the JSX into the Flutter codebase.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (audience, surface, locale assumption, light/dark, what they want to compose), and act as an expert designer who outputs HTML artifacts _or_ production guidance, depending on the need.
