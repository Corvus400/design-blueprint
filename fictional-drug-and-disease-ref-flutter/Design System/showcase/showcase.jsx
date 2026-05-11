/* eslint-disable */
// Component-composition showcase. NOT a screen — a visual-language
// reference. Each artboard wraps a phone- or tablet-shaped frame and
// renders the design-system primitives in a non-prescriptive layout.
// Domain content is generic / clearly-labeled "sample".

const {
  Icon, Disclaimer, Chip, Hairline, SegControl, SearchField,
  SearchTopChrome, AppliedChipRail, AppliedFilterChip,
  SearchResultToolbar, BottomSheet, FilterFab, FilterSheet,
  DrugCard, DiseaseCard, BottomNav, DetailFooter,
  ThemeCtx,
} = window;

// ---------- generic sample data (clearly non-prescriptive) ----------
const sampleDrug = {
  brandName: 'サンプル製剤 A',
  genericName: '一般名サンプル',
  atcCode: 'C08CA01',
  revisedAt: '2024-08-12',
  regulatoryClass: ['prescription_required', 'potent'],
};
const sampleDisease = {
  name: '疾患名サンプル',
  nameKana: 'しっかんめいさんぷる',
  chronicity: 'chronic',
  infectious: false,
  medicalDepartment: ['cardiology', 'internal_medicine'],
  icd10ChapterRoman: 'IX',
  revisedAt: '2024-09-30',
};

// ---------- showcase primitives ----------
const SectionLabel = ({ children, sub }) => (
  <div style={{
    padding: '14px 16px 6px',
    display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
  }}>
    <span style={{
      font: '700 10px/1 var(--font-jp)',
      letterSpacing: '.10em', textTransform: 'uppercase',
      color: 'var(--muted)',
    }}>{children}</span>
    {sub && (
      <span style={{
        font: '500 10px/1 var(--font-jp)', color: 'var(--muted-2)',
      }}>{sub}</span>
    )}
  </div>
);

const Pad = ({ x = 16, children, style }) => (
  <div style={{ padding: `0 ${x}px`, ...style }}>{children}</div>
);

const Row = ({ children, gap = 6, wrap = true, style }) => (
  <div style={{
    display: 'flex', flexWrap: wrap ? 'wrap' : 'nowrap', gap,
    ...style,
  }}>{children}</div>
);

// Token strip for color preview
const ColorSwatch = ({ name, value, fg }) => (
  <div style={{
    flex: '0 0 auto', borderRadius: 8,
    border: '0.5px solid var(--hairline)',
    overflow: 'hidden',
    width: 96, background: 'var(--surface-2)',
  }}>
    <div style={{
      height: 36, background: value,
    }}></div>
    <div style={{ padding: '6px 8px' }}>
      <div style={{
        font: '600 10px/1.2 var(--font-jp)', color: 'var(--ink)',
      }}>{name}</div>
      <div style={{
        font: '400 9.5px/1.2 var(--font-mono)', color: 'var(--muted)',
        marginTop: 1,
      }}>{value}</div>
    </div>
  </div>
);

const TypeRow = ({ name, font, sample }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', gap: 12,
    padding: '6px 0', borderBottom: '0.5px solid var(--hairline-2)',
  }}>
    <div style={{
      flex: '0 0 56px',
      font: '500 10px/1.2 var(--font-mono)', color: 'var(--muted)',
    }}>{name}</div>
    <div style={{ flex: 1, font, color: 'var(--ink)' }}>{sample}</div>
  </div>
);

