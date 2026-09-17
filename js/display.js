// Eczane Ekranı - ana ekran (kiosk) mantığı

let config = loadConfig();
let dutyData = null; // { name, address, phone, source: 'api'|'manual' }
let weatherData = null; // { temp, code, label }
let slideQueue = [];
let slideIndex = 0;
let slideTimer = null;

const WEATHER_CODES = {
  0: { label: 'Açık', icon: '☀️' },
  1: { label: 'Az bulutlu', icon: '🌤️' },
  2: { label: 'Parçalı bulutlu', icon: '⛅' },
  3: { label: 'Kapalı', icon: '☁️' },
  45: { label: 'Sisli', icon: '🌫️' },
  48: { label: 'Kırağılı sis', icon: '🌫️' },
  51: { label: 'Hafif çiseleme', icon: '🌦️' },
  61: { label: 'Hafif yağmurlu', icon: '🌧️' },
  63: { label: 'Yağmurlu', icon: '🌧️' },
  65: { label: 'Kuvvetli yağmur', icon: '🌧️' },
  71: { label: 'Hafif kar', icon: '🌨️' },
  73: { label: 'Kar yağışlı', icon: '❄️' },
  75: { label: 'Yoğun kar', icon: '❄️' },
  80: { label: 'Sağanak', icon: '🌦️' },
  95: { label: 'Gök gürültülü', icon: '⛈️' },
};

function initDisplay() {
  applyPharmacyBranding();
  startClock();
  refreshDynamicData();
  setInterval(refreshDynamicData, 20 * 60 * 1000); // 20 dakikada bir yenile
  buildSlideQueue();
  rotateSlides();
  setInterval(() => {
    // ayarlar başka sekmede değiştiyse ekranı canlı güncelle
    config = loadConfig();
  }, 5000);
}

function applyPharmacyBranding() {
  const nameEl = document.getElementById('pharmacyName');
  const logoEl = document.getElementById('pharmacyLogo');
  nameEl.textContent = config.pharmacy.name || 'Eczanem';
  if (config.pharmacy.logoDataUrl) {
    logoEl.src = config.pharmacy.logoDataUrl;
    logoEl.style.display = 'block';
  } else {
    logoEl.style.display = 'none';
  }
}

function startClock() {
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('dateLabel');
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }
  tick();
  setInterval(tick, 1000);
}

async function refreshDynamicData() {
  if (config.duty.enabled) dutyData = await fetchDutyPharmacy(config);
  if (config.weather.enabled) weatherData = await fetchWeather(config);
  buildSlideQueue();
}

async function fetchDutyPharmacy(cfg) {
  const manual = {
    name: cfg.duty.manualName || null,
    address: cfg.duty.manualAddress || null,
    phone: cfg.duty.manualPhone || null,
    source: 'manual',
  };
  if (!cfg.duty.apiKey || !cfg.pharmacy.city) {
    return manual.name ? manual : null;
  }
  try {
    const url = new URL('https://www.nosyapi.com/apiv2/service/pharmacies-on-duty');
    url.searchParams.set('city', cfg.pharmacy.city);
    if (cfg.pharmacy.district) url.searchParams.set('district', cfg.pharmacy.district);
    url.searchParams.set('apiKey', cfg.duty.apiKey);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('API yanıtı başarısız: ' + res.status);
    const json = await res.json();
    const list = Array.isArray(json.data) ? json.data : [];
    if (!list.length) return manual.name ? manual : null;
    return {
      list: list.slice(0, 6).map((p) => ({
        name: p.pharmacyName || p.name || 'Nöbetçi Eczane',
        address: p.address || '',
        phone: p.phone || p.phoneNumber || '',
      })),
      source: 'api',
    };
  } catch (e) {
    console.warn('Nöbetçi eczane API alınamadı, manuel veriye dönülüyor.', e);
    return manual.name ? manual : null;
  }
}

async function fetchWeather(cfg) {
  try {
    let lat = cfg.weather.lat;
    let lon = cfg.weather.lon;
    if (!lat || !lon) return null;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Hava durumu alınamadı: ' + res.status);
    const json = await res.json();
    const code = json.current?.weather_code ?? 0;
    return {
      temp: Math.round(json.current?.temperature_2m ?? 0),
      code,
      label: WEATHER_CODES[code]?.label || 'Bilinmiyor',
      icon: WEATHER_CODES[code]?.icon || '🌡️',
      cityLabel: cfg.weather.cityLabel || '',
    };
  } catch (e) {
    console.warn('Hava durumu alınamadı.', e);
    return null;
  }
}

