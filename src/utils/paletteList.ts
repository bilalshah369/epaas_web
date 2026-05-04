// All palettes from App.jsx mock (L32-L764).
// Each palette drives the 8 CSS variables applied by applyPalette().
export interface Palette {
  id:      string;
  label:   string;
  emoji:   string;
  group:   'Dark' | 'Light' | 'Pastel';
  primary: string;
  dark:    string;
  light:   string;
  accent:  string;
  bg:      string;
  border:  string;
  text:    string;
  muted:   string;
}

export const PALETTES: Palette[] = [
  // ── Dark & Rich ──────────────────────────────────────────────────────
  { id:'hunter',         label:'Hunter Green',     emoji:'🌲', group:'Dark',   primary:'#0D2416', dark:'#070F0B', light:'#E0EDE5', accent:'#C8991A', bg:'#F2F8F4', border:'#B0CDB9', text:'#0A1A10', muted:'#4A7A5A' },
  { id:'forest',         label:'Forest Green',     emoji:'🌿', group:'Dark',   primary:'#1A3D2B', dark:'#122A1E', light:'#E4EDE7', accent:'#C8991A', bg:'#F4EFE4', border:'#DDD5C4', text:'#1C1C1E', muted:'#6E7B7F' },
  { id:'royal',          label:'Royal Blue',       emoji:'💙', group:'Dark',   primary:'#1A237E', dark:'#0D1654', light:'#E8EAF6', accent:'#F4A261', bg:'#EEF2FF', border:'#C5CBE9', text:'#1C1C1E', muted:'#5C6BC0' },
  { id:'crimson',        label:'Crimson Red',      emoji:'🔴', group:'Dark',   primary:'#7B1F1F', dark:'#4E1313', light:'#FDEAEA', accent:'#F4A261', bg:'#FFF5F5', border:'#F5C6C6', text:'#1C1C1E', muted:'#8B5555' },
  { id:'navy',           label:'Midnight Navy',    emoji:'⚓', group:'Dark',   primary:'#0D1B2A', dark:'#060E17', light:'#E8EEF4', accent:'#00B4D8', bg:'#F0F4F8', border:'#C9D6E0', text:'#1C1C1E', muted:'#5D7A8A' },
  { id:'purple',         label:'Deep Purple',      emoji:'💜', group:'Dark',   primary:'#4A148C', dark:'#2E0A5A', light:'#EDE7F6', accent:'#F9A825', bg:'#F5F0FF', border:'#D1C4E9', text:'#1C1C1E', muted:'#7B5EA7' },
  { id:'teal',           label:'Teal Ocean',       emoji:'🌊', group:'Dark',   primary:'#004D4D', dark:'#003333', light:'#E0F2F2', accent:'#FF6B35', bg:'#F0FAFA', border:'#B2DFDB', text:'#1C1C1E', muted:'#4DB6AC' },
  { id:'chocolate',      label:'Chocolate',        emoji:'🍫', group:'Dark',   primary:'#3E2723', dark:'#1E130F', light:'#EFEBE9', accent:'#FFC107', bg:'#FDF8F5', border:'#D7CCC8', text:'#1C1C1E', muted:'#8D6E63' },
  { id:'slate',          label:'Slate Grey',       emoji:'🩶', group:'Dark',   primary:'#2C3E50', dark:'#1A252F', light:'#ECF0F1', accent:'#E74C3C', bg:'#F4F6F8', border:'#BDC3C7', text:'#1C1C1E', muted:'#7F8C8D' },
  { id:'rose',           label:'Deep Rose',        emoji:'🌸', group:'Dark',   primary:'#880E4F', dark:'#560833', light:'#FCE4EC', accent:'#4CAF50', bg:'#FFF0F5', border:'#F48FB1', text:'#1C1C1E', muted:'#C2185B' },
  { id:'olive',          label:'Olive Earth',      emoji:'🫒', group:'Dark',   primary:'#3B4700', dark:'#232B00', light:'#F1F3E0', accent:'#E91E63', bg:'#F8F9EE', border:'#CDCFA0', text:'#1C1C1E', muted:'#8D9440' },
  { id:'indigo',         label:'Indigo Night',     emoji:'🌌', group:'Dark',   primary:'#1A1A4E', dark:'#0D0D2E', light:'#E8E8F8', accent:'#FF9800', bg:'#F0F0FF', border:'#C0C0E8', text:'#1C1C1E', muted:'#6060A0' },
  { id:'coffee',         label:'Espresso',         emoji:'☕', group:'Dark',   primary:'#2C1A0E', dark:'#180D06', light:'#F0E6DC', accent:'#C8991A', bg:'#FAF5F0', border:'#D9C4B0', text:'#1A0E06', muted:'#8C6A50' },
  { id:'bordeaux',       label:'Bordeaux',         emoji:'🍷', group:'Dark',   primary:'#5C0A1A', dark:'#3A0510', light:'#FAE0E5', accent:'#C8991A', bg:'#FFF5F7', border:'#E8A0B0', text:'#2A0510', muted:'#A05060' },
  { id:'prussian',       label:'Prussian Blue',    emoji:'🔷', group:'Dark',   primary:'#003153', dark:'#001C33', light:'#E0EBF5', accent:'#E8A030', bg:'#F0F5FA', border:'#A0C0D8', text:'#001525', muted:'#5A8AAA' },
  { id:'midnight_plum',  label:'Midnight Plum',    emoji:'🫐', group:'Dark',   primary:'#2D0A4E', dark:'#1A0530', light:'#EDE0FA', accent:'#FFD54F', bg:'#F8F0FF', border:'#C9A8E0', text:'#1A0A2E', muted:'#8A5AB0' },
  { id:'malachite',      label:'Malachite',        emoji:'🟢', group:'Dark',   primary:'#004030', dark:'#002818', light:'#E0F5ED', accent:'#FF8C42', bg:'#F0FAF5', border:'#90CEB8', text:'#001A14', muted:'#4A9A80' },
  { id:'sapphire',       label:'Dark Sapphire',    emoji:'💎', group:'Dark',   primary:'#0D1B5E', dark:'#07103A', light:'#E4E8FA', accent:'#FF6B6B', bg:'#EEF0FF', border:'#A8B4E0', text:'#06102A', muted:'#5468B0' },
  { id:'charcoal_steel', label:'Charcoal Steel',   emoji:'⚙️', group:'Dark',   primary:'#1E2A3A', dark:'#0E1520', light:'#E8EDF2', accent:'#E8C84A', bg:'#F4F6F8', border:'#B0BCC8', text:'#0E1820', muted:'#6880A0' },
  { id:'petrol',         label:'Petrol Dark',      emoji:'🛢️', group:'Dark',   primary:'#1A3A4A', dark:'#0E2030', light:'#E0EBF0', accent:'#E8A030', bg:'#F0F5F8', border:'#9AB8C8', text:'#0E1E28', muted:'#5A8898' },
  { id:'mahogany',       label:'Mahogany',         emoji:'🪵', group:'Dark',   primary:'#4E1A0A', dark:'#2E0F05', light:'#F5E8E0', accent:'#2E7D55', bg:'#FDF5F0', border:'#D8B0A0', text:'#2A0E05', muted:'#906050' },
  { id:'onyx',           label:'Onyx',             emoji:'🖤', group:'Dark',   primary:'#18181F', dark:'#0C0C12', light:'#EAEAEF', accent:'#C8991A', bg:'#F5F5F8', border:'#C0C0CC', text:'#12121A', muted:'#7070A0' },
  // ── Light & Soft ─────────────────────────────────────────────────────
  { id:'lavender',       label:'Lavender Mist',    emoji:'🪻', group:'Light',  primary:'#6B5B93', dark:'#4A3F6B', light:'#EDE7F6', accent:'#F48FB1', bg:'#F9F6FF', border:'#D7CDE9', text:'#2D2347', muted:'#9C89B8' },
  { id:'mint',           label:'Mint Fresh',       emoji:'🌱', group:'Light',  primary:'#2E7D52', dark:'#1B5235', light:'#E8F5EE', accent:'#FF8A65', bg:'#F0FBF5', border:'#A5D6B7', text:'#1A2E22', muted:'#5DA87A' },
  { id:'peach',          label:'Peach Blossom',    emoji:'🍑', group:'Light',  primary:'#C2623F', dark:'#8C3E21', light:'#FFF0E8', accent:'#5B9BD5', bg:'#FFF8F4', border:'#F5C9B3', text:'#2E1A12', muted:'#C2865F' },
  { id:'sky',            label:'Sky Blue',         emoji:'🌤️', group:'Light',  primary:'#0277BD', dark:'#01579B', light:'#E1F5FE', accent:'#FFB300', bg:'#F0F8FF', border:'#B3D9F5', text:'#0D1F2D', muted:'#4FA3D1' },
  { id:'coral',          label:'Coral Reef',       emoji:'🪸', group:'Light',  primary:'#BF4040', dark:'#8C2020', light:'#FDEAEA', accent:'#00897B', bg:'#FFF9F9', border:'#F5C6C6', text:'#2A1010', muted:'#C27878' },
  { id:'sand',           label:'Sandy Shore',      emoji:'🏖️', group:'Light',  primary:'#7A5C2E', dark:'#4E3A1A', light:'#F5EDD8', accent:'#5C8A6A', bg:'#FBF7F0', border:'#E2D0B0', text:'#2A1F0E', muted:'#A08050' },
  { id:'emerald',        label:'Emerald Light',    emoji:'💚', group:'Light',  primary:'#1B6B45', dark:'#0F4229', light:'#E0F4EA', accent:'#E67E22', bg:'#F2FBF6', border:'#A8D8BC', text:'#0F2E1E', muted:'#4DA07A' },
  { id:'blush',          label:'Blush Pink',       emoji:'🩷', group:'Light',  primary:'#AD3B6E', dark:'#7A2050', light:'#FCE8F2', accent:'#4CAF50', bg:'#FFF4F8', border:'#F5B8D4', text:'#2E0E1E', muted:'#C26E96' },
  { id:'arctic',         label:'Arctic White',     emoji:'❄️', group:'Light',  primary:'#37474F', dark:'#263238', light:'#ECEFF1', accent:'#00BCD4', bg:'#FAFBFC', border:'#CFD8DC', text:'#1C1C1E', muted:'#78909C' },
  { id:'golden',         label:'Golden Hour',      emoji:'🌅', group:'Light',  primary:'#7B5500', dark:'#4E3500', light:'#FFF8E1', accent:'#1976D2', bg:'#FFFCF2', border:'#E6CF88', text:'#2A1C00', muted:'#A07A30' },
  { id:'electric_violet',label:'Electric Violet',  emoji:'⚡', group:'Light',  primary:'#5E35B1', dark:'#4527A0', light:'#EDE7F6', accent:'#FF6B35', bg:'#F8F5FF', border:'#CEC4F0', text:'#1A0E2E', muted:'#9575CD' },
  { id:'ocean_blue',     label:'Ocean Blue',       emoji:'🌊', group:'Light',  primary:'#0277BD', dark:'#01579B', light:'#E1F5FE', accent:'#F57F17', bg:'#F0F8FF', border:'#81D4FA', text:'#001525', muted:'#29B6F6' },
  { id:'tropical',       label:'Tropical Teal',    emoji:'🐠', group:'Light',  primary:'#00897B', dark:'#00695C', light:'#E0F2F1', accent:'#FF7043', bg:'#F0FAFA', border:'#80CBC4', text:'#001E1A', muted:'#4DB6AC' },
  { id:'hot_coral',      label:'Hot Coral',        emoji:'🪸', group:'Light',  primary:'#E64A19', dark:'#BF360C', light:'#FBE9E7', accent:'#1976D2', bg:'#FFF8F6', border:'#FFAB91', text:'#2A0800', muted:'#FF7043' },
  { id:'berry_punch',    label:'Berry Punch',      emoji:'🫐', group:'Light',  primary:'#C2185B', dark:'#880E4F', light:'#FCE4EC', accent:'#00ACC1', bg:'#FFF5F8', border:'#F48FB1', text:'#2A0015', muted:'#EC407A' },
  { id:'lime_fresh',     label:'Lime Fresh',       emoji:'🍋', group:'Light',  primary:'#558B2F', dark:'#33691E', light:'#F1F8E9', accent:'#E53935', bg:'#F9FDF0', border:'#AED581', text:'#1A2A08', muted:'#7CB342' },
  { id:'tangerine',      label:'Tangerine',        emoji:'🍊', group:'Light',  primary:'#EF6C00', dark:'#BF360C', light:'#FFF3E0', accent:'#1E88E5', bg:'#FFFAF5', border:'#FFCC80', text:'#2A1000', muted:'#FFA726' },
  { id:'sunshine',       label:'Sunshine',         emoji:'☀️', group:'Light',  primary:'#F9A825', dark:'#F57F17', light:'#FFF8E1', accent:'#1565C0', bg:'#FFFFF0', border:'#FFE082', text:'#1A1000', muted:'#FFB300' },
  // ── Pastel & Dreamy ──────────────────────────────────────────────────
  { id:'cotton',         label:'Cotton Candy',     emoji:'🍭', group:'Pastel', primary:'#B39DDB', dark:'#7E57C2', light:'#F3E5F5', accent:'#FFB6C1', bg:'#FDF8FF', border:'#E1D5F5', text:'#2A1A3E', muted:'#C5AEE8' },
  { id:'babyblu',        label:'Baby Blue',        emoji:'🫐', group:'Pastel', primary:'#90CAF9', dark:'#42A5F5', light:'#E3F2FD', accent:'#FFE082', bg:'#F5FAFF', border:'#BBDEFB', text:'#1A2A3A', muted:'#64B5F6' },
  { id:'honeydew',       label:'Honeydew',         emoji:'🍈', group:'Pastel', primary:'#A5D6A7', dark:'#66BB6A', light:'#E8F5E9', accent:'#FFCC80', bg:'#F5FBF5', border:'#C8E6C9', text:'#1A2E1A', muted:'#81C784' },
  { id:'buttercup',      label:'Buttercup',        emoji:'🌼', group:'Pastel', primary:'#FFF176', dark:'#F9A825', light:'#FFFDE7', accent:'#81C784', bg:'#FFFFF5', border:'#FFF9C4', text:'#2A2200', muted:'#F9C74F' },
  { id:'lilac',          label:'Lilac Dream',      emoji:'💐', group:'Pastel', primary:'#CE93D8', dark:'#9C27B0', light:'#F8E8FF', accent:'#80DEEA', bg:'#FDF5FF', border:'#E8C8F0', text:'#2A1030', muted:'#D8A0E0' },
  { id:'seafoam',        label:'Seafoam',          emoji:'🫧', group:'Pastel', primary:'#80CBC4', dark:'#00897B', light:'#E0F5F3', accent:'#FFAB91', bg:'#F4FEFE', border:'#B2DFDB', text:'#0E2826', muted:'#80CBC4' },
  { id:'dustrose',       label:'Dusty Rose',       emoji:'🥀', group:'Pastel', primary:'#E8A0B0', dark:'#C2677E', light:'#FDE8EE', accent:'#A5D6A7', bg:'#FFF8FA', border:'#F5C8D4', text:'#2A1020', muted:'#D89090' },
  { id:'powder',         label:'Powder Blue',      emoji:'🩵', group:'Pastel', primary:'#B0C4DE', dark:'#6A8CAA', light:'#EAF0F8', accent:'#FFD180', bg:'#F5F8FC', border:'#D0DCE8', text:'#1A2030', muted:'#90A8C0' },
  { id:'champagne',      label:'Champagne',        emoji:'🥂', group:'Pastel', primary:'#D4A96A', dark:'#A07840', light:'#FDF5E8', accent:'#7BAFD4', bg:'#FFFCF7', border:'#EDD8B0', text:'#2A1C08', muted:'#C0905A' },
  { id:'sage',           label:'Sage Green',       emoji:'🌾', group:'Pastel', primary:'#8FAF8F', dark:'#5A7A5A', light:'#EEF5EE', accent:'#D4A96A', bg:'#F7FBF7', border:'#C8DCC8', text:'#1A2A1A', muted:'#7A9E7A' },
  { id:'rosewater',      label:'Rose Water',       emoji:'🌹', group:'Pastel', primary:'#E8B4B8', dark:'#C07880', light:'#FDE8EA', accent:'#9DD4CF', bg:'#FFF8F8', border:'#F5D0D4', text:'#2A1215', muted:'#D0909A' },
  { id:'periwinkle',     label:'Periwinkle',       emoji:'🔮', group:'Pastel', primary:'#9FA8DA', dark:'#5C6BC0', light:'#E8EAF6', accent:'#FFCC80', bg:'#F5F6FF', border:'#D0D4F0', text:'#1A1C30', muted:'#8090C8' },
];

export const DEFAULT_PALETTE_ID = 'forest';
