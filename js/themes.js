// Hazır tema paketleri. Her biri iki renk döner (ana + ikincil gradyan rengi).
const THEME_PRESETS = {
  mavi:     { label: 'Mavi',      accent: '#0A84FF', accent2: '#64D2FF' },
  lacivert: { label: 'Lacivert',  accent: '#5E5CE6', accent2: '#0A84FF' },
  mor:      { label: 'Mor',       accent: '#BF5AF2', accent2: '#FF375F' },
  zumrut:   { label: 'Zümrüt',    accent: '#30D158', accent2: '#64D2FF' },
  gunbatimi:{ label: 'Gün Batımı',accent: '#FF9F0A', accent2: '#FF375F' },
  gece:     { label: 'Gece (Gri)',accent: '#98989D', accent2: '#C7C7CC' },
};

function applyTheme(cfg) {
  const theme = (cfg && cfg.theme) || {};
  const preset = THEME_PRESETS[theme.preset] || THEME_PRESETS.mavi;
  const accent = theme.accent || preset.accent;
  const accent2 = theme.accent2 || preset.accent2;
  const root = document.documentElement.style;
  root.setProperty('--accent', accent);
  root.setProperty('--accent2', accent2);
  root.setProperty('--accent-rgb', hexToRgb(accent));
  root.setProperty('--accent2-rgb', hexToRgb(accent2));
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
