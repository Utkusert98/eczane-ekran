// Ortak ayarlar: yükleme / kaydetme / varsayılanlar. index.html ve admin.html tarafından paylaşılır.

const STORAGE_KEY = 'eczaneEkranConfig_v2';

function defaultConfig() {
  return {
    pharmacy: {
      name: 'Eczanem',
      logoDataUrl: '',
      city: '',
      district: '',
    },
    duty: {
      enabled: true,
      apiKey: '',
      manualName: '',
      manualAddress: '',
      manualPhone: '',
    },
    weather: {
      enabled: true,
      lat: null,
      lon: null,
      cityLabel: '',
    },
    slideDuration: 14,
    campaigns: [], // { id, imageDataUrl, title, duration }
    healthTips: {
      enabled: true,
      useBuiltIn: true,
      customTips: [],
    },
  };
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig();
    const parsed = JSON.parse(raw);
    // eksik alanları varsayılanla tamamla (eski sürümden geçişte kırılmasın)
    return deepMerge(defaultConfig(), parsed);
  } catch (e) {
    console.error('Config okunamadı, varsayılana dönülüyor.', e);
    return defaultConfig();
  }
}

function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function deepMerge(base, override) {
  const result = Array.isArray(base) ? [...base] : { ...base };
  for (const key in override) {
    if (
      override[key] &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      base[key] &&
      typeof base[key] === 'object'
    ) {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
