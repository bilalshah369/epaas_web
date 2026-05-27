import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';

interface AppType {
  key:        string;
  code:       string;
  label:      string;
  desc:       string;
  fee:        string;
  color:      string;
  lightColor: string;
}

const APP_TYPES: AppType[] = [
  {
    key:        'nsf',
    code:       'NSF',
    label:      'Non-Specified/Novel Food & Food Ingredients (NSF & FI)',
    desc:       'For approval of food products or ingredients covered under the Food Safety and Standards (Approval for Non-Specific Food and Food Ingredients) Regulation, 2017. Requires full dossier, safety and efficacy data and Expert Committee evaluation.',
    fee:        '₹50,000 + GST',
    color:      '#1565C0',
    lightColor: '#E3F2FD',
  },
  {
    key:        'ca',
    code:       'CA',
    label:      'Claim Approval (CA)',
    desc:       'For approval of claims under the Food Safety and Standards (Advertising and Claims) Regulation, 2018. Requires scientific substantiation and evidence mapping.',
    fee:        '₹50,000 + GST',
    color:      '#7EC8E8',
    lightColor: '#EDF8FD',
  },
  {
    key:        'aa',
    code:       'AA',
    label:      'Ayurveda Aahara (AA)',
    desc:       'For approval of Ayurveda Aahara as per the Food Safety and Standards (Ayurveda Aahara) Regulations, 2022.',
    fee:        '₹7,500–₹50,000 + GST',
    color:      '#6A1B5D',
    lightColor: '#F8EEF5',
  },
  {
    key:        'other',
    code:       'AnyOther',
    label:      'Any Other',
    desc:       'For approval of FSMP, notification of esters/derivatives/salts of vitamins, salts/chelates of minerals, and esters/derivatives/isomers/salts of amino acids and approval of any other food, product, process, or system for which prior approval is required by the Food Authority under the provisions of the FSS Act, 2006, and regulations made thereunder, or as notified from time to time.',
    fee:        'No Fee',
    color:      '#607D8B',
    lightColor: '#EFF4F6',
  },
  {
    key:        'rpet',
    code:       'RPET',
    label:      'Recycled PET Packaging (rPET)',
    desc:       'For authorization of recycle plastic manufacturers as per the Food Safety and Standards (Packaging) Regulation, 2018',
    fee:        '₹2,000 + GST',
    color:      '#EF6C00',
    lightColor: '#FFF4E8',
  },
  {
    key:        'vegan',
    code:       'Vegan',
    label:      'Vegan',
    desc:       'For the endorsement of Vegan logo as per the Food Safety and Standards (Vegan Foods) Regulations, 2022',
    fee:        '₹10,000 + GST',
    color:      '#2E7D32',
    lightColor: '#E8F5E9',
  },
];

function getFormPath(code: string): string {
  if (code === 'NSF')  return `/app/apply/nsf-form?type=NSF`;
  if (code === 'CA')   return `/app/apply/ca-form?type=CA`;
  if (code === 'AA')   return `/app/apply/aa-form?type=AA`;
  if (code === 'RPET')  return `/app/apply/rpet-form?type=RPET`;
  if (code === 'Vegan') return `/app/apply/vegan-form?type=Vegan`;
  return `/app/apply/form?type=${code}`;
}

export default function ApplicationTypeSelector() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedType = APP_TYPES.find((t) => t.key === selected);

  function proceed() {
    if (selectedType) navigate(getFormPath(selectedType.code));
  }

  return (
    <div style={{ maxWidth: 1450 }}>
      {/* Page header */}
      <div style={{ marginBottom: 20, paddingLeft: 12, borderLeft: `4px solid ${COLORS.primary}` }}>
        <div style={S.pageDesc}>
          Choose the type of approval you are applying for. Each type has specific requirements, timelines and fee structures.
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {APP_TYPES.map((t) => {
          const isSelected = selected === t.key;
          return (
            <div
              key={t.key}
              onClick={() => setSelected(t.key)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = COLORS.primary + '80';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = COLORS.border;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }
              }}
              style={{
                background:    '#fff',
                border:        `1.5px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                borderRadius:  10,
                padding:       '20px 16px 16px',
                cursor:        'pointer',
                transition:    'border-color 0.15s, box-shadow 0.15s',
                display:       'flex',
                flexDirection: 'column',
                gap:           10,
                boxShadow:     isSelected ? `0 4px 16px rgba(0,0,0,0.1)` : 'none',
                position:      'relative',
              }}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 22, height: 22, borderRadius: '50%',
                  background: COLORS.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#fff',
                }}>
                  ✓
                </div>
              )}

              {/* Label + description */}
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.text, marginBottom: 8, lineHeight: 1.35 }}>
                  {t.label}
                </div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.65 }}>
                  {t.desc}
                </div>
              </div>

              {/* Fee */}
              <div style={{
                borderTop: `1px solid ${COLORS.border}`, paddingTop: 10,
                marginTop: 'auto',
              }}>
                <span style={{ fontWeight: 700, color: COLORS.text, fontSize: 13 }}>{t.fee}</span>
              </div>

              {/* Continue button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(t.key);
                  navigate(getFormPath(t.code));
                }}
                style={{
                  background:   isSelected ? COLORS.primary : 'transparent',
                  color:        isSelected ? '#fff' : COLORS.text,
                  border:       `1.5px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                  borderRadius: 6,
                  padding:      '8px 0',
                  width:        '100%',
                  fontSize:     14,
                  fontWeight:   700,
                  cursor:       'pointer',
                  textAlign:    'center',
                  transition:   'background 0.15s, color 0.15s',
                }}
              >
                Continue →
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom action bar */}
      <div style={{
        background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 10,
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div>
          {selectedType ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{selectedType.label}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                  Fee: <strong style={{ color: COLORS.text }}>{selectedType.fee}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>
              ← Select an application type above to continue
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/app/dashboard')}
            style={{
              background: 'transparent', color: COLORS.text,
              border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
              padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={proceed}
            disabled={!selected}
            style={{
              background: selected ? COLORS.primary : COLORS.border,
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '9px 24px', fontSize: 13, fontWeight: 700,
              cursor: selected ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            Proceed to Application →
          </button>
        </div>
      </div>
    </div>
  );
}
