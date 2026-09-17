// Eczane Ekranı - admin paneli mantığı

let cfg = loadConfig();

document.addEventListener('DOMContentLoaded', () => {
  populateForm();
  renderCampaignList();
  renderTipList();
  renderThemeRow();
  applyTheme(cfg);
  bindEvents();
});

function populateForm() {
  document.getElementById('pharmacyName').value = cfg.pharmacy.name || '';
  document.getElementById('pharmacistName').value = cfg.pharmacy.pharmacistName || '';
  document.getElementById('pharmacyPhone').value = cfg.pharmacy.phone || '';
  document.getElementById('city').value = cfg.pharmacy.city || '';
  document.getElementById('district').value = cfg.pharmacy.district || '';
  document.getElementById('semt').value = cfg.pharmacy.semt || '';
  document.getElementById('promosEnabled').checked = cfg.promos.enabled;

  document.getElementById('dutyEnabled').checked = cfg.duty.enabled;
  document.getElementById('dutyApiKey').value = cfg.duty.apiKey || '';
  document.getElementById('manualName').value = cfg.duty.manualName || '';
  document.getElementById('manualAddress').value = cfg.duty.manualAddress || '';
  document.getElementById('manualPhone').value = cfg.duty.manualPhone || '';

  document.getElementById('weatherEnabled').checked = cfg.weather.enabled;
  if (cfg.weather.cityLabel) {
    document.getElementById('weatherStatus').textContent = `Seçili şehir: ${cfg.weather.cityLabel}`;
  }

  document.getElementById('tipsEnabled').checked = cfg.healthTips.enabled;
  document.getElementById('tipsBuiltIn').checked = cfg.healthTips.useBuiltIn;

  document.getElementById('slideDuration').value = cfg.slideDuration;
}

function bindEvents() {
  document.getElementById('logoFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    cfg.pharmacy.logoDataUrl = await fileToDataUrl(file);
  });

  document.getElementById('testDutyBtn').addEventListener('click', testDutyApi);

  document.getElementById('weatherSearchBtn').addEventListener('click', searchWeatherCity);

  document.getElementById('campaignFile').addEventListener('change', () => {});
  document.getElementById('addCampaignBtn').addEventListener('click', addCampaign);

  document.getElementById('addTipBtn').addEventListener('click', addCustomTip);

  document.getElementById('customAccent').addEventListener('input', (e) => {
    cfg.theme = { preset: 'custom', accent: e.target.value, accent2: lightenColor(e.target.value, 0.35) };
    applyTheme(cfg);
    renderThemeRow();
  });

  document.getElementById('saveBtn').addEventListener('click', saveAll);
}

function renderThemeRow() {
  const row = document.getElementById('themeRow');
  row.innerHTML = Object.entries(THEME_PRESETS)
    .map(([key, t]) => {
      const selected = cfg.theme.preset === key ? 'selected' : '';
      return `<div class="theme-swatch ${selected}" data-preset="${key}" title="${t.label}"
        style="background: linear-gradient(135deg, ${t.accent}, ${t.accent2})"></div>`;
    })
    .join('');

  row.querySelectorAll('.theme-swatch').forEach((el) => {
    el.addEventListener('click', () => {
      cfg.theme = { preset: el.dataset.preset, accent: '', accent2: '' };
      applyTheme(cfg);
      renderThemeRow();
    });
  });
}

function lightenColor(hex, amount) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function readFormIntoCfg() {
  cfg.pharmacy.name = document.getElementById('pharmacyName').value.trim();
  cfg.pharmacy.pharmacistName = document.getElementById('pharmacistName').value.trim();
  cfg.pharmacy.phone = document.getElementById('pharmacyPhone').value.trim();
  cfg.pharmacy.city = document.getElementById('city').value.trim();
  cfg.pharmacy.district = document.getElementById('district').value.trim();
  cfg.pharmacy.semt = document.getElementById('semt').value.trim();
  cfg.promos.enabled = document.getElementById('promosEnabled').checked;

  cfg.duty.enabled = document.getElementById('dutyEnabled').checked;
  cfg.duty.apiKey = document.getElementById('dutyApiKey').value.trim();
  cfg.duty.manualName = document.getElementById('manualName').value.trim();
  cfg.duty.manualAddress = document.getElementById('manualAddress').value.trim();
  cfg.duty.manualPhone = document.getElementById('manualPhone').value.trim();

  cfg.weather.enabled = document.getElementById('weatherEnabled').checked;

  cfg.healthTips.enabled = document.getElementById('tipsEnabled').checked;
  cfg.healthTips.useBuiltIn = document.getElementById('tipsBuiltIn').checked;

  cfg.slideDuration = Number(document.getElementById('slideDuration').value) || 14;
}

