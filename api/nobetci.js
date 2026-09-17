// İstanbul Eczacı Odası'nın herkese açık nöbetçi eczane verisini sunucu tarafında
// çekip tarayıcıya CORS engeline takılmadan iletir. Kullanıcıdan API anahtarı istemez.

const SOURCE_PAGE = 'https://www.istanbuleczaciodasi.org.tr/nobetci-eczane/';
const SOURCE_ENDPOINT = 'https://www.istanbuleczaciodasi.org.tr/nobetci-eczane/index.php';
const UA = 'Mozilla/5.0 (compatible; EczaneEkraniBot/1.0; +https://eczane-ekran.vercel.app)';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const ilce = (req.query.ilce || 'Kadıköy').toString();

  try {
    const pageRes = await fetch(SOURCE_PAGE, { headers: { 'User-Agent': UA } });
    const html = await pageRes.text();
    const tokenMatch = html.match(/id="h"\s+value="([a-f0-9]+)"/i);
    if (!tokenMatch) throw new Error('Kaynak sayfadan token alınamadı');

    const body = new URLSearchParams({ jx: '1', islem: 'get_eczane_markers', h: tokenMatch[1] });
    const dataRes = await fetch(SOURCE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
      },
      body: body.toString(),
    });
    const json = await dataRes.json();
    if (json.error !== 0 || !Array.isArray(json.eczaneler)) {
      throw new Error('Kaynak beklenmeyen yanıt döndürdü');
    }

    const pharmacies = json.eczaneler
      .filter((e) => normalize(e.ilce) === normalize(ilce))
      .map((e) => ({
        name: e.eczane_ad || '',
        phone: formatPhone(e.eczane_tel),
        address: [e.mahalle, e.cadde_sokak, e.bina_kapi].filter(Boolean).join(' '),
        directions: e.tarif || '',
        semt: e.semt || '',
        lat: e.lat ? Number(e.lat) : null,
        lng: e.lng ? Number(e.lng) : null,
      }));

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json({
      status: 'ok',
      ilce,
      source: 'İstanbul Eczacı Odası',
      updatedAt: new Date().toISOString(),
      pharmacies,
    });
  } catch (err) {
    res.status(200).json({ status: 'error', message: err.message, pharmacies: [] });
  }
};

function formatPhone(tel) {
  const s = String(tel || '').replace(/\D/g, '');
  if (s.length === 10) return `0${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 8)} ${s.slice(8, 10)}`;
  return s;
}

function normalize(str) {
  return String(str || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}
