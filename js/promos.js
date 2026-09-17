// Yerleşik sağlık kampanyası slaytları: illüstrasyon + başlık + alt metin.
// İllüstrasyonlar var(--accent) / var(--accent2) kullanır, seçilen temaya göre otomatik renklenir.

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

function iconBadgeSvg(inner, gid) {
  return `
    <svg viewBox="0 0 200 200" class="promo-icon">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--accent)"/>
          <stop offset="100%" stop-color="var(--accent2)"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="url(#${gid})" opacity="0.16"/>
      <circle cx="100" cy="100" r="72" fill="url(#${gid})" opacity="0.28"/>
      ${inner}
    </svg>`;
}

const PROMO_ITEMS = [
  {
    id: 'grip-asisi',
    headline: 'Grip Aşısı Zamanı',
    sub: 'Mevsimsel aşılarınızla ilgili eczacınıza danışabilirsiniz.',
    layout: 'person',
    person: (gid) => personFigureSvg(gid),
    icon: (gid) => iconBadgeSvg(
      `<g transform="translate(100,102) rotate(-40)">
         <rect x="-8" y="-46" width="16" height="66" rx="6" fill="#fff"/>
         <rect x="-11" y="-56" width="22" height="14" rx="4" fill="var(--accent2)"/>
         <rect x="-4" y="20" width="8" height="26" fill="#fff"/>
         <line x1="0" y1="46" x2="0" y2="62" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
       </g>`, gid),
  },
  {
    id: 'baglisiklik',
    headline: 'Bağışıklığınızı Güçlendirin',
    sub: 'C vitamini ve çinko takviyeleri hakkında bizden bilgi alabilirsiniz.',
    layout: 'centered',
    icon: (gid) => iconBadgeSvg(
      `<g>
         <path transform="translate(100,104) scale(1.55)" d="M0,-30 C13,-20 18,-5 10,6 C18,3 28,8 30,20 C20,18 12,25 10,35 C3,27 -3,27 -10,35 C-12,25 -20,18 -30,20 C-28,8 -18,3 -10,6 C-18,-5 -13,-20 0,-30 Z" fill="#fff"/>
         <circle cx="145" cy="60" r="7" fill="#fff" opacity="0.85"/>
         <circle cx="60" cy="150" r="5" fill="#fff" opacity="0.7"/>
         <circle cx="150" cy="145" r="4" fill="#fff" opacity="0.6"/>
       </g>`, gid),
  },
  {
    id: 'cilt-bakimi',
    headline: 'Kış Cilt Bakımı',
    sub: 'Nemlendirici, dudak ve el bakım ürünlerimiz eczanemizde mevcuttur.',
    layout: 'centered',
    icon: (gid) => iconBadgeSvg(
      `<g transform="translate(100,108)">
         <rect x="-30" y="-40" width="60" height="80" rx="16" fill="#fff"/>
         <rect x="-14" y="-64" width="28" height="26" rx="6" fill="#fff" opacity="0.9"/>
         <rect x="-18" y="-70" width="36" height="10" rx="5" fill="var(--accent2)"/>
         <path d="M-14,-10 C-14,-24 14,-24 14,-10 C14,4 0,10 0,20 C0,10 -14,4 -14,-10 Z" fill="var(--accent)" opacity="0.85"/>
       </g>`, gid),
  },
  {
    id: 'hijyen',
    headline: 'Hijyen Seti',
    sub: 'El dezenfektanı, maske ve hijyen ürünü çeşitlerimiz mevcuttur.',
    layout: 'person',
    person: (gid) => personFigureSvg(gid),
    icon: (gid) => iconBadgeSvg(
      `<g transform="translate(100,106)">
         <rect x="-22" y="-30" width="44" height="66" rx="14" fill="#fff"/>
         <rect x="-10" y="-52" width="20" height="24" rx="4" fill="#fff"/>
         <rect x="-16" y="-58" width="32" height="10" rx="5" fill="var(--accent2)"/>
         <circle cx="34" cy="-38" r="6" fill="#fff" opacity="0.9"/>
         <circle cx="46" cy="-20" r="4" fill="#fff" opacity="0.7"/>
         <circle cx="38" cy="-2" r="5" fill="#fff" opacity="0.8"/>
       </g>`, gid),
  },
  {
    id: 'oksuruk-bogaz',
    headline: 'Öksürük & Boğaz Bakımı',
    sub: 'Pastil, şurup ve boğaz spreyi çeşitlerimiz eczanemizde mevcuttur.',
    layout: 'centered',
    icon: (gid) => iconBadgeSvg(
      `<g transform="translate(100,108)">
         <rect x="-24" y="-36" width="48" height="72" rx="10" fill="#fff"/>
         <rect x="-12" y="-54" width="24" height="20" rx="4" fill="var(--accent2)"/>
         <rect x="-16" y="-20" width="32" height="18" rx="3" fill="var(--accent)" opacity="0.4"/>
         <g transform="translate(46,30) rotate(-20)"><rect x="-26" y="-11" width="52" height="22" rx="11" fill="#fff" opacity="0.92"/></g>
       </g>`, gid),
  },
];

function getActivePromos(config) {
  return config.promos && config.promos.enabled ? PROMO_ITEMS : [];
}