// ---------- shared composition body ----------
const Compositions = ({ density = 'phone' }) => {
  const [tab, setTab] = React.useState('drugs');
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState('-revised_at');
  return (
    <>
      {/* SearchTopChrome example — labelled as composite illustration */}
      <SectionLabel sub="composite illustration">SearchTopChrome</SectionLabel>
      <SearchTopChrome
        tab={tab} onTab={setTab}
        query={q} onQuery={setQ} onClear={() => setQ('')} onSubmit={() => {}}
      />

      {/* Applied-chip rail */}
      <SectionLabel sub="primitive">AppliedChipRail</SectionLabel>
      <AppliedChipRail
        chips={['銭剤', '内服', 'IX 循環器系']}
        onRemoveAt={() => {}}
      />

      {/* Toolbar */}
      <SectionLabel sub="primitive">SearchResultToolbar</SectionLabel>
      <SearchResultToolbar count={42} tab={tab} sort={sort} onChangeSort={setSort} />

      {/* Cards */}
      <SectionLabel sub="primitive · sample data">DrugCard / DiseaseCard</SectionLabel>
      <div style={{ padding: '0 16px' }}>
        <DrugCard item={sampleDrug} onTap={() => {}} />
        <DiseaseCard item={sampleDisease} onTap={() => {}} />
      </div>

      {/* Chip vocabulary */}
      <SectionLabel sub="primitive">Chip — palette across SSOT axes</SectionLabel>
      <Pad>
        <Row gap={5} style={{ marginBottom: 6 }}>
          <Chip axis="regulatory_class" value="poison" label="毒薬" />
          <Chip axis="regulatory_class" value="potent" label="劇薬" />
          <Chip axis="regulatory_class" value="narcotic" label="麻薬" />
          <Chip axis="regulatory_class" value="biological" label="生物由来製品" />
          <Chip axis="regulatory_class" value="prescription_required" label="処方箋医薬品" />
        </Row>
        <Row gap={5} style={{ marginBottom: 6 }}>
          <Chip axis="route_of_administration" value="oral" label="内服" />
          <Chip axis="route_of_administration" value="injection_route" label="注射" />
          <Chip axis="route_of_administration" value="inhalation" label="吸入" />
          <Chip axis="route_of_administration" value="ophthalmic" label="点眼" />
          <Chip axis="route_of_administration" value="transdermal" label="貼付" />
        </Row>
        <Row gap={5} style={{ marginBottom: 6 }}>
          <Chip axis="icd10_chapter" value="chapter_i" label="I 感染症" />
          <Chip axis="icd10_chapter" value="chapter_ii" label="II 新生物" />
          <Chip axis="icd10_chapter" value="chapter_ix" label="IX 循環器系" />
          <Chip axis="icd10_chapter" value="chapter_xi" label="XI 消化器系" />
        </Row>
        <Row gap={5}>
          <Chip axis="chronicity" value="acute" label="急性" />
          <Chip axis="chronicity" value="chronic" label="慢性" />
          <Chip axis="infectious" value="true" label="感染性" />
          <Chip axis="infectious" value="false" label="非感染性" />
        </Row>
      </Pad>

      {/* DetailFooter (bookmark + secondary action pattern) */}
      <SectionLabel sub="composite illustration">DetailFooter (bookmark pattern)</SectionLabel>
      <DetailFooter bookmarked={true} onToggleBookmark={() => {}} onDoseCalc={() => {}} />

      <div style={{ height: 20 }}></div>
    </>
  );
};

// ---------- shell wrapping each artboard ----------
const ShellFrame = ({ width, height, theme, label, density = 'phone', children }) => (
  <div className={theme === 'dark' ? 'theme-dark' : ''} style={{
    width, height, position: 'relative', overflow: 'hidden',
    background: 'var(--bg)', borderRadius: 18,
    border: '1px solid var(--hairline)',
  }}>
    <ThemeCtx.Provider value={theme}>
      {/* Brand bar */}
      <div style={{
        height: 56, padding: '12px 16px',
        background: 'var(--surface)',
        borderBottom: '0.5px solid var(--hairline)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
      }}>
        <div>
          <div style={{
            font: '700 14px/1 var(--font-jp)', color: 'var(--ink)',
            letterSpacing: '.02em',
          }}>医薬品・疾患リファレンス</div>
          <div style={{
            marginTop: 4,
            font: '500 10px/1 var(--font-jp)', color: 'var(--muted)',
            letterSpacing: '.04em', textTransform: 'uppercase',
          }}>{label}</div>
        </div>
        <div style={{
          padding: '3px 8px', borderRadius: 4,
          background: 'var(--primary-soft)',
          color: 'var(--d-primary)',
          font: '700 10px/1 var(--font-mono)',
          letterSpacing: '.06em',
        }}>SHOWCASE</div>
      </div>

      {/* Scrollable content */}
      <div style={{
        position: 'absolute', top: 56, left: 0, right: 0, bottom: 80,
        overflowY: 'auto',
      }}>
        {density === 'tablet' ? (
          // Tablet: two-pane to demonstrate the gutter and how primitives
          // compose on a wider canvas. Left pane shows token reference;
          // right pane shows the same primitive composition.
          <div style={{
            display: 'grid', gridTemplateColumns: '320px 1fr',
            gap: 28, padding: 28, paddingBottom: 26 + 16,
            alignItems: 'start',
          }}>
            <TokenReference />
            <div style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--hairline)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <Compositions density="tablet" />
            </div>
          </div>
        ) : (
          <div style={{ paddingBottom: 26 + 16 }}>
            <Compositions density="phone" />
          </div>
        )}
      </div>

      {/* Disclaimer ribbon — above bottom nav per contract */}
      <Disclaimer bottom={80} />

      {/* Bottom nav */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <BottomNav value="search" onChange={() => {}} />
      </div>

      {children}
    </ThemeCtx.Provider>
  </div>
);

