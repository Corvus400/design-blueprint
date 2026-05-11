# 医薬品・疾患リファレンス — Design System

Japanese-language drug & disease reference for **healthcare-professional UX
exploration**. Flutter / Material 3 on iOS + Android. Phone (390 dp) and
tablet (834×1194 dp portrait, two-pane). Single locale: **ja-JP**.

> "Fictional" = mock data, portfolio project, **not a clinical-grade
> reference**. The always-on Disclaimer ribbon is the load-bearing UX
> contract that makes this safe to ship as a portfolio piece.

---

## Sources read for this system

| Kind | Path / handle | Notes |
| --- | --- | --- |
| Flutter app | `fictional-drug-and-disease-ref-flutter/` (mounted) | l10n + theme are SSOT |
| Flutter l10n | `lib/l10n/app_ja.arb` | visible Japanese text |
| Flutter theme | `lib/theme/app_palette.dart`, `lib/theme/detail_color_extension.dart` | light/dark tokens and chip foreground colors |
| Flutter typed models | `lib/domain/drug/drug.dart`, `lib/domain/drug/drug_nested.dart`, `lib/domain/disease/disease.dart`, `lib/domain/disease/disease_nested.dart` | DTO and nested fixture shape |
| Mock server | `fictional-drug-and-disease-ref-mock-server/` (mounted) | Kotlin KDoc enums; OpenAPI |
| Repos | `Corvus400/fictional-drug-and-disease-ref-flutter`, `Corvus400/fictional-drug-and-disease-ref-mock-server` | GitHub mirrors |

The Flutter file `lib/l10n/app_ja.arb` is the verified mirror of the
mock-server Kotlin KDoc and is enforced by
`test/l10n/drug_filter_alignment_test.dart`. **Do not retranslate** any
Japanese chip labels — copy them from `app_ja.arb` verbatim.

## Project index

```
README.md                — this file
colors_and_type.css      — design tokens (light + dark + Material 3 detail color extension)
disclaimer-ribbon.css    — always-on ribbon styles
fonts/                   — NotoSansJP-Regular.otf, NotoSansJP-Bold.otf
preview/                 — Design System preview cards (~700×N each)
ui_kits/flutter_app/     — interactive UI kit (Components.jsx)
```

---

## Content fundamentals

- **Locale**: ja-JP only. Mixed Japanese + Latin code identifiers (`ATC`,
  `YJ`, `ICD-10`). Numerals are half-width.
- **Tone**: clinical, terse, third-person. No "you / 君 / お客様". Section
  headers are one or two kanji compounds (`概要`, `用法・用量`, `禁忌`,
  `相互作用`, `副作用`, `薬物動態`, `関連`).
- **Casing & punctuation**: full-width Japanese punctuation (`、 。 ・`)
  inside narrative text; half-width inside code identifiers and meta lines
  (`ATC: C08CA01`, `改訂 2024-08-12`). Ratios use `:` (e.g. `1:8`).
- **Emoji**: never. Material Symbols only.
- **Disclaimer copy**: bound to l10n key `detailDisclaimer`:
  `FICTIONAL DATA - NOT FOR MEDICAL USE / 架空データ・医療判断には使用不可`.

## Visual foundations

- **Two color systems, one app.** Round6 is seeded from `#007AFF` and
  applies to bottom-nav, segmented control, FAB tints, and primary action
  button tints. Material 3 *Detail* (`DetailColorExtension`) is seeded
  from `#1F5BB5` and provides higher-saturation accents for content-dense
  surfaces.
- **Color accessibility:** choose foreground/background pairs to meet WCAG
  AA contrast, with a forward-looking `4.5:1` minimum in both light and dark
  themes. Exceptions are limited to non-text outline/surface tokens and
  AA-Large-only cases documented in `colors_and_type.css`.
- **Backgrounds**: solid pale neutrals (`#F2F2F7` shell, `#FBFBFE` detail).
  No gradients, no full-bleed photography, no patterns.
