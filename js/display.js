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

  // 1) Ücretsiz, anahtarsız kaynak: İstanbul Eczacı Odası (kendi sunucu fonksiyonumuz üzerinden, CORS'suz)
  if (cfg.pharmacy.district) {
    try {
      const res = await fetch('/api/nobetci?ilce=' + encodeURIComponent(cfg.pharmacy.district));
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'ok' && Array.isArray(json.pharmacies) && json.pharmacies.length) {
          return {
            list: json.pharmacies.slice(0, 6).map((p) => ({
              name: p.name || 'Nöbetçi Eczane',
              address: p.address || '',
              phone: p.phone || '',
            })),
            source: 'auto',
          };
        }
      }
    } catch (e) {
      console.warn('Ücretsiz nöbetçi eczane kaynağı alınamadı.', e);
    }
  }

  // 2) Opsiyonel: kullanıcı NosyAPI anahtarı girdiyse (İstanbul dışı şehirler için)
  if (cfg.duty.apiKey && cfg.pharmacy.city) {
    try {
      const url = new URL('https://www.nosyapi.com/apiv2/service/pharmacies-on-duty');
      url.searchParams.set('city', cfg.pharmacy.city);
      if (cfg.pharmacy.district) url.searchParams.set('district', cfg.pharmacy.district);
      url.searchParams.set('apiKey', cfg.duty.apiKey);
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        if (list.length) {
          return {
            list: list.slice(0, 6).map((p) => ({
              name: p.pharmacyName || p.name || 'Nöbetçi Eczane',
              address: p.address || '',
              phone: p.phone || p.phoneNumber || '',
            })),
            source: 'api',
          };
        }
      }
    } catch (e) {
      console.warn('NosyAPI alınamadı.', e);
    }
  }

  // 3) Son çare: manuel girilen bilgi
  return manual.name ? manual : null;
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
  const duration = current.duration || config.slideDuration;
  runProgressBar(duration);
  slideTimer = setTimeout(() => {
    slideIndex = (slideIndex + 1) % slideQueue.length;
    renderCurrentSlide();
    scheduleNext();
  }, duration * 1000);
}

function runProgressBar(durationSeconds) {
  const fill = document.getElementById('progressFill');
  if (!fill) return;
  fill.style.transition = 'none';
  fill.style.width = '0%';
  void fill.offsetWidth;
  fill.style.transition = `width ${durationSeconds}s linear`;
  fill.style.width = '100%';
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
          <div class="icon-badge coral">💊</div>
          <div class="slide-title">Sağlık İpucu</div>
          <div class="healthtip-text">${escapeHtml(slide.text)}</div>
        </div>`;
    case 'campaign':
      return `
        <div class="slide campaign-slide">
          <div class="campaign-backdrop" style="background-image:url('${slide.campaign.imageDataUrl}')"></div>
          <img src="${slide.campaign.imageDataUrl}" alt="${escapeHtml(slide.campaign.title || '')}" />
          ${slide.campaign.title ? `<div class="campaign-title">${escapeHtml(slide.campaign.title)}</div>` : ''}
        </div>`;
    default:
      return `
        <div class="slide empty-slide">
          <div class="icon-badge teal">🏥</div>
          <div class="slide-title">Eczane Ekranına Hoş Geldiniz</div>
          <div class="slide-sub">İçerik eklemek için sağ alttaki dişli simgesinden ayarlar paneline gidin.</div>
        </div>`;
  }
}

function renderDutySlide() {
  if (!dutyData) {
    return `<div class="slide duty-slide"><div class="slide-title">Nöbetçi Eczane</div><div class="slide-sub">Bilgi bulunamadı.</div></div>`;
  }
  const badge = `<div class="duty-badge"><span class="pulse-dot"></span>BUGÜN NÖBETÇİ</div>`;
  if ((dutyData.source === 'api' || dutyData.source === 'auto') && dutyData.list) {
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
        ${badge}
        <div class="slide-title">Nöbetçi Eczaneler</div>
        <div class="duty-list">${items}</div>
      </div>`;
  }
  return `
    <div class="slide duty-slide">
      ${badge}
      <div class="slide-title">Nöbetçi Eczane</div>
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
      <div class="icon-badge sky">${weatherData.icon}</div>
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
