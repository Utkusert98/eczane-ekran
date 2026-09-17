// Eczane Ekranı - ana ekran (kiosk) mantığı

let config = loadConfig();
let dutyData = null; // { name, address, phone, source: 'api'|'manual' }
let weatherData = null; // { temp, code, label }
let slideQueue = [];
let slideIndex = 0;
let slideTimer = null;

// WMO hava kodları: etiket + animasyon grubu (cond), küçük tahmin ikonları için emoji
const WEATHER_CODES = {
  0: { label: 'Açık', cond: 'clear', mini: '☀️' },
  1: { label: 'Az bulutlu', cond: 'partly', mini: '🌤️' },
  2: { label: 'Parçalı bulutlu', cond: 'partly', mini: '⛅' },
  3: { label: 'Kapalı', cond: 'cloudy', mini: '☁️' },
  45: { label: 'Sisli', cond: 'fog', mini: '🌫️' },
  48: { label: 'Kırağılı sis', cond: 'fog', mini: '🌫️' },
  51: { label: 'Hafif çiseleme', cond: 'rain', mini: '🌦️' },
  53: { label: 'Çiseleme', cond: 'rain', mini: '🌦️' },
  55: { label: 'Yoğun çiseleme', cond: 'rain', mini: '🌦️' },
  61: { label: 'Hafif yağmurlu', cond: 'rain', mini: '🌧️' },
  63: { label: 'Yağmurlu', cond: 'rain', mini: '🌧️' },
  65: { label: 'Kuvvetli yağmur', cond: 'rain', mini: '🌧️' },
  71: { label: 'Hafif kar', cond: 'snow', mini: '🌨️' },
  73: { label: 'Kar yağışlı', cond: 'snow', mini: '❄️' },
  75: { label: 'Yoğun kar', cond: 'snow', mini: '❄️' },
  80: { label: 'Sağanak', cond: 'rain', mini: '🌦️' },
  81: { label: 'Sağanak', cond: 'rain', mini: '🌧️' },
  82: { label: 'Kuvvetli sağanak', cond: 'rain', mini: '🌧️' },
  85: { label: 'Kar sağanağı', cond: 'snow', mini: '🌨️' },
  86: { label: 'Yoğun kar sağanağı', cond: 'snow', mini: '❄️' },
  95: { label: 'Gök gürültülü', cond: 'thunder', mini: '⛈️' },
  96: { label: 'Dolulu fırtına', cond: 'thunder', mini: '⛈️' },
  99: { label: 'Kuvvetli dolulu fırtına', cond: 'thunder', mini: '⛈️' },
};

const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function initDisplay() {
  fixMobileViewport();
  applyTheme(config);
  applyPharmacyBranding();
  startClock();
  refreshDynamicData();
  setInterval(refreshDynamicData, 20 * 60 * 1000); // 20 dakikada bir yenile
  buildSlideQueue();
  rotateSlides();
  setInterval(() => {
    // ayarlar başka sekmede değiştiyse ekranı canlı güncelle
    config = loadConfig();
    applyTheme(config);
  }, 5000);
}

function fixMobileViewport() {
  // iOS/Android'de adres çubuğu görünüp kaybolunca 100vh oynar; gerçek yüksekliği sabitle.
  const setVh = () => {
    document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
  };
  setVh();
  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh);
  // Kaydırma/bounce/pinch-zoom jestlerini tamamen engelle (kiosk ekranı).
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
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
      let url = '/api/nobetci?ilce=' + encodeURIComponent(cfg.pharmacy.district);
      if (cfg.pharmacy.semt) url += '&semt=' + encodeURIComponent(cfg.pharmacy.semt);
      const res = await fetch(url);
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
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&forecast_days=6&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Hava durumu alınamadı: ' + res.status);
    const json = await res.json();
    const code = json.current?.weather_code ?? 0;
    const meta = WEATHER_CODES[code] || { label: 'Bilinmiyor', cond: 'cloudy', mini: '🌡️' };

    const days = (json.daily?.time || []).map((dateStr, i) => {
      const dCode = json.daily.weather_code[i];
      const dMeta = WEATHER_CODES[dCode] || { mini: '🌡️' };
      const d = new Date(dateStr);
      return {
        label: i === 0 ? 'Bugün' : DAY_NAMES[d.getDay()],
        mini: dMeta.mini,
        max: Math.round(json.daily.temperature_2m_max[i]),
        min: Math.round(json.daily.temperature_2m_min[i]),
      };
    });

    return {
      temp: Math.round(json.current?.temperature_2m ?? 0),
      code,
      label: meta.label,
      cond: meta.cond,
      humidity: Math.round(json.current?.relative_humidity_2m ?? 0),
      feelsLike: Math.round(json.current?.apparent_temperature ?? 0),
      cityLabel: cfg.weather.cityLabel || '',
      days,
    };
  } catch (e) {
    console.warn('Hava durumu alınamadı.', e);
    return null;
  }
}