function saveAll() {
  readFormIntoCfg();
  saveConfig(cfg);
  const status = document.getElementById('saveStatus');
  status.textContent = '✔ Kaydedildi';
  setTimeout(() => (status.textContent = ''), 2500);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function testDutyApi() {
  const statusEl = document.getElementById('dutyStatus');
  statusEl.className = 'status-msg';
  statusEl.textContent = 'Test ediliyor...';

  const district = document.getElementById('district').value.trim();
  const semt = document.getElementById('semt').value.trim();
  if (!district) {
    statusEl.className = 'status-msg err';
    statusEl.textContent = 'Önce yukarıya ilçenizi yazın (örn. Kadıköy).';
    return;
  }

  try {
    let url = '/api/nobetci?ilce=' + encodeURIComponent(district);
    if (semt) url += '&semt=' + encodeURIComponent(semt);
    const res = await fetch(url);
    const json = await res.json();
    if (json.status !== 'ok') throw new Error(json.message || 'Kaynak yanıt vermedi');
    if (!json.pharmacies.length) {
      statusEl.className = 'status-msg err';
      statusEl.textContent = `"${district}" için sonuç bulunamadı — İstanbul ilçe adını doğru yazdığınızdan emin olun (örn. Kadıköy, Üsküdar).`;
      return;
    }
    statusEl.className = 'status-msg ok';
    statusEl.textContent = `✔ Bağlantı başarılı. ${json.pharmacies.length} nöbetçi eczane bulundu (kaynak: ${json.source}).`;
  } catch (e) {
    statusEl.className = 'status-msg err';
    statusEl.textContent = '✘ Otomatik kaynağa ulaşılamadı: ' + e.message + '. İstanbul dışındaysanız NosyAPI anahtarı veya manuel bilgi kullanabilirsiniz.';
  }
}

async function searchWeatherCity() {
  const q = document.getElementById('weatherSearch').value.trim();
  const statusEl = document.getElementById('weatherStatus');
  if (!q) return;
  statusEl.textContent = 'Aranıyor...';
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=tr`;
    const res = await fetch(url);
    const json = await res.json();
    const result = json.results?.[0];
    if (!result) {
      statusEl.textContent = 'Şehir bulunamadı.';
      return;
    }
    cfg.weather.lat = result.latitude;
    cfg.weather.lon = result.longitude;
    cfg.weather.cityLabel = `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}`;
    statusEl.textContent = `✔ Seçildi: ${cfg.weather.cityLabel}`;
  } catch (e) {
    statusEl.textContent = 'Arama başarısız: ' + e.message;
  }
}

async function addCampaign() {
  const fileInput = document.getElementById('campaignFile');
  const file = fileInput.files[0];
  if (!file) {
    alert('Lütfen bir görsel seçin.');
    return;
  }
  const dataUrl = await fileToDataUrl(file);
  const title = document.getElementById('campaignTitle').value.trim();
  const duration = Number(document.getElementById('campaignDuration').value) || 14;

  cfg.campaigns.push({ id: uid(), imageDataUrl: dataUrl, title, duration });
  saveConfig(cfg);
  renderCampaignList();

  fileInput.value = '';
  document.getElementById('campaignTitle').value = '';
}

function renderCampaignList() {
  const list = document.getElementById('campaignList');
  if (!cfg.campaigns.length) {
    list.innerHTML = '<div class="hint">Henüz kampanya slaytı eklenmedi.</div>';
    return;
  }
  list.innerHTML = cfg.campaigns
    .map(
      (c) => `
      <div class="campaign-item">
        <img src="${c.imageDataUrl}" />
        <div class="meta">
          <div>${c.title ? escapeHtmlAdmin(c.title) : '<em>(başlıksız)</em>'}</div>
          <div class="hint">${c.duration} sn</div>
        </div>
        <button class="btn danger" data-remove-campaign="${c.id}">Sil</button>
      </div>`
    )
    .join('');

  list.querySelectorAll('[data-remove-campaign]').forEach((btn) => {
    btn.addEventListener('click', () => {
      cfg.campaigns = cfg.campaigns.filter((c) => c.id !== btn.dataset.removeCampaign);
      saveConfig(cfg);
      renderCampaignList();
    });
  });
}

function addCustomTip() {
  const input = document.getElementById('customTipInput');
  const val = input.value.trim();
  if (!val) return;
  cfg.healthTips.customTips.push(val);
  saveConfig(cfg);
  input.value = '';
  renderTipList();
}

function renderTipList() {
  const list = document.getElementById('tipList');
  if (!cfg.healthTips.customTips.length) {
    list.innerHTML = '<div class="hint">Henüz özel ipucu eklenmedi.</div>';
    return;
  }
  list.innerHTML = cfg.healthTips.customTips
    .map(
      (t, i) => `
      <div class="tip-item">
        <span>${escapeHtmlAdmin(t)}</span>
        <button class="btn danger" data-remove-tip="${i}">Sil</button>
      </div>`
    )
    .join('');

  list.querySelectorAll('[data-remove-tip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      cfg.healthTips.customTips.splice(Number(btn.dataset.removeTip), 1);
      saveConfig(cfg);
      renderTipList();
    });
  });
}

function escapeHtmlAdmin(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