- **Cards**: white / `--d-surface-c-lowest` on the shell, radius 10,
  `0.5px` hairline border (`rgba(60,60,67,.13)`), one elevation level
  (`0 1px 2px rgba(15,23,42,.04)`).
- **Borders & hairlines**: iOS-style 0.5 px separator at
  `rgba(60,60,67,.13)` light / `rgba(255,255,255,.10)` dark.
- **Shadows**: only three — card, footer (negative-y soft), bottom sheet.
  No inner shadows. No glow.
- **Corner radii**: chip 5, badge 4, tile/image 8, **card 10** (`_cardRadius`),
  sheet card 12, M3 button pill 22, sheet 20 top, FAB 18.
- **Spacing**: 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40. Phone gutter 16,
  tablet gutter 28. Hit targets ≥ 44 px.
- **Typography**: NotoSansJP exclusively. Page heading 22 / 700 phone and
  26 / 700 tablet, brand 14 / 700, body 12.5–13 / 400, meta 11 / 500,
  chip 11 / 700, mono 11 (JetBrains Mono) for codes.
- **Animation**: M3 standard easing `cubic-bezier(.2, 0, 0, 1)`. Durations
  120 / 200 / 320 ms. Bottom sheet uses an iOS-style emphasized curve
  `cubic-bezier(.32,.72,0,1)` over 260 ms.
- **Hover / press**: opacity drop to 0.85 on press; no hover states (mobile-only).
- **Transparency & blur**: chip backgrounds at 5 % alpha of foreground, scrim
  at 32 %, never frosted-glass blur.
- **Imagery**: cool placeholder gradients only (`#D8E2FF` ↘ `#F2DAFF`).
  No photographs in this scope.

## Iconography

- **System**: Material Symbols Outlined, served from
  `https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined`.
  Fill state is encoded with `font-variation-settings: 'FILL' 1`.
  Outlined for unselected; filled for selected (navigation, toggleable controls).
- **No SVG icon set** is shipped. We do not draw glyphs by hand.
- **Emoji**: never used.
- **Logos / illustrations**: none — this is a clinical reference, not a
  consumer brand. The brand wordmark uses NotoSansJP 700 / 22 px.

---

## SSOT enum value counts (verbatim from `app_ja.arb`)

| Enum | Count | Values |
| --- | --- | --- |
| **RegulatoryClass** | **11** | 毒薬 / 劇薬 / 処方箋医薬品 / 普通薬 / 向精神薬第1種 / 向精神薬第2種 / 向精神薬第3種 / 麻薬 / 覚醒剤原料 / 生物由来製品 / 特定生物由来製品 |
| **DosageForm** | **13** | 錠剤 / カプセル / 散剤 / 顆粒 / 液剤 / 注射剤 / 軟膏 / クリーム / 貼付剤 / 点眼液 / 坐剤 / 吸入剤 / 点鼻液 |
| **RouteOfAdministration** | **8** | 内服 / 外用 / 注射 / 吸入 / 坐剤 / 点眼 / 点鼻 / 貼付 |
| **PrecautionPopulationCategory** | **8** | 合併症 / 腎機能障害 / 肝機能障害 / 生殖能有する患者 / 妊婦 / 授乳婦 / 小児等 / 高齢者 |
| **Chronicity** | **4** | 急性 / 亜急性 / 慢性 / 再発性 |
| **Icd10Chapter** | **22** | I — XXII (see `preview/chips-icd10.html`) |
| **OnsetPattern** | **5** | 急性発症 / 亜急性発症 / 慢性経過 / 間欠性 / 再発性 |
| **ExamCategory** | **5** | 血液検査 / 画像検査 / 生理検査 / 病理検査 / 問診 |
| **MedicalDepartment** | **16** | 内科 / 循環器内科 / 消化器内科 / 内分泌代謝科 / 神経内科 / 精神科 / 外科 / 整形外科 / 皮膚科 / 眼科 / 耳鼻咽喉科 / 泌尿器科 / 婦人科 / 小児科 / 救急科 / 感染症科 |

### Derived: short ICD-10 chapter label

