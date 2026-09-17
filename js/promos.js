// Yerleşik sağlık kampanyası slaytları: renkli "afiş" kartı + ürün illüstrasyonları + başlık.
// Kart arka planı var(--accent)/var(--accent2) kullanır (seçilen temaya göre otomatik renklenir);
// ürünlerin kendi renkleri (turuncu şişe, mor kutu vb.) sabittir — gerçek ürün paketleri gibi göze çarpsın diye.

function personFigureSvg(gid) {
  return `
    <svg viewBox="0 0 220 260" class="promo-person">
      <defs>
        <linearGradient id="${gid}coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.95)"/>
          <stop offset="100%" stop-color="rgba(225,230,238,0.85)"/>
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="248" rx="70" ry="10" fill="rgba(0,0,0,0.25)"/>
      <path d="M45,255 C40,160 55,120 110,118 C165,120 180,160 175,255 Z" fill="url(#${gid}coat)"/>
      <path d="M85,130 L110,150 L135,130 L128,118 L92,118 Z" fill="var(--accent)"/>
      <circle cx="110" cy="70" r="46" fill="#f2e4d2"/>
      <path d="M64,66 C64,30 156,30 156,66 C156,40 64,40 64,66 Z" fill="#2c2420"/>
      <circle cx="93" cy="72" r="4.5" fill="#2c2420"/>
      <circle cx="127" cy="72" r="4.5" fill="#2c2420"/>
      <path d="M96,90 Q110,100 124,90" stroke="#8a5a3f" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M78,140 C55,148 45,170 48,195" stroke="url(#${gid}coat)" stroke-width="22" fill="none" stroke-linecap="round"/>
      <circle cx="47" cy="200" r="16" fill="var(--accent2)"/>
      <path d="M142,140 C165,148 172,168 168,190" stroke="url(#${gid}coat)" stroke-width="22" fill="none" stroke-linecap="round"/>
    </svg>`;
}

// Renkli, canlı "afiş" kartı: gradyan zemin + birden fazla ürün illüstrasyonu.
function posterSvg(gid, products) {
  return `
    <svg viewBox="0 0 300 300" class="promo-poster-svg">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--accent)"/>
          <stop offset="100%" stop-color="var(--accent2)"/>
        </linearGradient>
        <radialGradient id="${gid}s" cx="75%" cy="18%" r="60%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.35)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <rect x="5" y="5" width="290" height="290" rx="46" fill="url(#${gid})"/>
      <rect x="5" y="5" width="290" height="290" rx="46" fill="url(#${gid}s)"/>
      ${products}
    </svg>`;
}

// --- ürün parçaları (sabit, canlı renkler) ---
function pBottle(x, y, scale, capColor, bodyColor) {
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <rect x="-30" y="-44" width="60" height="92" rx="14" fill="${bodyColor}"/>
    <rect x="-14" y="-64" width="28" height="24" rx="5" fill="${bodyColor}"/>
    <rect x="-18" y="-70" width="36" height="12" rx="5" fill="${capColor}"/>
    <rect x="-22" y="-6" width="44" height="30" rx="4" fill="rgba(255,255,255,0.35)"/>
  </g>`;
}
function pJar(x, y, scale, lidColor, bodyColor) {
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <rect x="-32" y="-30" width="64" height="66" rx="18" fill="${bodyColor}"/>
    <rect x="-34" y="-44" width="68" height="20" rx="10" fill="${lidColor}"/>
    <circle cx="0" cy="4" r="16" fill="rgba(255,255,255,0.4)"/>
  </g>`;
}
function pCapsule(x, y, scale, rotate, colorA, colorB) {
  return `<g transform="translate(${x},${y}) rotate(${rotate}) scale(${scale})">
    <path d="M-30,0 a30,30 0 0 1 30,-30 h0 a30,30 0 0 1 30,30 a30,30 0 0 1 -30,30 h0 a30,30 0 0 1 -30,-30 z" fill="${colorA}"/>
    <path d="M0,-30 a30,30 0 0 1 30,30 a30,30 0 0 1 -30,30 z" fill="${colorB}"/>
  </g>`;
}
function pDroplet(x, y, scale, color) {
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <path d="M0,-34 C22,-8 34,10 34,26 C34,48 18,58 0,58 C-18,58 -34,48 -34,26 C-34,10 -22,-8 0,-34 Z" fill="${color}"/>
  </g>`;
}
function pSyringe(x, y, scale, rotate, color) {
  return `<g transform="translate(${x},${y}) rotate(${rotate}) scale(${scale})">
    <rect x="-10" y="-52" width="20" height="70" rx="6" fill="#fff"/>
    <rect x="-13" y="-64" width="26" height="16" rx="4" fill="${color}"/>
    <rect x="-5" y="18" width="10" height="28" fill="#fff"/>
    <line x1="0" y1="46" x2="0" y2="64" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}
