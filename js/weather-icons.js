// Hava durumu için küçük, vektör (SVG) ikon seti — emoji YOK.
// Her fonksiyon tek bir <svg> döner; saatlik satır ve günlük listede kullanılır.
// Ana animasyonlu büyük ikonla aynı görsel dile (güneş sarı, bulut beyaz/gri, yağmur mavi) sadık kalır.

let _wiUid = 0;
function _wiNextId() {
  _wiUid += 1;
  return 'wim' + _wiUid;
}

function wiSun() {
  return `<svg viewBox="0 0 36 36" class="wi">
    <circle cx="18" cy="18" r="8" fill="#FFB020"/>
    <g stroke="#FFB020" stroke-width="2.4" stroke-linecap="round">
      <line x1="18" y1="2" x2="18" y2="6"/>
      <line x1="18" y1="30" x2="18" y2="34"/>
      <line x1="2" y1="18" x2="6" y2="18"/>
      <line x1="30" y1="18" x2="34" y2="18"/>
      <line x1="6.3" y1="6.3" x2="9.1" y2="9.1"/>
      <line x1="26.9" y1="26.9" x2="29.7" y2="29.7"/>
      <line x1="6.3" y1="29.7" x2="9.1" y2="26.9"/>
      <line x1="26.9" y1="9.1" x2="29.7" y2="6.3"/>
    </g>
  </svg>`;
}

function wiMoon() {
  const id = _wiNextId();
  return `<svg viewBox="0 0 36 36" class="wi">
    <mask id="${id}">
      <rect width="36" height="36" fill="#fff"/>
      <circle cx="24" cy="12" r="10" fill="#000"/>
    </mask>
    <circle cx="17" cy="18" r="13" fill="#C7D2E0" mask="url(#${id})"/>
  </svg>`;
}

function wiCloud(light) {
  const fill = light ? '#E3E8EF' : '#FFFFFF';
  return `<path d="M11,25 C6,25 3,21.5 3,18 C3,14.5 6,12 9,12.3 C10,8.5 13.5,6 17.5,6 C22.5,6 26.3,9.8 26.6,14.4 C30,14.8 33,17.6 33,21 C33,24.5 30,27 26.5,27 L11,27 Z" fill="${fill}" transform="translate(0,2) scale(0.92)"/>`;
}

function wiCloudSmall() {
  return `<svg viewBox="0 0 36 36" class="wi">${wiCloud()}</svg>`;
}

function wiSunCloud(isNight) {
  const id = _wiNextId();
  const celestial = isNight
    ? `<mask id="${id}"><rect width="36" height="36" fill="#fff"/><circle cx="24" cy="10" r="7" fill="#000"/></mask>
       <circle cx="18" cy="18" r="9" fill="#C7D2E0" mask="url(#${id})"/>`
    : '<circle cx="18" cy="18" r="9" fill="#FFB020"/>';
  return `<svg viewBox="0 0 36 36" class="wi">
    <g transform="translate(6,-4) scale(0.62)">${celestial}</g>
    ${wiCloud(true)}
  </svg>`;
}

function wiRain() {
  return `<svg viewBox="0 0 36 36" class="wi">
    ${wiCloud()}
    <g stroke="#4EA1FF" stroke-width="2.4" stroke-linecap="round">
      <line x1="12" y1="28" x2="10" y2="33"/>
      <line x1="18" y1="28" x2="16" y2="33"/>
      <line x1="24" y1="28" x2="22" y2="33"/>
    </g>
  </svg>`;
}

function wiSnow() {
  return `<svg viewBox="0 0 36 36" class="wi">
    ${wiCloud()}
    <g fill="#EAF3FF">
      <circle cx="11" cy="30" r="1.8"/>
      <circle cx="18" cy="32" r="1.8"/>
      <circle cx="25" cy="30" r="1.8"/>
    </g>
  </svg>`;
}

function wiFog() {
  return `<svg viewBox="0 0 36 36" class="wi">
    <g stroke="#AAB6C3" stroke-width="2.6" stroke-linecap="round">
      <line x1="5" y1="13" x2="31" y2="13"/>
      <line x1="3" y1="19" x2="33" y2="19"/>
      <line x1="6" y1="25" x2="30" y2="25"/>
    </g>
  </svg>`;
}

function wiThunder() {
  return `<svg viewBox="0 0 36 36" class="wi">
    ${wiCloud()}
    <path d="M19,20 L13,29 L18,29 L16,35 L24,24 L19,24 Z" fill="#FFD166"/>
  </svg>`;
}

const WEATHER_ICON_FN = {
  clear: (isNight) => (isNight ? wiMoon() : wiSun()),
  partly: (isNight) => wiSunCloud(isNight),
  cloudy: () => wiCloudSmall(),
  fog: () => wiFog(),
  rain: () => wiRain(),
  snow: () => wiSnow(),
  thunder: () => wiThunder(),
};

function weatherIconSvg(cond, isNight) {
  const fn = WEATHER_ICON_FN[cond] || WEATHER_ICON_FN.cloudy;
  return fn(isNight);
}
