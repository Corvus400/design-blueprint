/* eslint-disable */
// UI kit components — phone form factor, light theme.
// Pixel match against lib/ui/search/* + lib/theme/app_palette.dart.
// See SearchConstants for every magic number.

const { useState } = React;

// Theme context — lets multiple artboards on one page render in different
// themes simultaneously (showcase use). Components that need to switch
// palettes by theme (Chip, Disclaimer) read this; CSS-variable-driven
// styles cascade automatically when an ancestor has class="theme-dark".
const ThemeCtx = React.createContext('light');
const useThemeIsDark = () => React.useContext(ThemeCtx) === 'dark';

// ---------- icons ----------
const Icon = ({ name, size = 24, color, fill = 0, weight = 400 }) => (
  <span className="material-symbols-outlined" style={{
    fontSize: size, color,
    fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
    lineHeight: 1, userSelect: 'none',
  }}>{name}</span>
);

// ---------- Disclaimer ribbon (always-on; rendered on EVERY screen) ----------
// Inserted by MaterialApp.builder so it sits above the bottom-safe-area inset.
// Stays on top of bottom-nav, modal sheets and dialogs. Bind to l10n key
// `detailDisclaimer`. Mock-server `disclaimer` field is for logging only.
// Semantics: 「免責: 架空データ・医療判断には使用しないでください」
const Disclaimer = ({ bottom = 0 }) => {
  const dark = useThemeIsDark();
  return (
  <div role="note" aria-label="免責: 架空データ・医療判断には使用しないでください"
       style={{
    position: 'absolute', left: 0, right: 0, bottom,
    height: 26, zIndex: 100, pointerEvents: 'none', userSelect: 'none',
    background: dark ? '#0D0E13' : '#1A1C1E', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: '0 12px', whiteSpace: 'nowrap',
    font: '700 11px/1 var(--font-jp)', letterSpacing: '.04em',
  }}>
    <span style={{ width: 4, height: 4, background: '#FFB4AB', borderRadius: 99 }}></span>
    <span style={{ color: '#FFB4AB' }}>FICTIONAL DATA - NOT FOR MEDICAL USE</span>
    <span style={{ width: 4, height: 4, background: '#FFB4AB', borderRadius: 99 }}></span>
    <span>架空データ・医療判断には使用不可</span>
    <span style={{ width: 4, height: 4, background: '#FFB4AB', borderRadius: 99 }}></span>
  </div>
  );
};