// ---------- token reference panel (tablet only) ----------
const TokenReference = () => (
  <div style={{
    background: 'var(--surface)',
    border: '0.5px solid var(--hairline)',
    borderRadius: 12, padding: '16px',
    position: 'sticky', top: 0,
  }}>
    <div style={{
      font: '700 10px/1 var(--font-jp)', letterSpacing: '.10em',
      textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10,
    }}>Tokens</div>

    <div style={{
      font: '600 12px/1 var(--font-jp)', color: 'var(--ink)',
      marginBottom: 8,
    }}>Round6 シェル</div>
    <Row gap={6} style={{ marginBottom: 12 }}>
      <ColorSwatch name="bg" value="var(--bg)" />
      <ColorSwatch name="surface" value="var(--surface)" />
      <ColorSwatch name="primary" value="var(--primary)" />
    </Row>

    <div style={{
      font: '600 12px/1 var(--font-jp)', color: 'var(--ink)',
      marginBottom: 8,
    }}>M3 Detail</div>
    <Row gap={6} style={{ marginBottom: 12 }}>
      <ColorSwatch name="d-primary" value="var(--d-primary)" />
      <ColorSwatch name="d-prim-cont" value="var(--d-primary-container)" />
      <ColorSwatch name="d-error" value="var(--d-error)" />
    </Row>

    <div style={{
      font: '600 12px/1 var(--font-jp)', color: 'var(--ink)',
      marginBottom: 4,
    }}>Type</div>
    <TypeRow name="display-m" font="var(--t-display-m)" sample="検索" />
    <TypeRow name="title-l"   font="var(--t-title-l)"   sample="ブランド名" />
    <TypeRow name="body-m"    font="var(--t-body-m)"    sample="本文サンプル" />
    <TypeRow name="label-m"   font="var(--t-label-m)"   sample="ATC: C08CA01" />
    <TypeRow name="mono-s"    font="var(--t-mono-s)"    sample="--r-m: 10px" />

    <div style={{
      marginTop: 12,
      font: '600 12px/1 var(--font-jp)', color: 'var(--ink)',
      marginBottom: 6,
    }}>Spacing &middot; Radii</div>
    <Row gap={4} style={{ marginBottom: 4 }}>
      {[4, 8, 12, 16, 20, 24, 32].map((v) => (
        <div key={v} style={{
          width: v, height: 16, background: 'var(--d-primary)',
          opacity: 0.7, borderRadius: 2,
        }}></div>
      ))}
    </Row>
    <Row gap={4}>
      {[
        { v: 'r-xs', n: 4 }, { v: 'r-s', n: 8 }, { v: 'r-m', n: 10 },
        { v: 'r-l', n: 12 }, { v: 'r-2xl', n: 22 },
      ].map((r) => (
        <div key={r.v} style={{
          width: 28, height: 28, background: 'var(--d-primary-container)',
          color: 'var(--d-on-primary-container)',
          borderRadius: r.n,
          font: '500 9px/28px var(--font-mono)', textAlign: 'center',
        }}>{r.n}</div>
      ))}
    </Row>
  </div>
);

// ---------- root ----------
const App = () => (
  <DesignCanvas>
    <DCSection
      id="phone"
      title="Phone &middot; 390 dp"
      subtitle="Component composition reference — not a screen. Disclaimer ribbon, bottom nav, and primitives in their natural layout."
    >
      <DCArtboard id="phone-light" label="Light" width={390} height={780}>
        <ShellFrame width={390} height={780} theme="light" label="Phone &middot; Light" />
      </DCArtboard>
      <DCArtboard id="phone-dark" label="Dark" width={390} height={780}>
        <ShellFrame width={390} height={780} theme="dark" label="Phone &middot; Dark" />
      </DCArtboard>
    </DCSection>

    <DCSection
      id="tablet"
      title="Tablet &middot; 834 dp (two-pane)"
      subtitle="Wider canvas: 28 px gutter, token reference rail beside primitive composition."
    >
      <DCArtboard id="tablet-light" label="Light" width={834} height={900}>
        <ShellFrame width={834} height={900} theme="light" label="Tablet &middot; Light" density="tablet" />
      </DCArtboard>
      <DCArtboard id="tablet-dark" label="Dark" width={834} height={900}>
        <ShellFrame width={834} height={900} theme="dark" label="Tablet &middot; Dark" density="tablet" />
      </DCArtboard>
    </DCSection>
  </DesignCanvas>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