function buildSlideQueue() {
  const slides = [];

  slides.push({ type: 'brand', duration: config.slideDuration });

  if (config.duty.enabled && dutyData) {
    if (dutyData.list && dutyData.list.length) {
      const perPage = 3;
      const chunks = [];
      for (let i = 0; i < dutyData.list.length; i += perPage) chunks.push(dutyData.list.slice(i, i + perPage));
      chunks.forEach((chunk, i) => {
        slides.push({
          type: 'duty',
          duration: config.slideDuration,
          dutyChunk: chunk,
          page: i + 1,
          totalPages: chunks.length,
        });
      });
    } else {
      slides.push({ type: 'duty', duration: config.slideDuration });
    }
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

  getActivePromos(config).forEach((p) => {
    slides.push({ type: 'promo', promo: p, duration: config.slideDuration });
  });

  config.campaigns.forEach((c) => {
    slides.push({ type: 'campaign', campaign: c, duration: c.duration || config.slideDuration });
  });

  if (!slides.length) {
    slides.push({ type: 'empty', duration: config.slideDuration });
  }

  slideQueue = slides;
  if (slideIndex >= slideQueue.length) slideIndex = 0;
  renderDots();
}

function rotateSlides() {
  renderCurrentSlide();
  scheduleNext();
}

function scheduleNext() {
  clearTimeout(slideTimer);
  const current = slideQueue[slideIndex] || { duration: config.slideDuration };
  const duration = current.duration || config.slideDuration;
  runDotProgress(duration);
  slideTimer = setTimeout(() => {
    slideIndex = (slideIndex + 1) % slideQueue.length;
    renderCurrentSlide();
    scheduleNext();
  }, duration * 1000);
}

function renderDots() {
  const row = document.getElementById('dotsRow');
  if (!row) return;
  row.innerHTML = slideQueue.map(() => `<span class="dot"><span class="dot-fill"></span></span>`).join('');
}

function runDotProgress(durationSeconds) {
  const row = document.getElementById('dotsRow');
  if (!row) return;
  const dots = row.querySelectorAll('.dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === slideIndex);
    const fill = dot.querySelector('.dot-fill');
    if (i === slideIndex) {
      fill.style.transition = 'none';
      fill.style.width = '0%';
      void fill.offsetWidth;
      fill.style.transition = `width ${durationSeconds}s linear`;
      fill.style.width = '100%';
    } else {
      fill.style.transition = 'none';
      fill.style.width = i < slideIndex ? '100%' : '0%';
    }
  });
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
    case 'brand':
      return renderBrandSlide();
    case 'duty':
      return renderDutySlide(slide);
    case 'weather':
      return renderWeatherSlide();
    case 'healthTip':
      return `
        <div class="slide healthtip-slide">
          <div class="icon-wrap"><div class="icon-badge">💊</div></div>
          <div class="slide-title">Sağlık İpucu</div>
          <div class="healthtip-text">${escapeHtml(slide.text)}</div>
        </div>`;
    case 'promo':
      return renderPromoSlide(slide.promo);
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
          <div class="icon-wrap"><div class="icon-badge">🏥</div></div>
          <div class="slide-title">Eczane Ekranına Hoş Geldiniz</div>
          <div class="slide-sub">İçerik eklemek için sağ alttaki dişli simgesinden ayarlar paneline gidin.</div>
        </div>`;
  }
}

function renderPromoSlide(promo) {
  const gid = 'g_' + promo.id;
  const footer = renderPromoFooter();
  if (promo.layout === 'person') {
    return `
      <div class="slide promo-slide promo-person-layout">
        <div class="promo-visual">
          ${promo.person(gid)}
          <div class="promo-icon-float">${promo.icon(gid + '_i')}</div>
        </div>
        <div class="promo-text">
          <div class="promo-headline">${escapeHtml(promo.headline)}</div>
          <div class="promo-sub">${escapeHtml(promo.sub)}</div>
        </div>
        ${footer}
      </div>`;
  }
  return `
    <div class="slide promo-slide">
      <div class="promo-icon-wrap">${promo.icon(gid)}</div>
      <div class="promo-headline">${escapeHtml(promo.headline)}</div>
      <div class="promo-sub">${escapeHtml(promo.sub)}</div>
      ${footer}
    </div>`;
}

function renderPromoFooter() {
  const name = config.pharmacy.name || '';
  const pharmacist = config.pharmacy.pharmacistName || '';
  const phone = config.pharmacy.phone || '';
  if (!name && !pharmacist && !phone) return '';
  return `
    <div class="promo-footer">
      ${name ? `<span class="pf-name">${escapeHtml(name)}</span>` : ''}
      ${pharmacist ? `<span class="pf-dot">•</span><span>${escapeHtml(pharmacist)}</span>` : ''}
      ${phone ? `<span class="pf-dot">•</span><span class="pf-phone">📞 ${escapeHtml(phone)}</span>` : ''}
    </div>`;
}

function renderBrandSlide() {
  if (config.pharmacy.logoDataUrl) {
    return `
      <div class="slide brand-slide">
        <img class="brand-logo-large" src="${config.pharmacy.logoDataUrl}" alt="${escapeHtml(config.pharmacy.name || '')}" />
        <div class="slide-sub">Sağlığınız için buradayız</div>
      </div>`;
  }
  return `
    <div class="slide brand-slide">
      <div class="icon-wrap"><div class="icon-badge">🏪</div></div>
      <div class="slide-title">${escapeHtml(config.pharmacy.name || 'Eczanemiz')}</div>
      <div class="slide-sub">Sağlığınız için buradayız</div>
    </div>`;
}

function renderDutySlide(slide) {
  if (!dutyData) {
    return `<div class="slide duty-slide"><div class="slide-title">Nöbetçi Eczane</div><div class="slide-sub">Bilgi bulunamadı.</div></div>`;
  }
  const badge = `<div class="duty-badge"><span class="pulse-dot"></span>BUGÜN NÖBETÇİ</div>`;
  if (slide && slide.dutyChunk) {
    const items = slide.dutyChunk
      .map(
        (p) => `
        <div class="duty-card">
          <div class="duty-name">${escapeHtml(p.name)}</div>
          ${p.address ? `<div class="duty-detail">📍 ${escapeHtml(p.address)}</div>` : ''}
          ${p.phone ? `<div class="duty-detail">📞 ${escapeHtml(p.phone)}</div>` : ''}
        </div>`
      )
      .join('');
    const pager = slide.totalPages > 1
      ? `<div class="duty-pager">${slide.page} / ${slide.totalPages}</div>`
      : '';
    return `
      <div class="slide duty-slide">
        ${badge}
        <div class="slide-title">Nöbetçi Eczaneler</div>
        <div class="duty-list">${items}</div>
        ${pager}
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
  const days = weatherData.days || [];
  return `
    <div class="slide weather-slide">
      ${renderAnimatedWeatherIcon(weatherData.cond)}
      <div class="weather-temp">${weatherData.temp}°</div>
      <div class="weather-label">${escapeHtml(weatherData.label)}${weatherData.cityLabel ? ' · ' + escapeHtml(weatherData.cityLabel) : ''}</div>
      <div class="weather-stats">
        <div class="w-stat"><span class="w-stat-label">Hissedilen</span><span class="w-stat-value">${weatherData.feelsLike}°</span></div>
        <div class="w-stat-sep"></div>
        <div class="w-stat"><span class="w-stat-label">Nem</span><span class="w-stat-value">%${weatherData.humidity}</span></div>
      </div>
      ${
        days.length
          ? `<div class="forecast-strip">${days
              .map(
                (d) => `
              <div class="forecast-day">
                <div class="fd-label">${escapeHtml(d.label)}</div>
                <div class="fd-icon">${d.mini}</div>
                <div class="fd-max">${d.max}°</div>
                <div class="fd-min">${d.min}°</div>
              </div>`
              )
              .join('')}</div>`
          : ''
      }
    </div>`;
}

function renderAnimatedWeatherIcon(cond) {
  const drops = Array.from({ length: 6 }, () => '<span class="drop"></span>').join('');
  const flakes = Array.from({ length: 8 }, () => '<span class="flake"></span>').join('');
  return `
    <div class="weather-icon cond-${cond || 'cloudy'}">
      <div class="w-sun"><div class="w-sun-core"></div></div>
      <div class="w-cloud w-cloud1"></div>
      <div class="w-cloud w-cloud2"></div>
      <div class="w-fog"><span></span><span></span><span></span></div>
      <div class="w-bolt">⚡</div>
      <div class="w-rain">${drops}</div>
      <div class="w-snow">${flakes}</div>
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', initDisplay);