// ---------- chips (regulatory / disease badge palette) ----------
// Single source of truth — keys mirror SSOT enum values from
// `lib/l10n/app_ja.arb` / mock-server Kotlin KDoc. Do not mutate after
// declaration; every value used by the UI kit must be present in this literal.
const CHIP_FG = {
  regulatory_class: {
    poison: '#D62A2A',
    potent: '#B45309',
    ordinary: '#4B5563',
    psychotropic_1: '#7C3AED',
    psychotropic_2: '#7C3AED',
    psychotropic_3: '#7C3AED',
    narcotic: '#9333EA',
    stimulant_precursor: '#EA580C',
    biological: '#0F766E',
    specified_biological: '#0E7490',
    prescription_required: '#0A6FE8',
  },
  route_of_administration: {
    oral: '#1D4ED8',
    topical: '#0E7490',
    injection_route: '#B91C1C',
    inhalation: '#0891B2',
    rectal: '#A16207',
    ophthalmic: '#6D28D9',
    nasal: '#15803D',
    transdermal: '#BE185D',
  },
  dosage_form: {
    tablet: '#1D4ED8',
    capsule: '#7C3AED',
    powder: '#A16207',
    granule: '#CA8A04',
    liquid: '#0891B2',
    injection_form: '#B91C1C',
    ointment: '#15803D',
    cream: '#0F766E',
    patch: '#BE185D',
    eye_drops: '#3730A3',
    suppository: '#9A3412',
    inhaler: '#0E7490',
    nasal_spray: '#6D28D9',
  },
  precaution_population_category: {
    comorbidity: '#4B5563',
    renal_impairment: '#A16207',
    hepatic_impairment: '#CA8A04',
    reproductive_potential: '#BE185D',
    pregnant: '#9F1239',
    lactating: '#6D28D9',
    pediatric: '#15803D',
    geriatric: '#1D4ED8',
  },
  icd10_chapter: {
    chapter_i: '#B91C1C',
    chapter_ii: '#7C3AED',
    chapter_iii: '#9F1239',
    chapter_iv: '#A16207',
    chapter_v: '#6D28D9',
    chapter_vi: '#3730A3',
    chapter_vii: '#0E7490',
    chapter_viii: '#0891B2',
    chapter_ix: '#B45309',
    chapter_x: '#0A6FE8',
    chapter_xi: '#CA8A04',
    chapter_xii: '#BE185D',
    chapter_xiii: '#4D7C0F',
    chapter_xiv: '#0F766E',
    chapter_xv: '#9333EA',
    chapter_xvi: '#15803D',
    chapter_xvii: '#EA580C',
    chapter_xviii: '#475569',
    chapter_xix: '#7F1D1D',
    chapter_xx: '#9A3412',
    chapter_xxi: '#1D4ED8',
    chapter_xxii: '#374151',
  },
  chronicity: {
    acute: '#C2410C',
    subacute: '#B45309',
    chronic: '#B45309',
    relapsing: '#7C3AED',
  },
  infectious: {
    true: '#D62A2A',
    false: '#0F766E',
  },
  onset_pattern: {
    acute: '#C2410C',
    subacute: '#B45309',
    chronic: '#1D4ED8',
    intermittent: '#0F766E',
    relapsing: '#7C3AED',
  },
  exam_category: {
    blood_test: '#B91C1C',
    imaging: '#1D4ED8',
    physiological: '#0891B2',
    pathology: '#7C3AED',
    interview: '#15803D',
  },
  medical_department: {
    internal_medicine: '#1D4ED8',
    cardiology: '#4D7C0F',
    gastroenterology: '#CA8A04',
    endocrinology: '#0F766E',
    neurology: '#3730A3',
    psychiatry: '#6D28D9',
    surgery: '#B91C1C',
    orthopedics: '#A16207',
    dermatology: '#0E7490',
    ophthalmology: '#BE185D',
    otolaryngology: '#0891B2',
    urology: '#9F1239',
    gynecology: '#EA580C',
    pediatrics: '#15803D',
    emergency: '#7F1D1D',
    infectious_disease: '#9A3412',
  },
};
const CHIP_FG_DARK = {
  regulatory_class: {
    poison: '#FFB4AB',
    potent: '#FFB77C',
    ordinary: '#C5CAD0',
    psychotropic_1: '#D5BAFF',
    psychotropic_2: '#D5BAFF',
    psychotropic_3: '#D5BAFF',
    narcotic: '#E1BDFF',
    stimulant_precursor: '#FFB68B',
    biological: '#5DD5BB',
    specified_biological: '#7DD3FC',
    prescription_required: '#9ECAFF',
  },
  route_of_administration: {
    oral: '#BFD7FF',
    topical: '#7DD3FC',
    injection_route: '#FFB4AB',
    inhalation: '#67E8F9',
    rectal: '#FFC966',
    ophthalmic: '#C9B5FF',
    nasal: '#86E0A4',
    transdermal: '#FFB1C8',
  },
  dosage_form: {
    tablet: '#BFD7FF',
    capsule: '#D5BAFF',
    powder: '#FFC966',
    granule: '#FDE68A',
    liquid: '#67E8F9',
    injection_form: '#FFB4AB',
    ointment: '#86E0A4',
    cream: '#5DD5BB',
    patch: '#FFB1C8',
    eye_drops: '#C7D2FE',
    suppository: '#FDBA74',
    inhaler: '#7DD3FC',
    nasal_spray: '#C9B5FF',
  },
  precaution_population_category: {
    comorbidity: '#C5CAD0',
    renal_impairment: '#FFC966',
    hepatic_impairment: '#FDE68A',
    reproductive_potential: '#FFB1C8',
    pregnant: '#FDA4AF',
    lactating: '#C9B5FF',
    pediatric: '#86E0A4',
    geriatric: '#BFD7FF',
  },
  icd10_chapter: {
    chapter_i: '#FFB4AB',
    chapter_ii: '#D5BAFF',
    chapter_iii: '#FDA4AF',
    chapter_iv: '#FFC966',
    chapter_v: '#C9B5FF',
    chapter_vi: '#C7D2FE',
    chapter_vii: '#7DD3FC',
    chapter_viii: '#67E8F9',
    chapter_ix: '#FFB77C',
    chapter_x: '#9ECAFF',
    chapter_xi: '#FDE68A',
    chapter_xii: '#FFB1C8',
    chapter_xiii: '#BEF264',
    chapter_xiv: '#5DD5BB',
    chapter_xv: '#E1BDFF',
    chapter_xvi: '#86E0A4',
    chapter_xvii: '#FFB68B',
    chapter_xviii: '#CBD5E1',
    chapter_xix: '#FCA5A5',
    chapter_xx: '#FDBA74',
    chapter_xxi: '#BFD7FF',
    chapter_xxii: '#9CA3AF',
  },
  chronicity: {
    acute: '#FB923C',
    subacute: '#FFB77C',
    chronic: '#FFB77C',
    relapsing: '#D5BAFF',
  },
  infectious: {
    true: '#FFB4AB',
    false: '#5DD5BB',
  },
  onset_pattern: {
    acute: '#FB923C',
    subacute: '#FFB77C',
    chronic: '#BFD7FF',
    intermittent: '#5DD5BB',
    relapsing: '#D5BAFF',
  },
  exam_category: {
    blood_test: '#FFB4AB',
    imaging: '#BFD7FF',
    physiological: '#67E8F9',
    pathology: '#D5BAFF',
    interview: '#86E0A4',
  },
  medical_department: {
    internal_medicine: '#BFD7FF',
    cardiology: '#BEF264',
    gastroenterology: '#FDE68A',
    endocrinology: '#5DD5BB',
    neurology: '#C7D2FE',
    psychiatry: '#C9B5FF',
    surgery: '#FFB4AB',
    orthopedics: '#FFC966',
    dermatology: '#7DD3FC',
    ophthalmology: '#FFB1C8',
    otolaryngology: '#67E8F9',
    urology: '#FDA4AF',
    gynecology: '#FFB68B',
    pediatrics: '#86E0A4',
    emergency: '#FCA5A5',
    infectious_disease: '#FDBA74',
  },
};
const AXIS_ALIASES = {
  route_of_administration: 'route',
  precaution_population_category: 'precaution_category',
  medical_department: 'department',
};
const labelFor = (axis, value) => {
  const axisId = AXIS_ALIASES[axis] || axis;
  const axes = [...DRUG_FILTER_AXES, ...DISEASE_FILTER_AXES];
  return axes.find((a) => a.id === axisId)?.vs?.find((v) => v.value === value)?.label || value;
};
const isDarkMode = () =>
  document.documentElement.dataset.theme === 'dark' ||
  document.documentElement.classList.contains('theme-dark') ||
  document.body?.classList.contains('theme-dark');
