// Hazır sağlık bilgilendirme kartları (genel, tedavi/tanı içermeyen içerikler).
const BUILT_IN_HEALTH_TIPS = [
  'Günde en az 1,5–2 litre su içmeyi unutmayın.',
  'Mevsim geçişlerinde bağışıklığınızı desteklemek için dengeli beslenin.',
  'Ellerinizi düzenli olarak en az 20 saniye yıkayın.',
  'Kronik ilaç kullanıyorsanız, ilaçlarınızı düzenli saatlerde alın.',
  'Güneşli havalarda cildinizi korumak için SPF içeren ürünler kullanın.',
  'Yeterli ve düzenli uyku bağışıklık sisteminizi güçlendirir.',
  'İlaçlarınızın son kullanma tarihlerini düzenli kontrol edin.',
  'Reçetesiz ilaç kullanmadan önce eczacınıza danışın.',
  'Kış aylarında C vitamini açısından zengin besinler tüketin.',
  'Tansiyon ve şeker gibi kronik rahatsızlıklarınızı düzenli takip ettirin.',
  'Evde ilk yardım çantanızı güncel tutun.',
  'Alerjik reaksiyon belirtilerinde vakit kaybetmeden bir sağlık kuruluşuna başvurun.',
  'Çocuklarda ateş ölçümünü düzenli yapın, 38.5°C üzerinde doktorunuza danışın.',
  'Egzersiz öncesi ve sonrası bol su tüketmeyi ihmal etmeyin.',
  'İlaçlarınızı çocukların ulaşamayacağı yerlerde saklayın.',
  'Probiyotik takviyeleri hakkında eczacınızdan bilgi alabilirsiniz.',
  'Maske ve hijyen kurallarına salgın dönemlerinde özen gösterin.',
  'Düzenli check-up, birçok hastalığın erken teşhisinde önemlidir.',
  'Sırt ve bel ağrılarında uzun süre aynı pozisyonda kalmaktan kaçının.',
  'Eklem sağlığınız için düzenli hafif tempolu yürüyüş yapın.',
];

function getActiveHealthTips(config) {
  const tips = [];
  if (config.healthTips.useBuiltIn) tips.push(...BUILT_IN_HEALTH_TIPS);
  if (config.healthTips.customTips && config.healthTips.customTips.length) {
    tips.push(...config.healthTips.customTips);
  }
  return tips;
}