function buildSlideQueue() {
  const slides = [];

  if (config.duty.enabled && dutyData) {
    slides.push({ type: 'duty', duration: config.slideDuration });
  }

  if (config.weather.enabled && weatherData) {
    slides.push({ type: 'weather', duration: config.slideDuration });
  }

  if (config.healthTips.enabled) {
    const tips = getActiveHealthTips(config);
    if (tips.length) {
      const tip = tips[Math.floor(Math.random() * tips.length)];
      slides.push({ type: 'healthTip', text: tip, duration: config.slideDuration });
    }
  }

  config.campaigns.forEach((c) => {
    slides.push({ type: 'campaign', campaign: c, duration: c.duration || config.slideDuration });
  });

  if (!slides.length) {
    slides.push({ type: 'empty', duration: config.slideDuration });
  }

  slideQueue = slides;
  if (slideIndex >= slideQueue.length) slideIndex = 0;
}

function rotateSlides() {
  renderCurrentSlide();
  scheduleNext();
}

function scheduleNext() {
  clearTimeout(slideTimer);
  const current = slideQueue[slideIndex] || { duration: config.slideDuration };
  slideTimer = setTimeout(() => {
    slideIndex = (slideIndex + 1) % slideQueue.length;
    renderCurrentSlide();
    scheduleNext();
  }, (current.duration || config.slideDuration) * 1000);
}

function renderCurrentSlide() {
  const stage = document.getElementById('stage');
  const slide = slideQueue[slideIndex];
  if (!slide) return;

  stage.classList.remove('fade-in');
  stage.innerHTML = renderSlideHtml(slide);
  // reflow tetikle ki animasyon yeniden oynasın
  void stage.offsetWidth;
  stage.classList.add('fade-in');
}

function renderSlideHtml(slide) {
  switch (slide.type) {
    case 'duty':
      return renderDutySlide();
    case 'weather':
      return renderWeatherSlide();
    case 'healthTip':
      return `
        <div class="slide healthtip-slide">
          <div class="slide-icon">💊</div>
          <div class="slide-title">Sağlık İpucu</div>
          <div class="healthtip-text">${escapeHtml(slide.text)}</div>
        </div>`;
    case 'campaign':
      return `
        <div class="slide campaign-slide">
          <img src="${slide.campaign.imageDataUrl}" alt="${escapeHtml(slide.campaign.title || '')}" />
          ${slide.campaign.title ? `<div class="campaign-title">${escapeHtml(slide.campaign.title)}</div>` : ''}
        </div>`;
    default:
      return `
        <div class="slide empty-slide">
          <div class="slide-title">Eczane Ekranına Hoş Geldiniz</div>
          <div class="slide-sub">İçerik eklemek için sağ alttaki dişli simgesinden ayarlar paneline gidin.</div>
        </div>`;
  }
}

function renderDutySlide() {
  if (!dutyData) {
    return `<div class="slide duty-slide"><div class="slide-title">Nöbetçi Eczane</div><div class="slide-sub">Bilgi bulunamadı.</div></div>`;
  }
  if (dutyData.source === 'api' && dutyData.list) {
    const items = dutyData.list
      .map(
        (p) => `
        <div class="duty-card">
          <div class="duty-name">${escapeHtml(p.name)}</div>
          ${p.address ? `<div class="duty-detail">📍 ${escapeHtml(p.address)}</div>` : ''}
          ${p.phone ? `<div class="duty-detail">📞 ${escapeHtml(p.phone)}</div>` : ''}
        </div>`
      )
      .join('');
    return `
      <div class="slide duty-slide">
        <div class="slide-title">🟢 Bugün Nöbetçi Eczaneler</div>
        <div class="duty-list">${items}</div>
      </div>`;
  }
  return `
    <div class="slide duty-slide">
      <div class="slide-title">🟢 Bugün Nöbetçi Eczane</div>
      <div class="duty-card single">
        <div class="duty-name">${escapeHtml(dutyData.name || '')}</div>
        ${dutyData.address ? `<div class="duty-detail">📍 ${escapeHtml(dutyData.address)}</div>` : ''}
        ${dutyData.phone ? `<div class="duty-detail">📞 ${escapeHtml(dutyData.phone)}</div>` : ''}
      </div>
    </div>`;
}

function renderWeatherSlide() {
  if (!weatherData) return '';
  return `
    <div class="slide weather-slide">
      <div class="weather-icon">${weatherData.icon}</div>
      <div class="weather-temp">${weatherData.temp}°C</div>
      <div class="weather-label">${escapeHtml(weatherData.label)}</div>
      ${weatherData.cityLabel ? `<div class="weather-city">${escapeHtml(weatherData.cityLabel)}</div>` : ''}
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', initDisplay);