// Showcase override: prefer context when available so multiple artboards
// can render in different themes on the same page.
const chipPalette = (dark) => (dark ? CHIP_FG_DARK : CHIP_FG);
const baseRgb = (hex) => { const n = parseInt(hex.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; };
const Chip = ({ axis, value, label }) => {
  const dark = useThemeIsDark();
  const palette = chipPalette(dark);
  const fg = palette[axis]?.[value] || (dark ? '#C5CAD0' : '#3F4347');
  const [r,g,b] = baseRgb(fg);
  return (
    <span style={{
      background: `rgba(${r},${g},${b},.05)`, color: fg,
      padding: '2px 7px', borderRadius: 5,
      font: '700 11px/1.5 var(--font-jp)', whiteSpace: 'nowrap',
    }}>{label || labelFor(axis, value)}</span>
  );
};

// ---------- atoms ----------
const Hairline = ({ vertical }) => (
  <div style={vertical
    ? { width: '0.5px', alignSelf: 'stretch', background: 'rgba(60,60,67,.13)' }
    : { height: '0.5px', background: 'rgba(60,60,67,.13)' }} />
);

// _Round6SegmentedControl — outer radius 9, padding 2, palette.surfaceSubtle bg.
// Each segment Expanded with vertical pad 7 (no fixed height); selected uses
// surface bg + soft shadow + onSurface fg; both selected & unselected w600.
const SegControl = ({ value, onChange, options }) => (
  <div style={{
    display: 'flex', background: 'var(--surface-3)', borderRadius: 9,
    padding: 2, width: '100%',
  }}>
    {options.map((o) => {
      const on = o.value === value;
      return (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex: 1, background: on ? '#fff' : 'transparent',
          color: on ? '#1A1C1E' : 'var(--d-on-surface-variant)',
          font: '600 14px/1 var(--font-jp)',
          padding: '7px 12px', border: 'none', borderRadius: 7,
          boxShadow: on ? '0 1px 2px rgba(15,23,42,.06)' : 'none',
          cursor: 'pointer',
        }}>{o.label}</button>
      );
    })}
  </div>
);

// _SearchField — height 40 (phone), radius 12, palette.searchFieldBg.
// Clear button uses Material `cancel` filled icon (per IconButton(Icons.cancel)).
const SearchField = ({ value, onChange, hint, onClear, onSubmit }) => (
  <div style={{
    flex: 1, height: 'var(--field-h-phone)', background: 'var(--search-field-bg)', borderRadius: 12,
    display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
  }}>
    <Icon name="search" size={20} color="#8E9298" />
    <input value={value} placeholder={hint}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSubmit && onSubmit()}
      style={{
        flex: 1, background: 'transparent', border: 'none', outline: 'none',
        font: '400 15px/1.4 var(--font-jp)', color: 'var(--ink)', minWidth: 0,
      }}
    />
    {value && (
      <button onClick={onClear} style={{
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined" style={{
          fontSize: 18, color: '#8E9298',
          fontVariationSettings: "'FILL' 1, 'wght' 400",
        }}>cancel</span>
      </button>
    )}
  </div>
);

// _SearchTopChrome — title 22 w700, gap 8, segmented, gap 10, [field 40dp + button].
// Submit button radius 10 (searchButtonRadius), height matches field (40).
const SearchTopChrome = ({ tab, onTab, query, onQuery, onSubmit, onClear }) => (
  <div style={{
    background: 'var(--surface)', padding: '10px 16px',
    borderBottom: '0.5px solid var(--hairline)',
    display: 'flex', flexDirection: 'column', flex: '0 0 auto',
  }}>
    <div style={{ font: '700 var(--search-title-fs)/1.2 var(--font-jp)', color: 'var(--ink)' }}>検索</div>
    <div style={{ height: 8 }}></div>
    <SegControl value={tab} onChange={onTab} options={[
      { value: 'drugs', label: '医薬品' },
      { value: 'diseases', label: '疾患' },
    ]} />
    <div style={{ height: 10 }}></div>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <SearchField value={query} onChange={onQuery} onClear={onClear} onSubmit={onSubmit}
        hint={tab === 'drugs' ? '医薬品名・YJ・ATC コード' : '疾患名・症状・ICD-10'} />
      <button onClick={onSubmit} style={{
        height: 40, padding: '0 18px', border: 'none', borderRadius: 10,
        background: '#007AFF', color: '#fff',
        font: '700 14px/1 var(--font-jp)', cursor: 'pointer', flex: '0 0 auto',
      }}>検索</button>
    </div>
  </div>
);