The SSOT (`app_ja.arb:327-348`) ships the **long** ICD-10 chapter label only —
e.g. `IX 循環器系の疾患`. Compact contexts (≤ 1 line, ≤ 80 dp wide) need a
shorter form that fits within a chip. **Short labels are a design-system-owned
derivation, not an SSOT value**, and must be declared explicitly here so
consumers do not invent their own.

Mapping rule: keep the Roman numeral + the head noun (≤ 6 ja-glyphs); drop
trailing structure words `の疾患 / の障害 / および〜の影響 / および〜の利用 /
ならびに〜の障害`. Result:

| Long (SSOT)                                                       | Short (derived) |
| ---                                                                | --- |
| `I 感染症および寄生虫症`                                          | `I 感染症` |
| `II 新生物`                                                        | `II 新生物` |
| `III 血液および造血器の疾患ならびに免疫機構の障害`               | `III 血液・免疫` |
| `IV 内分泌、栄養および代謝疾患`                                   | `IV 内分泌・代謝` |
| `V 精神および行動の障害`                                          | `V 精神・行動` |
| `VI 神経系の疾患`                                                  | `VI 神経系` |
| `VII 眼および付属器の疾患`                                        | `VII 眼` |
| `VIII 耳および乳様突起の疾患`                                     | `VIII 耳` |
| `IX 循環器系の疾患`                                                | `IX 循環器系` |
| `X 呼吸器系の疾患`                                                 | `X 呼吸器系` |
| `XI 消化器系の疾患`                                                | `XI 消化器系` |
| `XII 皮膚および皮下組織の疾患`                                    | `XII 皮膚` |
| `XIII 筋骨格系および結合組織の疾患`                               | `XIII 筋骨格系` |
| `XIV 腎尿路生殖器系の疾患`                                        | `XIV 腎尿路` |
| `XV 妊娠、分娩および産褥`                                          | `XV 妊娠・分娩` |
| `XVI 周産期に発生した病態`                                        | `XVI 周産期` |
| `XVII 先天奇形、変形および染色体異常`                             | `XVII 先天奇形` |
| `XVIII 症状、徴候および異常臨床所見・異常検査所見で他に分類されないもの` | `XVIII 症状` |
| `XIX 損傷、中毒およびその他の外因の影響`                          | `XIX 損傷・中毒` |
| `XX 傷病および死亡の外因`                                          | `XX 外因` |
| `XXI 健康状態に影響を及ぼす要因および保健サービスの利用`         | `XXI 保健` |
| `XXII 特殊目的用コード`                                            | `XXII 特殊目的` |

Where to use which:

- **Long form** — filter sheets, meta lines, any list item with ≥ 2 lines
  of room. Always paint the long form when it fits.
- **Short form** — compact chip contexts (≤ 1 line, ≤ 80 dp wide). Render
  long form via `aria-label` / `Tooltip` so the abbreviation is recoverable
  to assistive tech.

The short labels are owned by this design system. Keep the table flat and
authoritative.

---

## Disclaimer ribbon — always-on contract

The ribbon is the highest-priority UX requirement in this system.

1. **Placement**: rendered at the app shell layer so it sits on every
   view, **directly above the bottom safe-area inset** (above any bottom
   navigation when present, above the safe-area inset otherwise). It must
   not scroll out of view. While a modal layer is open, the modal route
   may cover the ribbon (modal routes are pushed above the shell child).
   The ribbon resumes visibility as soon as the modal is dismissed.
2. **Height**: 24–28 dp (we ship 26 dp). Non-tappable.
3. **Colors**: light bg `#1A1C1E` / fg `#FFFFFF` / accent `#FFB4AB`;
   dark bg `#0D0E13` / fg `#FFFFFF` / accent `#FFB4AB`.
4. **Text**: single line `· FICTIONAL DATA - NOT FOR MEDICAL USE ·
   架空データ・医療判断には使用不可 ·` (NotoSansJP 700 / 11 px /
   `letter-spacing 0.04em`). The design system no longer ships a short form;
   keep the full l10n copy visible. **Do not marquee or truncate.**
