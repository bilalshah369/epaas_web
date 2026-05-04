import { useState } from "react";
import { PALETTES, savePalette, STORAGE_KEY } from "@/utils/palette";

const GROUPS = ["Deep & Rich", "Light & Soft", "Pastel & Dreamy"] as const;
const GROUP_KEYS: Record<(typeof GROUPS)[number], "Dark" | "Light" | "Pastel"> =
  {
    "Deep & Rich": "Dark",
    "Light & Soft": "Light",
    "Pastel & Dreamy": "Pastel",
  };

function PalettePreview({ palette }: { palette: any }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: 6,
      }}
    >
      {/* Header bar */}
      <div style={{ display: "flex", height: 4, gap: 2 }}>
        <div
          style={{ flex: 1, background: palette.primary, borderRadius: 1 }}
        />
        <div
          style={{ flex: 0.6, background: palette.accent, borderRadius: 1 }}
        />
      </div>
      {/* Content lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <div
          style={{
            height: 2,
            background: palette.text,
            borderRadius: 0.5,
            width: "80%",
          }}
        />
        <div
          style={{
            height: 2,
            background: palette.text,
            borderRadius: 0.5,
            width: "60%",
          }}
        />
        <div
          style={{
            height: 2,
            background: palette.border,
            borderRadius: 0.5,
            width: "70%",
          }}
        />
      </div>
      {/* Footer accent */}
      <div
        style={{
          marginTop: "auto",
          height: 3,
          background: palette.light,
          borderRadius: 1,
        }}
      />
    </div>
  );
}

export default function PalettePicker() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    (typeof GROUPS)[number] | "Custom"
  >("Deep & Rich");
  const [active, setActive] = useState(
    localStorage.getItem(STORAGE_KEY) ?? "forest",
  );

  const activePalette = PALETTES.find((p) => p.id === active);
  const currentGroup = activeTab === "Custom" ? null : GROUP_KEYS[activeTab];
  const filteredPalettes = currentGroup
    ? PALETTES.filter((p) => p.group === currentGroup)
    : [];

  function pick(id: string) {
    savePalette(id);
    setActive(id);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change theme"
        style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 5,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 500,
          padding: "5px 10px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {/* Color swatches */}
        <div style={{ display: "flex", gap: 3 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: activePalette?.primary || "#1A3D2B",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: activePalette?.accent || "#C8991A",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: activePalette?.light || "#E4EDE7",
            }}
          />
        </div>
        <span style={{ color: "#1A3D2B", fontWeight: 600 }}>Palette</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 998,
            }}
            onClick={() => setOpen(false)}
          />
          {/* Modal */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 8,
              zIndex: 999,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
              width: "98vw",
              maxWidth: 740,
              maxHeight: "75vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "#1A3D2B",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexShrink: 0,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  🎨 Colour Palette
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.75)",
                    marginTop: 2,
                  }}
                >
                  Choose a theme or create your own
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 4,
                  width: 26,
                  height: 26,
                  fontSize: 15,
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #e8e8e8",
                background: "#fafafa",
                flexShrink: 0,
              }}
            >
              {GROUPS.map((group) => (
                <button
                  key={group}
                  onClick={() => setActiveTab(group)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    color: activeTab === group ? "#1A3D2B" : "#999",
                    borderBottom:
                      activeTab === group
                        ? "2px solid #1A3D2B"
                        : "2px solid transparent",
                    marginBottom: -1,
                    transition: "all 0.2s",
                  }}
                >
                  {group}
                </button>
              ))}
              <button
                onClick={() => setActiveTab("Custom")}
                style={{
                  padding: "8px 12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  color: activeTab === "Custom" ? "#1A3D2B" : "#999",
                  borderBottom:
                    activeTab === "Custom"
                      ? "2px solid #1A3D2B"
                      : "2px solid transparent",
                  marginBottom: -1,
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  transition: "all 0.2s",
                }}
              >
                <span>🎨</span> Custom
              </button>
            </div>

            {/* Grid */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px",
              }}
            >
              {activeTab === "Custom" ? (
                <div
                  style={{
                    padding: "30px 15px",
                    textAlign: "center",
                    color: "#999",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    Custom palette editor coming soon
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 10,
                  }}
                >
                  {filteredPalettes.map((palette) => (
                    <button
                      key={palette.id}
                      onClick={() => pick(palette.id)}
                      style={{
                        background: "#fff",
                        border:
                          active === palette.id
                            ? "2px solid #1A3D2B"
                            : "1px solid #e0e0e0",
                        borderRadius: 8,
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow:
                          active === palette.id
                            ? "0 2px 8px rgba(26,61,43,0.12)"
                            : "0 1px 3px rgba(0,0,0,0.05)",
                        display: "flex",
                        flexDirection: "column",
                        height: 115,
                        position: "relative",
                      }}
                    >
                      {/* Preview area */}
                      <div
                        style={{
                          flex: 1,
                          background: palette.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PalettePreview palette={palette} />
                      </div>

                      {/* Label */}
                      <div
                        style={{
                          background: palette.primary,
                          color: "#fff",
                          padding: "5px 8px",
                          fontSize: 9,
                          fontWeight: 700,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {palette.label}
                        </span>
                        {active === palette.id && (
                          <span style={{ marginLeft: 4 }}>✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid #e8e8e8",
                padding: "8px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fafafa",
                fontSize: 9,
                color: "#666",
                flexShrink: 0,
              }}
            >
              <span>{filteredPalettes.length} built-in palettes</span>
              {activePalette && (
                <span>
                  Active: {activePalette.emoji} {activePalette.label}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
