// Ortak ayarlar: yükleme / kaydetme / varsayılanlar. index.html ve admin.html tarafından paylaşılır.

const STORAGE_KEY = 'eczaneEkranConfig_v2';

function defaultConfig() {
  return {
    pharmacy: {
      name: 'Moda Sahil Eczanesi',
      logoDataUrl: '',
      city: 'istanbul',
      district: 'kadikoy',
      semt: 'Caferağa', // Kadıköy/Merkez nöbet bölgesi
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
      lat: 40.9793,
      lon: 29.0339,
      cityLabel: 'Moda, Kadıköy',
    },
    theme: {
      preset: 'mavi',
      accent: '',  // boşsa preset rengi kullanılır; admin panelinden özel renk seçilebilir
      accent2: '',
    },
    slideDuration: 14,
    campaigns: [
      { id: 'grip-asisi', imageDataUrl: 'assets/campaigns/grip-asisi.svg', title: '', duration: 14 },
      { id: 'baglisiklik', imageDataUrl: 'assets/campaigns/baglisiklik.svg', title: '', duration: 14 },
      { id: 'cilt-bakimi', imageDataUrl: 'assets/campaigns/cilt-bakimi.svg', title: '', duration: 14 },
      { id: 'hijyen', imageDataUrl: 'assets/campaigns/hijyen.svg', title: '', duration: 14 },
      { id: 'oksuruk-bogaz', imageDataUrl: 'assets/campaigns/oksuruk-bogaz.svg', title: '', duration: 14 },
    ], // { id, imageDataUrl, title, duration }
    healthTips: {
      enabled: false,
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
