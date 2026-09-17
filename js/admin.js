// Eczane Ekranı - admin paneli mantığı

let cfg = loadConfig();

document.addEventListener('DOMContentLoaded', () => {
  populateForm();
  renderCampaignList();
  renderTipList();
  bindEvents();
});

function populateForm() {
  document.getElementById('pharmacyName').value = cfg.pharmacy.name || '';
  document.getElementById('city').value = cfg.pharmacy.city || '';
  document.getElementById('district').value = cfg.pharmacy.district || '';

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

  document.getElementById('saveBtn').addEventListener('click', saveAll);
}

function readFormIntoCfg() {
  cfg.pharmacy.name = document.getElementById('pharmacyName').value.trim();
  cfg.pharmacy.city = document.getElementById('city').value.trim();
  cfg.pharmacy.district = document.getElementById('district').value.trim();

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

  const apiKey = document.getElementById('dutyApiKey').value.trim();
  const city = document.getElementById('city').value.trim();
  const district = document.getElementById('district').value.trim();

  if (!apiKey || !city) {
    statusEl.className = 'status-msg err';
    statusEl.textContent = 'API anahtarı ve il alanı zorunlu.';
    return;
  }

  try {
    const url = new URL('https://www.nosyapi.com/apiv2/service/pharmacies-on-duty');
    url.searchParams.set('city', city);
    if (district) url.searchParams.set('district', district);
    url.searchParams.set('apiKey', apiKey);
    const res = await fetch(url.toString());
    const json = await res.json();
    if (!res.ok || json.status === 'error') {
      throw new Error(json.message || ('HTTP ' + res.status));
    }
    const count = Array.isArray(json.data) ? json.data.length : 0;
    statusEl.className = 'status-msg ok';
    statusEl.textContent = `✔ Bağlantı başarılı. ${count} nöbetçi eczane bulundu.`;
  } catch (e) {
    statusEl.className = 'status-msg err';
    statusEl.textContent = '✘ Bağlanılamadı: ' + e.message + ' (tarayıcı CORS kısıtlaması olabilir — bu durumda manuel bilgileri kullanın.)';
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