// ---------- result cards ----------
// _DrugResultCard — Card margin top:8, radius 10, hairline border.
// Inner padding 12. Image 56×84 (2:3). Spacing column 0/8 (between image+col 12).
// Text rhythm: badges →(4)→ brand →(2)→ generic →(5)→ meta wrap (spacing 12).
// Brand: titleSmall 14sp w700. Generic: bodySmall 12sp onSurfaceVariant.
// Meta: labelSmall 11sp.
const DrugCard = ({ item, onTap }) => (
  <div onClick={onTap} style={{
    background: 'var(--surface)', border: '0.5px solid var(--hairline)',
    borderRadius: 10, padding: 12, marginTop: 8,
    display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer',
  }}>
    <div style={{
      width: 56, height: 84, borderRadius: 8, overflow: 'hidden', flex: '0 0 auto',
      background: 'var(--surface-3)', border: '0.5px solid var(--hairline)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span className="material-symbols-outlined" style={{
        fontSize: 26, color: '#8E9298',
        fontVariationSettings: "'FILL' 0,'wght' 300",
      }}>medication</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 5px' }}>
        {item.regulatoryClass.map((r) => <Chip key={r} axis="regulatory_class" value={r} />)}
      </div>
      <div style={{
        marginTop: 4, font: '700 14px/1.3 var(--font-jp)', color: 'var(--ink)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{item.brandName}</div>
      <div style={{
        marginTop: 2, font: '400 12px/1.3 var(--font-jp)', color: 'var(--d-on-surface-variant)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{item.genericName}</div>
      <div style={{
        marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: '0 12px',
        font: '500 11px/1.4 var(--font-jp)', color: 'var(--d-on-surface-variant)',
      }}>
        <span>ATC: {item.atcCode}</span>
        <span>改訂 {item.revisedAt}</span>
      </div>
    </div>
  </div>
);

// _DiseaseResultCard — same structure, no image, name→nameKana→meta.
const DiseaseCard = ({ item, onTap }) => (
  <div onClick={onTap} style={{
    background: 'var(--surface)', border: '0.5px solid var(--hairline)',
    borderRadius: 10, padding: 12, marginTop: 8, cursor: 'pointer',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 5px' }}>
      <Chip axis="chronicity" value={item.chronicity} />
      <Chip axis="infectious" value={item.infectious ? 'true' : 'false'} label={item.infectious ? '感染性' : '非感染性'} />
      {item.medicalDepartment.map((d) => <Chip key={d} axis="medical_department" value={d} />)}
    </div>
    <div style={{
      marginTop: 4, font: '700 14px/1.3 var(--font-jp)', color: 'var(--ink)',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{item.name}</div>
    <div style={{
      marginTop: 2, font: '400 12px/1.3 var(--font-jp)', color: 'var(--d-on-surface-variant)',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{item.nameKana}</div>
    <div style={{
      marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: '0 12px',
      font: '500 11px/1.4 var(--font-jp)', color: 'var(--d-on-surface-variant)',
    }}>
      <span>ICD-10: {item.icd10ChapterRoman}</span>
      <span>改訂 {item.revisedAt}</span>
    </div>
  </div>
);

// _AppliedFilterChip — pill in primarySoft + primaryRing border + close box.
const AppliedFilterChip = ({ label, onRemove }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 8px 5px 10px', background: 'var(--primary-soft)',
    border: '0.5px solid var(--primary-ring)', borderRadius: 14,
    font: '600 11.5px/1.4 var(--font-jp)', color: 'var(--d-primary)',
    flex: '0 0 auto', cursor: 'pointer',
  }} onClick={onRemove}>
    <span>{label}</span>
    <span style={{
      width: 16, height: 16, borderRadius: 8, background: 'rgba(0,122,255,.18)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span className="material-symbols-outlined" style={{
        fontSize: 10, color: 'var(--d-primary)',
        fontVariationSettings: "'FILL' 0,'wght' 600",
      }}>close</span>
    </span>
  </div>
);

// Inline applied-chip rail above the result toolbar — NEW, was missing.
// height 48, surface bg, top hairline, horizontally scrollable, "適用中" label.
const AppliedChipRail = ({ chips, onRemoveAt }) => {
  if (!chips || chips.length === 0) return null;
  return (
    <div style={{
      height: 48, background: 'var(--surface)',
      borderTop: '0.5px solid var(--hairline)',
      flex: '0 0 auto', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px 10px', height: '100%',
        overflowX: 'auto', whiteSpace: 'nowrap',
      }}>
        <span style={{
          font: '700 11px/1 var(--font-jp)', color: '#6C7177',
          letterSpacing: '.05em', flex: '0 0 auto', marginRight: 2,
        }}>適用中</span>
        {chips.map((c, i) => (
          <AppliedFilterChip key={i} label={c} onRemove={() => onRemoveAt(i)} />
        ))}
      </div>
    </div>
  );
};

// _SearchResultToolbar — height 36, palette.background bg (transparent here so
// scaffold bg shows through), "合計 N 件" left + sort button right-aligned.
// F4 — OpenAPI sort strings (snake_case, leading minus = desc).
const DRUG_SORTS = [
  { v: '-revised_at',               label: '更新日(新しい順)', dir: '↓' },
  { v: 'brand_name_kana',           label: 'ブランド名カナ',     dir: '↑' },
  { v: 'atc_code',                  label: 'ATC コード',         dir: '↑' },
  { v: 'therapeutic_category_name', label: '薬効分類名',         dir: '↑' },
];
const DISEASE_SORTS = [
  { v: '-revised_at',  label: '改訂日', dir: '↓' },
  { v: 'name_kana',    label: '名称',   dir: '↑' },
  { v: 'icd10_chapter',label: 'ICD-10', dir: '↑' },
];

const BottomSheet = ({ open, title, onClose, children }) => (
  <>
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: 'rgba(0,0,0,.32)',
      opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
      transition: 'opacity .22s ease',
    }}></div>
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41,
      background: 'var(--surface)', borderRadius: '20px 20px 0 0', paddingBottom: 20,
      boxShadow: '0 -8px 24px rgba(15,23,42,.18)',
      transform: open ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform .26s cubic-bezier(.32,.72,0,1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
        <div style={{ width: 40, height: 4, background: 'var(--d-outline-variant)', borderRadius: 2 }}></div>
      </div>
      <div style={{
        padding: '8px 16px 12px', textAlign: 'center',
        borderBottom: '0.5px solid var(--hairline)',
        font: '700 16px/1.2 var(--font-jp)', color: 'var(--ink)',
      }}>{title}</div>
      {children}
    </div>
  </>
);

const SearchResultToolbar = ({ count, tab, sort, onChangeSort }) => {
  const [open, setOpen] = useState(false);
  const opts = tab === 'drugs' ? DRUG_SORTS : DISEASE_SORTS;
  const cur = opts.find((o) => o.v === sort) || opts[0];
  return (
    <>
      <div style={{
        height: 36, padding: '0 16px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        background: 'transparent', flex: '0 0 auto',
      }}>
        <span style={{ font: '500 12.5px/1 var(--font-jp)', color: 'var(--ink)' }}>
          合計 {count} 件
        </span>
        <button onClick={() => setOpen(true)} style={{
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
          font: '500 12.5px/1 var(--font-jp)', color: 'var(--d-primary)',
        }}>
          並び替え： {cur.label} {cur.dir} ▾
        </button>
      </div>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="並び替え">
        {opts.map((o, i) => {
          const on = o.v === sort;
          return (
            <button key={o.v} onClick={() => { onChangeSort(o.v); setOpen(false); }} style={{
              width: '100%', padding: '14px 18px', textAlign: 'left',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: i < opts.length - 1 ? '0.5px solid rgba(60,60,67,.10)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              font: `${on ? 700 : 500} 14px/1.2 var(--font-jp)`,
              color: on ? 'var(--d-primary)' : '#1A1C1E',
            }}>
              <span>{o.label}</span>
              {on && <span className="material-symbols-outlined" style={{
                fontSize: 16, color: 'var(--d-primary)',
              }}>check</span>}
            </button>
          );
        })}
      </BottomSheet>
    </>
  );
};

// FilterFab — radius 18 (searchFilterFabRadius), bottom 28 / right 20 inset
// per searchFilterFab{Bottom,Right}Offset, badge "+N" with palette.background
// ring. The Disclaimer ribbon (26 dp) sits below the bottom-nav and never
// occludes the FAB; the FAB clears the bottom-nav (80 dp) at bottom: 28.
const FilterFab = ({ count = 0, onTap }) => (
  <div style={{ position: 'absolute', right: 20, bottom: 28, zIndex: 20 }}>
    <button onClick={onTap} style={{
      width: 56, height: 56, borderRadius: 18, border: 'none',
      background: 'var(--d-primary)', color: '#fff', cursor: 'pointer',
      boxShadow: '0 6px 16px rgba(31,91,181,.32)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name="tune" size={26} color="#fff" />
    </button>
    {count > 0 && (
      <span style={{
        position: 'absolute', top: -2, right: 0,
        height: 22, minWidth: 24, padding: '0 7px', borderRadius: 11,
        background: 'var(--d-error)', color: '#fff',
        font: '700 11px/22px var(--font-jp)',
        textAlign: 'center', boxShadow: '0 0 0 2px #F2F2F7',
      }}>+{count}</span>
    )}
  </div>
);

// =============================================================================
// FilterSheet — accordion bottom sheet (one axis expanded at a time).
// Mirrors `lib/ui/search/widgets/filter/{drug,disease}_filter_sheet.dart`.
//
// Axes are declared in the EXACT order Flutter declares them, with the same
// `id`s. Each `vs` entry is a `{ value, label }` pair where `value` mirrors
// the wire enum (KDoc / Kotlin) and `label` mirrors `app_ja.arb`. The renderer
// dispatches onAddSample(value) and displays label.
//
// Axis-kind discriminators:
//   • undefined / 'chips' → multi-select chip group (default)
//   • 'chipsSingle'       → single-select chip group (toggle replaces)
//   • 'text'              → single-line text input (partial-match keyword)
//   • 'bool'              → 2 chips, single-select bool (true/false/null)
//
// Drug    — 7 axes — default expanded: regulatory_class
// Disease — 9 axes — default expanded: icd10_chapter
//
// ATC values are a representative subset of the SSOT (Flutter loads the full
// list from /categories at runtime); do not invent new ATC codes.
// =============================================================================
const DRUG_FILTER_AXES = [
  { id: 'regulatory_class', t: '規制区分', kind: 'chips', vs: [
    { value: 'poison', label: '毒薬' },
    { value: 'potent', label: '劇薬' },
    { value: 'ordinary', label: '普通薬' },
    { value: 'psychotropic_1', label: '向精神薬第1種' },
    { value: 'psychotropic_2', label: '向精神薬第2種' },
    { value: 'psychotropic_3', label: '向精神薬第3種' },
    { value: 'narcotic', label: '麻薬' },
    { value: 'stimulant_precursor', label: '覚醒剤原料' },
    { value: 'biological', label: '生物由来製品' },
    { value: 'specified_biological', label: '特定生物由来製品' },
    { value: 'prescription_required', label: '処方箋医薬品' },
  ] },
  { id: 'dosage_form', t: '剤形', kind: 'chips', vs: [
    { value: 'tablet', label: '錠剤' },
    { value: 'capsule', label: 'カプセル' },
    { value: 'powder', label: '散剤' },
    { value: 'granule', label: '顆粒' },
    { value: 'liquid', label: '液剤' },
    { value: 'injection_form', label: '注射剤' },
    { value: 'ointment', label: '軟膏' },
    { value: 'cream', label: 'クリーム' },
    { value: 'patch', label: '貼付剤' },
    { value: 'eye_drops', label: '点眼液' },
    { value: 'suppository', label: '坐剤' },
    { value: 'inhaler', label: '吸入剤' },
    { value: 'nasal_spray', label: '点鼻液' },
  ] },
  { id: 'route', t: '投与経路', kind: 'chips', vs: [
    { value: 'oral', label: '内服' },
    { value: 'topical', label: '外用' },
    { value: 'injection_route', label: '注射' },
    { value: 'inhalation', label: '吸入' },
    { value: 'rectal', label: '坐剤' },
    { value: 'ophthalmic', label: '点眼' },
    { value: 'nasal', label: '点鼻' },
    { value: 'transdermal', label: '貼付' },
  ] },
  { id: 'atc', t: 'ATC 第 1 階層', kind: 'chipsSingle', vs: [
    { value: 'A', label: 'A — 消化器系および代謝' },
    { value: 'B', label: 'B — 血液および造血器' },
    { value: 'C', label: 'C — 循環器系' },
    { value: 'D', label: 'D — 皮膚科用' },
    { value: 'G', label: 'G — 泌尿生殖器系およびホルモン製剤' },
    { value: 'H', label: 'H — 全身性ホルモン製剤' },
    { value: 'J', label: 'J — 感染症治療薬' },
    { value: 'L', label: 'L — 抗腫瘍剤および免疫調節剤' },
    { value: 'M', label: 'M — 筋骨格系' },
    { value: 'N', label: 'N — 神経系' },
    { value: 'P', label: 'P — 抗寄生虫剤' },
    { value: 'R', label: 'R — 呼吸器系' },
    { value: 'S', label: 'S — 感覚器' },
    { value: 'V', label: 'V — その他' },
  ] },
  { id: 'therapeutic_category', t: '薬効分類', kind: 'chipsSingle', hint: '階層選択', vs: [
    { value: 'alimentary_metabolism', label: '消化器系および代謝' },
    { value: 'blood', label: '血液および造血器' },
    { value: 'cardiovascular', label: '循環器系' },
    { value: 'dermatologicals', label: '皮膚科用' },
    { value: 'genito_urinary_hormones', label: '泌尿生殖器系およびホルモン製剤' },
    { value: 'systemic_hormones', label: '全身性ホルモン製剤' },
    { value: 'antiinfectives', label: '感染症治療薬' },
    { value: 'antineoplastic_immunomodulators', label: '抗腫瘍剤および免疫調節剤' },
    { value: 'musculo_skeletal', label: '筋骨格系' },
    { value: 'nervous', label: '神経系' },
    { value: 'antiparasitic', label: '抗寄生虫剤' },
    { value: 'respiratory', label: '呼吸器系' },
    { value: 'sensory', label: '感覚器' },
    { value: 'various', label: 'その他' },
  ] },
  { id: 'adverse_reaction', t: '副作用キーワード', kind: 'text', placeholder: '副作用キーワードを入力', hint: '部分一致' },
  { id: 'precaution_category', t: '患者背景', kind: 'chips', vs: [
    { value: 'comorbidity', label: '合併症' },
    { value: 'renal_impairment', label: '腎機能障害' },
    { value: 'hepatic_impairment', label: '肝機能障害' },
    { value: 'reproductive_potential', label: '生殖能有する患者' },
    { value: 'pregnant', label: '妊婦' },
    { value: 'lactating', label: '授乳婦' },
    { value: 'pediatric', label: '小児等' },
    { value: 'geriatric', label: '高齢者' },
  ] },
];

const DISEASE_FILTER_AXES = [
  { id: 'icd10_chapter', t: 'ICD-10 章', kind: 'chips', vs: [
    { value: 'chapter_i', label: 'I 感染症および寄生虫症' },
    { value: 'chapter_ii', label: 'II 新生物' },
    { value: 'chapter_iii', label: 'III 血液および造血器の疾患ならびに免疫機構の障害' },
    { value: 'chapter_iv', label: 'IV 内分泌、栄養および代謝疾患' },
    { value: 'chapter_v', label: 'V 精神および行動の障害' },
    { value: 'chapter_vi', label: 'VI 神経系の疾患' },
    { value: 'chapter_vii', label: 'VII 眼および付属器の疾患' },
    { value: 'chapter_viii', label: 'VIII 耳および乳様突起の疾患' },
    { value: 'chapter_ix', label: 'IX 循環器系の疾患' },
    { value: 'chapter_x', label: 'X 呼吸器系の疾患' },
    { value: 'chapter_xi', label: 'XI 消化器系の疾患' },
    { value: 'chapter_xii', label: 'XII 皮膚および皮下組織の疾患' },
    { value: 'chapter_xiii', label: 'XIII 筋骨格系および結合組織の疾患' },
    { value: 'chapter_xiv', label: 'XIV 腎尿路生殖器系の疾患' },
    { value: 'chapter_xv', label: 'XV 妊娠、分娩および産褥' },
    { value: 'chapter_xvi', label: 'XVI 周産期に発生した病態' },
    { value: 'chapter_xvii', label: 'XVII 先天奇形、変形および染色体異常' },
    { value: 'chapter_xviii', label: 'XVIII 症状、徴候および異常臨床所見・異常検査所見で他に分類されないもの' },
    { value: 'chapter_xix', label: 'XIX 損傷、中毒およびその他の外因の影響' },
    { value: 'chapter_xx', label: 'XX 傷病および死亡の外因' },
    { value: 'chapter_xxi', label: 'XXI 健康状態に影響を及ぼす要因および保健サービスの利用' },
    { value: 'chapter_xxii', label: 'XXII 特殊目的用コード' },
  ] },
  { id: 'department', t: '診療科', kind: 'chips', vs: [
    { value: 'internal_medicine', label: '内科' },
    { value: 'cardiology', label: '循環器内科' },
    { value: 'gastroenterology', label: '消化器内科' },
    { value: 'endocrinology', label: '内分泌代謝科' },
    { value: 'neurology', label: '神経内科' },
    { value: 'psychiatry', label: '精神科' },
    { value: 'surgery', label: '外科' },
    { value: 'orthopedics', label: '整形外科' },
    { value: 'dermatology', label: '皮膚科' },
    { value: 'ophthalmology', label: '眼科' },
    { value: 'otolaryngology', label: '耳鼻咽喉科' },
    { value: 'urology', label: '泌尿器科' },
    { value: 'gynecology', label: '婦人科' },
    { value: 'pediatrics', label: '小児科' },
    { value: 'emergency', label: '救急科' },
    { value: 'infectious_disease', label: '感染症科' },
  ] },
  { id: 'chronicity', t: '慢性度', kind: 'chipsSingle', vs: [
    { value: 'acute', label: '急性' },
    { value: 'subacute', label: '亜急性' },
    { value: 'chronic', label: '慢性' },
    { value: 'relapsing', label: '再発性' },
  ] },
  { id: 'infectious', t: '感染性', kind: 'bool', vs: [
    { value: 'true', label: '感染性' },
    { value: 'false', label: '非感染性' },
  ] },
  { id: 'symptom_keyword', t: '症状キーワード', kind: 'text', placeholder: '症状キーワードを入力', hint: '部分一致' },
  { id: 'onset_pattern', t: '発症パターン', kind: 'chips', vs: [
    { value: 'acute', label: '急性発症' },
    { value: 'subacute', label: '亜急性発症' },
    { value: 'chronic', label: '慢性経過' },
    { value: 'intermittent', label: '間欠性' },
    { value: 'relapsing', label: '再発性' },
  ] },
  { id: 'exam_category', t: '検査区分', kind: 'chips', vs: [
    { value: 'blood_test', label: '血液検査' },
    { value: 'imaging', label: '画像検査' },
    { value: 'physiological', label: '生理検査' },
    { value: 'pathology', label: '病理検査' },
    { value: 'interview', label: '問診' },
  ] },
  { id: 'has_pharmacological_treatment', t: '薬物治療あり', kind: 'bool', vs: [
    { value: 'true', label: 'あり' },
    { value: 'false', label: 'なし' },
  ] },
  { id: 'has_severity_grading', t: '重症度評価あり', kind: 'bool', vs: [
    { value: 'true', label: 'あり' },
    { value: 'false', label: 'なし' },
  ] },
];

const FilterSheet = ({ open, onClose, tab, applied, onClearAll, onAddSample }) => {
  const axes = tab === 'drugs' ? DRUG_FILTER_AXES : DISEASE_FILTER_AXES;
  const defaultExpanded = tab === 'drugs' ? 'regulatory_class' : 'icd10_chapter';
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <BottomSheet open={open} onClose={onClose} title={tab === 'drugs' ? '医薬品の絞り込み' : '疾患の絞り込み'}>
      <div style={{ maxHeight: 460, overflowY: 'auto' }}>
        {axes.map((g, idx) => {
          const on = expanded === g.id;
          const last = idx === axes.length - 1;
          const labels = (g.vs || []).map((v) => v.label);
          const appliedCount = (applied || []).filter((c) => labels.includes(c)).length;
          const totalLabel = g.kind === 'text' ? '部分一致' : g.kind === 'bool' ? 'bool' : `${labels.length}`;
          return (
            <div key={g.id} style={{ borderBottom: last ? 'none' : '0.5px solid rgba(60,60,67,.10)' }}>
              <button onClick={() => setExpanded(on ? null : g.id)} style={{
                width: '100%', padding: '14px 16px', textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ font: '700 14px/1.2 var(--font-jp)', color: 'var(--ink)' }}>{g.t}</span>
                  <span style={{ font: '500 12px/1 var(--font-jp)', color: '#6C7177' }}>
                    {appliedCount > 0 ? `${appliedCount} / ${labels.length}` : totalLabel}
                  </span>
                </span>
                <Icon name={on ? 'expand_less' : 'expand_more'} size={20} color="var(--d-on-surface-variant)" />
              </button>
              {on && g.kind === 'text' && (
                <div style={{ padding: '0 16px 14px' }}>
                  <input
                    type="text"
                    placeholder={g.placeholder}
                    style={{
                      width: '100%', height: 44, boxSizing: 'border-box',
                      padding: '0 12px',
                      borderRadius: 8, border: '1px solid var(--d-outline-variant)',
                      background: 'var(--d-surface)',
                      font: '400 14px/1.2 var(--font-jp)', color: 'var(--d-on-surface)',
                      outline: 'none',
                    }}
                  />
                  <div style={{
                    marginTop: 6, font: '400 11px/1.4 var(--font-jp)', color: '#6C7177',
                  }}>{g.hint}</div>
                </div>
              )}
              {on && g.kind !== 'text' && (
                <div style={{ padding: '0 16px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {g.vs.map((v) => {
                    const sel = (applied || []).includes(v.label);
                    return (
                      <button key={v.value} onClick={() => onAddSample(v.label)} style={{
                        background: sel ? 'rgba(31,91,181,.10)' : 'var(--d-surface-c-low)',
                        border: `0.5px solid ${sel ? 'var(--d-primary)' : 'var(--d-outline-variant)'}`,
                        borderRadius: 14, padding: '5px 12px', cursor: 'pointer',
                        font: `${sel ? 700 : 500} 12px/1.4 var(--font-jp)`,
                        color: sel ? 'var(--d-primary)' : '#1A1C1E',
                        maxWidth: '100%', whiteSpace: 'normal', textAlign: 'left',
                      }}>{v.label}</button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{
        padding: '12px 16px 0', borderTop: '0.5px solid var(--hairline)',
        display: 'flex', gap: 10,
      }}>
        <button onClick={onClearAll} style={{
          flex: 1, height: 44, border: '1px solid var(--d-outline-variant)', background: 'var(--surface)',
          borderRadius: 22, font: '600 14px/1 var(--font-jp)', color: 'var(--ink)', cursor: 'pointer',
        }}>リセット</button>
        <button onClick={onClose} style={{
          flex: 1, height: 44, border: 'none', background: 'var(--d-primary)',
          borderRadius: 22, font: '700 14px/1 var(--font-jp)', color: '#fff', cursor: 'pointer',
        }}>結果を見る</button>
      </div>
    </BottomSheet>
  );
};

// ---------- bottom navigation ----------
// F1 — unified on Round6 primary #007AFF (matches Flutter seed in
// lib/theme/app_theme.dart:9). Detail primary var(--d-primary) is reserved for the
// detail-screen tab indicator only.
// F5 — selectedIcon (filled) vs icon (outlined) is encoded via
// fontVariationSettings 'FILL'. Production note: Flutter
// lib/ui/shell/app_shell.dart:28-45 declares a single Icon per destination —
// implementation must add `selectedIcon` for parity with this design.
const BottomNav = ({ value, onChange }) => {
  // The design system uses Material Symbols Outlined as the base font (per
  // README §Iconography); outlined ↔ filled is encoded by toggling FILL=0/1
  // via fontVariationSettings on the SAME base ligature. The base names below
  // (`home` / `search` / `collections_bookmark` / `more_horiz`) all exist as
  // Material Symbols ligatures.
  //
  // Production note (per F5): Flutter Material's separate two-tone icons
  // require declaring an outlined variant for `icon` and a filled variant for
  // `selectedIcon` per destination. The web mirror sidesteps this split by
  // leaning on Material Symbols' FILL axis, so ONE name renders both states.
  const dests = [
    { key: 'home',    label: 'Home',    icon: 'home' },
    { key: 'search',  label: 'Search',  icon: 'search' },
    { key: 'library', label: 'Library', icon: 'collections_bookmark' },
    { key: 'more',    label: 'More',    icon: 'more_horiz' },
  ];
  return (
    <nav style={{
      display: 'flex', height: 80, background: 'var(--surface)',
      borderTop: '0.5px solid var(--hairline)', flex: '0 0 auto',
    }}>
      {dests.map((d) => {
        const on = value === d.key;
        return (
          <button key={d.key} onClick={() => onChange(d.key)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 4, background: 'transparent', border: 'none', cursor: 'pointer',
            color: on ? '#1A1C1E' : 'var(--d-on-surface-variant)',
            font: '600 12px/1.2 var(--font-jp)', paddingTop: 12,
          }}>
            <div style={{
              width: 64, height: 32, borderRadius: 16,
              background: on ? 'rgba(0,122,255,.12)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={d.icon} size={24}
                    fill={on ? 1 : 0} weight={on ? 500 : 400}
                    color={on ? '#007AFF' : 'var(--d-on-surface-variant)'} />
            </div>
            <span>{d.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// DetailFooter — bookmark + optional secondary-action footer. Height 64,
// surfaceContainerLowest bg, top hairline + soft top shadow. Bookmark
// expanded → height 44 r22, primaryContainer when on. Trailing
// secondary-action button (controlled by `showDoseCalc` prop, kept for
// interface compatibility) — primary fill, height 44 r22.
const DetailFooter = ({ bookmarked, onToggleBookmark, onDoseCalc, showDoseCalc = true }) => (
  <div style={{
    background: 'var(--surface)', flex: '0 0 auto', height: 64,
    borderTop: '0.5px solid var(--d-outline-variant)',
    boxShadow: '0 -4px 12px rgba(15,23,42,.06)',
    padding: '0 16px',
    display: 'flex', alignItems: 'center', gap: 12,
  }}>
    <button onClick={onToggleBookmark} style={{
      flex: 1, height: 44, border: 'none', borderRadius: 22, cursor: 'pointer',
      background: bookmarked ? 'var(--d-primary-container)' : 'var(--d-surface-c)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '0 16px',
    }}>
      <Icon name={bookmarked ? 'bookmark' : 'bookmark_border'} size={18}
            fill={bookmarked ? 1 : 0} weight={500}
            color={bookmarked ? 'var(--d-on-primary-container)' : 'var(--d-on-surface)'} />
      <span style={{
        font: '600 14px/1 var(--font-jp)',
        color: bookmarked ? 'var(--d-on-primary-container)' : 'var(--d-on-surface)',
      }}>{bookmarked ? 'Saved' : 'Save'}</span>
    </button>
    {showDoseCalc && (
      <button onClick={onDoseCalc} style={{
        height: 44, border: 'none', borderRadius: 22,
        padding: '0 16px', background: 'var(--d-primary)', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <Icon name="add" size={18} color="#fff" weight={500} />
        <span style={{ font: '600 14px/1 var(--font-jp)', color: '#fff' }}>Action</span>
      </button>
    )}
  </div>
);

// ---------- export ----------
// CHIP_FG is the single declarative source — no post-hoc Object.assign or
// delete; every SSOT key is present in the literal above.
Object.assign(window, {
  Icon, Disclaimer, Chip, Hairline, SegControl, SearchField,
  SearchTopChrome, AppliedChipRail, AppliedFilterChip,
  SearchResultToolbar, BottomSheet, FilterFab, FilterSheet,
  DRUG_FILTER_AXES, DISEASE_FILTER_AXES, CHIP_FG, CHIP_FG_DARK, labelFor,
  DrugCard, DiseaseCard, BottomNav, DetailFooter,
  ThemeCtx,
});
