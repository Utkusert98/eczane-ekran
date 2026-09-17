// Eczane Ekranı - ana ekran (kiosk) mantığı

let config = loadConfig();
let dutyData = null; // { name, address, phone, source: 'api'|'manual' }
let weatherData = null; // { temp, code, label }
let slideQueue = [];
let slideIndex = 0;
let slideTimer = null;

// WMO hava kodları: etiket + animasyon/ikon grubu (cond) — emoji kullanılmaz, weather-icons.js'teki vektör setiyle çizilir
const WEATHER_CODES = {
  0: { label: 'Açık', cond: 'clear' },
  1: { label: 'Az bulutlu', cond: 'partly' },
  2: { label: 'Parçalı bulutlu', cond: 'partly' },
  3: { label: 'Kapalı', cond: 'cloudy' },
  45: { label: 'Sisli', cond: 'fog' },
  48: { label: 'Kırağılı sis', cond: 'fog' },
  51: { label: 'Hafif çiseleme', cond: 'rain' },
  53: { label: 'Çiseleme', cond: 'rain' },
  55: { label: 'Yoğun çiseleme', cond: 'rain' },
  61: { label: 'Hafif yağmurlu', cond: 'rain' },
  63: { label: 'Yağmurlu', cond: 'rain' },
  65: { label: 'Kuvvetli yağmur', cond: 'rain' },
  71: { label: 'Hafif kar', cond: 'snow' },
  73: { label: 'Kar yağışlı', cond: 'snow' },
  75: { label: 'Yoğun kar', cond: 'snow' },
  80: { label: 'Sağanak', cond: 'rain' },
  81: { label: 'Sağanak', cond: 'rain' },
  82: { label: 'Kuvvetli sağanak', cond: 'rain' },
  85: { label: 'Kar sağanağı', cond: 'snow' },
  86: { label: 'Yoğun kar sağanağı', cond: 'snow' },
  95: { label: 'Gök gürültülü', cond: 'thunder' },
  96: { label: 'Dolulu fırtına', cond: 'thunder' },
  99: { label: 'Kuvvetli dolulu fırtına', cond: 'thunder' },
};

const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function initDisplay() {
  document.getElementById('settingsFab').innerHTML = iconGear();
  fixMobileViewport();
  applyTheme(config);
  applyPharmacyBranding();
  startClock();
  refreshDynamicData();
  setInterval(refreshDynamicData, 20 * 60 * 1000); // 20 dakikada bir yenile
  buildSlideQueue();
  rotateSlides();
  initSwipeNav();
  setInterval(() => {
    // ayarlar başka sekmede değiştiyse ekranı canlı güncelle
    config = loadConfig();
    applyTheme(config);
  }, 5000);
}

function goToSlide(i) {
  const n = slideQueue.length;
  if (!n) return;
  slideIndex = ((i % n) + n) % n;
  clearTimeout(slideTimer);
  renderCurrentSlide();
  scheduleNext();
}

function initSwipeNav() {
  const el = document.querySelector('.screen');
  let startX = 0;
  let startY = 0;
  let tracking = false;

  el.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    },
    { passive: true }
  );

  el.addEventListener(
    'touchend',
    (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        goToSlide(slideIndex + (dx < 0 ? 1 : -1));
      }
    },
    { passive: true }
  );

  // fare/dokunmatik olmayan cihazlarda test ve kolaylık için: ekranın sol/sağ üçte biri de geçiş yapar
  el.addEventListener('click', (e) => {
    if (e.target.closest('.settings-fab')) return;
    const w = window.innerWidth;
    if (e.clientX < w * 0.28) goToSlide(slideIndex - 1);
    else if (e.clientX > w * 0.72) goToSlide(slideIndex + 1);
  });
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
      `&current=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature,is_day` +
      `&hourly=temperature_2m,weather_code,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max` +
      `&forecast_days=7&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Hava durumu alınamadı: ' + res.status);
    const json = await res.json();
    const code = json.current?.weather_code ?? 0;
    const meta = WEATHER_CODES[code] || { label: 'Bilinmiyor', cond: 'cloudy' };
    const isDayNow = (json.current?.is_day ?? 1) === 1;

    const days = (json.daily?.time || []).map((dateStr, i) => {
      const dCode = json.daily.weather_code[i];
      const dMeta = WEATHER_CODES[dCode] || { cond: 'cloudy' };
      const d = new Date(dateStr);
      return {
        label: i === 0 ? 'Bugün' : DAY_NAMES[d.getDay()],
        cond: dMeta.cond || 'cloudy',
        max: Math.round(json.daily.temperature_2m_max[i]),
        min: Math.round(json.daily.temperature_2m_min[i]),
      };
    });

    // saatlik: şimdiden itibaren sonraki 6 saat
    const hourlyTimes = json.hourly?.time || [];
    const now = new Date();
    let startIdx = hourlyTimes.findIndex((t) => new Date(t) >= now);
    if (startIdx < 0) startIdx = 0;
    const hours = [];
    for (let i = 0; i < 6 && startIdx + i < hourlyTimes.length; i++) {
      const idx = startIdx + i;
      const hCode = json.hourly.weather_code[idx];
      const hMeta = WEATHER_CODES[hCode] || { cond: 'cloudy' };
      const d = new Date(hourlyTimes[idx]);
      hours.push({
        label: i === 0 ? 'Şu An' : d.getHours() + ':00',
        cond: hMeta.cond || 'cloudy',
        isNight: (json.hourly.is_day?.[idx] ?? 1) === 0,
        temp: Math.round(json.hourly.temperature_2m[idx]),
      });
    }

    const windMax = Math.round(json.daily?.wind_speed_10m_max?.[0] ?? 0);
    const humidity = Math.round(json.current?.relative_humidity_2m ?? 0);
    const condWord = {
      clear: 'açık', partly: 'parçalı bulutlu', cloudy: 'kapalı',
      fog: 'sisli', rain: 'yağmurlu', snow: 'karlı', thunder: 'fırtınalı',
    }[meta.cond] || 'değişken';

    return {
      temp: Math.round(json.current?.temperature_2m ?? 0),
      code,
      label: meta.label,
      cond: meta.cond,
      isNight: !isDayNow,
      humidity,
      feelsLike: Math.round(json.current?.apparent_temperature ?? 0),
      windMax,
      summary: `Bugün ${condWord} hava bekleniyor. ${windMax} km/sa hızına varan rüzgarlar, nem %${humidity}.`,
      cityLabel: cfg.weather.cityLabel || '',
      hours,
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
          <div class="icon-wrap"><div class="icon-badge">${iconPill()}</div></div>
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
          <div class="icon-wrap"><div class="icon-badge">${iconCross()}</div></div>
          <div class="slide-title">Eczane Ekranına Hoş Geldiniz</div>
          <div class="slide-sub">İçerik eklemek için sağ alttaki dişli simgesinden ayarlar paneline gidin.</div>
        </div>`;
  }
}