function pLozenge(x, y, scale, rotate, color) {
  return `<g transform="translate(${x},${y}) rotate(${rotate}) scale(${scale})">
    <rect x="-30" y="-14" width="60" height="28" rx="14" fill="${color}"/>
  </g>`;
}
function pMask(x, y, scale, color) {
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <path d="M-34,-4 C-34,-20 34,-20 34,-4 C34,14 20,26 0,26 C-20,26 -34,14 -34,-4 Z" fill="${color}"/>
    <path d="M-34,-4 L-46,-10 M34,-4 L46,-10" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

const PROMO_ITEMS = [
  {
    id: 'grip-asisi',
    tag: 'MEVSİMSEL',
    headline: 'Grip Aşısı Zamanı',
    sub: 'Mevsimsel aşılarınızla ilgili eczacınıza danışabilirsiniz.',
    layout: 'person',
    person: (gid) => personFigureSvg(gid),
    icon: (gid) => posterSvg(gid, pSyringe(150, 150, 1.15, -35, '#FF6B5A')),
  },
  {
    id: 'baglisiklik',
    tag: 'BAĞIŞIKLIK',
    headline: 'Bağışıklığınızı Güçlendirin',
    sub: 'C vitamini ve çinko takviyeleri hakkında bizden bilgi alabilirsiniz.',
    layout: 'centered',
    icon: (gid) => posterSvg(
      gid,
      pBottle(105, 175, 1.05, '#FF9F0A', '#ffffff') +
      pCapsule(205, 105, 0.62, 25, '#FF9F0A', '#FFD166') +
      pCapsule(215, 175, 0.4, -10, '#34D399', '#ffffff')
    ),
  },
  {
    id: 'cilt-bakimi',
    tag: 'KIŞ BAKIMI',
    headline: 'Kış Cilt Bakımı',
    sub: 'Nemlendirici, dudak ve el bakım ürünlerimiz eczanemizde mevcuttur.',
    layout: 'centered',
    icon: (gid) => posterSvg(
      gid,
      pJar(110, 175, 1.05, '#4EA1FF', '#ffffff') +
      pDroplet(215, 110, 0.5, '#4EA1FF') +
      pBottle(210, 195, 0.55, '#B98AF0', '#ffffff')
    ),
  },
  {
    id: 'hijyen',
    tag: 'HİJYEN SETİ',
    headline: 'Hijyen Seti',
    sub: 'El dezenfektanı, maske ve hijyen ürünü çeşitlerimiz mevcuttur.',
    layout: 'person',
    person: (gid) => personFigureSvg(gid),
    icon: (gid) => posterSvg(gid, pBottle(140, 150, 1.05, '#4EA1FF', '#ffffff') + pMask(160, 90, 0.55, '#ffffff')),
  },
  {
    id: 'oksuruk-bogaz',
    tag: 'BOĞAZ BAKIMI',
    headline: 'Öksürük & Boğaz Bakımı',
    sub: 'Pastil, şurup ve boğaz spreyi çeşitlerimiz eczanemizde mevcuttur.',
    layout: 'centered',
    icon: (gid) => posterSvg(
      gid,
      pBottle(105, 170, 1.05, '#FF6B5A', '#ffffff') +
      pLozenge(210, 120, 0.85, -25, '#FFD166') +
      pLozenge(215, 175, 0.7, 20, '#FF6B5A')
    ),
  },
];

function getActivePromos(config) {
  return config.promos && config.promos.enabled ? PROMO_ITEMS : [];
}
