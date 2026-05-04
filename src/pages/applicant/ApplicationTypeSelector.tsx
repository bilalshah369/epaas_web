// Mirrors ApplicationTypeSelector from mock (App.jsx L10806).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';

interface AppType {
  key:        string;
  icon:       string;
  code:       string;
  label:      string;
  desc:       string;
  examples:   string;
  fee:        string;
  duration:   string;
  color:      string;
  lightColor: string;
}

const APP_TYPES: AppType[] = [
  {
    key:        'nsf',
    icon:       '🧪',
    code:       'NSF',
    label:      'New Standard Food (NSF)',
    desc:       'For food products or ingredients not covered under existing FSSAI standards. Requires full dossier, safety review and Expert Committee evaluation.',
    examples:   'Novel ingredients, fortified foods, new food formats',
    fee:        '₹50,000 + GST',
    duration:   '90–120 days',
    color:      '#1565C0',
    lightColor: '#E3F2FD',
  },
  {
    key:        'ca',
    icon:       '✅',
    code:       'CA',
    label:      'Claim Approval (CA)',
    desc:       'For nutrition, health, and product-specific claims on food labels. Requires scientific substantiation and evidence mapping.',
    examples:   'High protein, low sugar, heart-healthy, immunity booster',
    fee:        '₹50,000 + GST',
    duration:   '60–90 days',
    color:      '#2E7D32',
    lightColor: '#E8F5E9',
  },
  {
    key:        'aa',
    icon:       '🌿',
    code:       'AA',
    label:      'Ayurveda Aahara (AA)',
    desc:       'For food products based on Ayurvedic principles and traditional Indian medicine. Includes ingredient and label scrutiny under AYUSH guidelines.',
    examples:   'Ashwagandha extracts, herbal blends, traditional formulations',
    fee:        '₹50,000 + GST',
    duration:   '60–90 days',
    color:      '#6A1E55',
    lightColor: '#F3E5F5',
  },
  {
    key:        'other',
    icon:       '📄',
    code:       'AnyOther',
    label:      'Any Other',
    desc:       'For approval requests that do not fall under the above categories. Assessed on a case-by-case basis by the Technical Officer.',
    examples:   'Special formulations, miscellaneous food products',
    fee:        '₹10,000 + GST',
    duration:   '30–45 days',
    color:      '#546E7A',
    lightColor: '#ECEFF1',
  },
];

export default function ApplicationTypeSelector() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedType = APP_TYPES.find((t) => t.key === selected);

  function proceed() {
    if (selected) navigate(`/app/apply/form?type=${selectedType?.code}`);
  }

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20, paddingLeft: 12, borderLeft: `4px solid ${COLORS.primary}` }}>
        <div style={S.roleLabel}>NEW APPLICATION</div>
        <div style={S.pageTitle}>Select Application Category</div>
        <div style={S.pageDesc}>
          Choose the type of approval you are applying for. Each type has specific requirements, timelines and fee structures.
        </div>
      </div>

      {/* ── Type cards ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {APP_TYPES.map((t) => {
          const isSelected = selected === t.key;
          return (
            <div
              key={t.key}
              onClick={() => setSelected(t.key)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = t.color;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 10px ${t.color}18`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = COLORS.border;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }
              }}
              style={{
                background:     COLORS.white,
                border:         `2px solid ${isSelected ? t.color : COLORS.border}`,
                borderRadius:   10,
                padding:        '20px 16px 16px',
                cursor:         'pointer',
                transition:     'border-color 0.15s, box-shadow 0.15s',
                display:        'flex',
                flexDirection:  'column',
                gap:            10,
                boxShadow:      isSelected ? `0 4px 16px ${t.color}28` : 'none',
                position:       'relative',
              }}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
                  ✓
                </div>
              )}

              {/* Icon */}
              <div style={{ width: 44, height: 44, borderRadius: 10, background: t.lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {t.icon}
              </div>

              {/* Label + description */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text, marginBottom: 5 }}>
                  {t.label}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
                  {t.desc}
                </div>
              </div>

              {/* Examples */}
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic', lineHeight: 1.5 }}>
                e.g. {t.examples}
              </div>

              {/* Fee + duration */}
              <div style={{ marginTop: 'auto', borderTop: `1px solid ${COLORS.border}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: COLORS.textMuted }}>
                <span><strong style={{ color: COLORS.text }}>{t.fee}</strong></span>
                <span>{t.duration}</span>
              </div>

              {/* Continue button */}
              <button
                onClick={(e) => { e.stopPropagation(); setSelected(t.key); navigate(`/app/apply/form?type=${t.code}`); }}
                style={{
                  background:    isSelected ? COLORS.primary : 'transparent',
                  color:         isSelected ? '#fff' : COLORS.primary,
                  border:        `1.5px solid ${COLORS.primary}`,
                  borderRadius:  6,
                  padding:       '7px 0',
                  width:         '100%',
                  fontSize:      12,
                  fontWeight:    600,
                  cursor:        'pointer',
                  textAlign:     'center',
                }}
              >
                Continue →
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Selection summary bar ─────────────────────────────────────── */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div>
          {selectedType ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: selectedType.lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {selectedType.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{selectedType.label}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>
                  Fee: <strong>{selectedType.fee}</strong> &nbsp;·&nbsp; Timeline: <strong>{selectedType.duration}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>← Select an application type above to continue</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/app/dashboard')}
            style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={proceed}
            disabled={!selected}
            style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed', opacity: selected ? 1 : 0.45 }}
          >
            Proceed to Application →
          </button>
        </div>
      </div>
    </div>
  );
}