function renderPromoSlide(promo) {
  const gid = 'g_' + promo.id;
  const footer = renderPromoFooter();
  const tag = promo.tag ? `<div class="promo-tag">${escapeHtml(promo.tag)}</div>` : '';
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
      <div class="promo-icon-wrap">${tag}${promo.icon(gid)}</div>
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
      ${phone ? `<span class="pf-dot">•</span><span class="pf-phone">${iconPhone()} ${escapeHtml(phone)}</span>` : ''}
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
      <div class="icon-wrap"><div class="icon-badge">${iconStore()}</div></div>
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
          ${p.address ? `<div class="duty-detail">${iconPin()} ${escapeHtml(p.address)}</div>` : ''}
          ${p.phone ? `<div class="duty-detail">${iconPhone()} ${escapeHtml(p.phone)}</div>` : ''}
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
        ${dutyData.address ? `<div class="duty-detail">${iconPin()} ${escapeHtml(dutyData.address)}</div>` : ''}
        ${dutyData.phone ? `<div class="duty-detail">${iconPhone()} ${escapeHtml(dutyData.phone)}</div>` : ''}
      </div>
    </div>`;
}

function renderWeatherSlide() {
  if (!weatherData) return '';
  const days = weatherData.days || [];
  const hours = weatherData.hours || [];

  const todayMax = days[0] ? days[0].max : weatherData.temp;
  const todayMin = days[0] ? days[0].min : weatherData.temp;

  const weekMax = days.length ? Math.max(...days.map((d) => d.max)) : todayMax;
  const weekMin = days.length ? Math.min(...days.map((d) => d.min)) : todayMin;
  const span = Math.max(1, weekMax - weekMin);

  const hourlyHtml = hours.length
    ? `<div class="ws-hourly">${hours
        .map(
          (h) => `
        <div class="wh-item">
          <div class="wh-time">${escapeHtml(h.label)}</div>
          <div class="wh-icon">${weatherIconSvg(h.cond, h.isNight)}</div>
          <div class="wh-temp">${h.temp}°</div>
        </div>`
        )
        .join('')}</div>`
    : '';

  const dailyHtml = days.length
    ? `<div class="ws-daily">${days
        .map((d) => {
          const left = ((d.min - weekMin) / span) * 100;
          const width = Math.max(8, ((d.max - d.min) / span) * 100);
          return `
          <div class="wd-row">
            <span class="wd-day">${escapeHtml(d.label)}</span>
            <span class="wd-icon">${weatherIconSvg(d.cond, false)}</span>
            <span class="wd-min">${d.min}°</span>
            <div class="wd-track"><div class="wd-fill cond-fill-${d.cond}" style="left:${left}%;width:${width}%"></div></div>
            <span class="wd-max">${d.max}°</span>
          </div>`;
        })
        .join('')}</div>`
    : '';

  return `
    <div class="slide weather-slide-v2">
      <div class="ws-header">
        ${renderAnimatedWeatherIcon(weatherData.cond, weatherData.isNight)}
        <div class="ws-temp">${weatherData.temp}°</div>
        <div class="ws-cond">${escapeHtml(weatherData.label)}${weatherData.cityLabel ? ' · ' + escapeHtml(weatherData.cityLabel) : ''}</div>
        <div class="ws-hilo">Y:${todayMax}°  D:${todayMin}°</div>
      </div>
      <div class="ws-summary">${escapeHtml(weatherData.summary || '')}</div>
      ${hourlyHtml}
      ${dailyHtml}
    </div>`;
}

function renderAnimatedWeatherIcon(cond, isNight) {
  const drops = Array.from({ length: 6 }, () => '<span class="drop"></span>').join('');
  const flakes = Array.from({ length: 8 }, () => '<span class="flake"></span>').join('');
  const nightCls = isNight ? ' is-night' : '';
  return `
    <div class="weather-icon cond-${cond || 'cloudy'}${nightCls}">
      <div class="w-sun"><div class="w-sun-core"></div></div>
      <div class="w-moon"></div>
      <div class="w-cloud w-cloud1"></div>
      <div class="w-cloud w-cloud2"></div>
      <div class="w-fog"><span></span><span></span><span></span></div>
      <div class="w-bolt"><svg viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="#FFD166"/></svg></div>
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