5. **Accessibility**: announce as `label: "免責: 架空データ・医療判断には使用しないでください", liveRegion: false`.
6. **Source of truth**: bind visible text to l10n key `detailDisclaimer`.
   Any `disclaimer` field returned by API endpoints is for **logging /
   audit only** — never display it.
7. **Rule**: implement as an always-mounted overlay component at the shell
   layer, not as a per-screen widget. The component is non-interactive
   (input-blocking) and renders a single text node styled with
   `NotoSansJP 700 / 11 / 0.04em`.

---

## Internal-contradiction fixes

| ID | Fix |
| --- | --- |
| **F1** | Bottom-nav uses **Round6 primary `#007AFF`**. Detail primary `#1F5BB5` is reserved for the Material 3 detail color extension only. |
| **F2** | Toggleable footer "active" tokens are `--d-primary-container` `#D8E2FF` / `--d-on-primary-container` `#001A41`; off-state uses `--d-surface-c` `#EDEEF3`. No more ad-hoc hex. |
| **F4** | Sort values use snake_case + leading minus: `-revised_at`, `brand_name_kana`, `atc_code`, `therapeutic_category_name`, `name_kana`, `icd10_chapter`. |
| **F5** | Bottom-nav uses `selectedIcon` (filled, FILL=1) vs `icon` (outlined, FILL=0). Implementations must declare both states per destination. |

## Font substitution flag

NotoSansJP-Regular and NotoSansJP-Bold are bundled in `fonts/`. Other
weights (300, 500, 900) are not provided; fall back to the OS Japanese
stack defined in `--font-jp`. JetBrains Mono is referenced for the
optional `--font-mono` token but **not bundled** — install via Google
Fonts in production, or accept the OS monospace fallback. **→ flag**:
ask the user to provide a JetBrains Mono OTF/TTF if mono codes need
pixel-perfect rendering.

---

## Index — what's in this folder

```
README.md                    — this file (system overview, fundamentals, contract)
SKILL.md                     — Agent-Skill front-matter + invocation prompt
colors_and_type.css          — design tokens: light + dark + Material 3 detail extension
disclaimer-ribbon.css        — always-on ribbon styles (component-level rule)
fonts/
  NotoSansJP-Regular.otf
  NotoSansJP-Bold.otf
preview/                     — Design System tab cards (~700 px wide)
  colors-app-light.html        Round6 search/shell tokens (light)
  colors-app-dark.html         …dark theme
  colors-detail.html           Material 3 detail color extension
  colors-surfaces.html         surface containers (lowest → highest)
  type-display-title.html      display + title scale specimens
  type-body-meta.html          body / meta / mono specimens
  spacing-scale.html           4 / 8 / 12 / 16 / 20 / 24 / 32 / 40
  radii.html                   xs / s / m / l / xl / 2xl / pill
  elevation.html               card / footer / sheet shadow tokens
  iconography.html             Material Symbols + FILL axis demo
  disclaimer-ribbon.html       ribbon — visual + a11y contract
  chips-drug.html              SSOT-aligned drug chip palettes
  chips-disease.html           SSOT-aligned disease chip palettes
  chips-icd10.html             ICD-10 chapter chips (long + derived short)
  chips-exam-category.html     検査区分 chips
  chips-onset-pattern.html     発症パターン chips
  chips-precaution.html        患者背景 chips
  component-buttons.html       primary / secondary / pill button states
  component-drug-card.html     DrugCard (image + brand + meta)
  component-disease-card.html  DiseaseCard (no image)
  components-uikit.html        live composition of all components
ui_kits/
  flutter_app/
    README.md                  scope contract + component map
    Components.jsx             the component library (single SSOT)
    ios-frame.jsx              spare iOS device-frame primitives
    index.html                 interactive 390 dp phone composition demo
```

For new designs, start by reading **`SKILL.md`**, then **`colors_and_type.css`**
and **`ui_kits/flutter_app/Components.jsx`**. Compose from those primitives —
do not invent new screens, axes, or color tokens.