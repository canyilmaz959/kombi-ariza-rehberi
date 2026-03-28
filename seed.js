// seed.js
// Kullanım: node seed.js
// Bu script ECA Citius Premix hata kodlarını MongoDB'ye yükler.

const mongoose = require("mongoose");
const Marka = require("./models/Marka");
const Model = require("./models/Model");
const Ariza = require("./models/Ariza");

require("dotenv").config({ path: "./.env" });

// ─── VERİLER ────────────────────────────────────────────────────────────────

const markaAdi = "DEMİRDÖKÜM"; // Marka adı (slug otomatik oluşturulacak)

const modelListesi = [
    "Vintomix P18/24-AS/1",
    "Vintomix P24/28-AS/1"
];
// Hata kodları (sayfa 28-29-30'dan alındı)
// Her kod tüm modeller için geçerlidir.
const hatalar = [
    {
        kod: "F.00",
        baslik: "Gidiş Suyu Sıcaklık Sensörü Kesintisi",
        aciklama: "Gidiş suyu NTC sensörü bağlı değil veya kablosu kopuk.",
        cozum: "Sensör soketini ve kablo demetini kontrol edin. Gerekirse sensörü değiştirin."
    },
    {
        kod: "F.01",
        baslik: "Dönüş Suyu Sıcaklık Sensörü Kesintisi",
        aciklama: "Dönüş suyu NTC sensörü bağlı değil veya kablosu kopuk.",
        cozum: "Sensör bağlantılarını kontrol edin. Teknik müdahale için yetkili servise haber verin."
    },
    {
        kod: "F.10 - F.11",
        baslik: "Sıcaklık Sensörü Kısa Devre",
        aciklama: "Gidiş veya dönüş NTC sensöründe kısa devre algılandı.",
        cozum: "Sensör kablo demetini kontrol edin. Arızalı sensörün değişimini yapın."
    },
    {
        kod: "F.20",
        baslik: "Emniyet Sıcaklık Sınırlayıcısı Kapatması",
        aciklama: "Cihaz aşırı ısındı. Gidiş suyu sıcaklığı emniyet limitini aştı.",
        cozum: "Tesisat vanalarının açık olduğundan emin olun. Sirkülasyon pompasını kontrol edin. Resetleyin."
    },
    {
        kod: "F.22",
        baslik: "Isıtma Sisteminde Yetersiz Su",
        aciklama: "Isıtma devresi su basıncı çok düşük (0.3 bar altı) veya kuru yanma riski.",
        cozum: "Doldurma musluğunu açarak su basıncını 1.5 bar seviyesine getirin. Kaçak kontrolü yapın."
    },
    {
        kod: "F.27",
        baslik: "Yalancı Alev Algılanması",
        aciklama: "Gaz valfi kapalıyken iyonizasyon sinyali mevcut.",
        cozum: "Elektronik kart veya iyonizasyon elektrodunu kontrol edin. Yetkili servisi arayın."
    },
    {
        kod: "F.28",
        baslik: "Ateşleme Sırasında Arıza",
        aciklama: "5 ateşleme denemesinden sonra alev oluşmadı.",
        cozum: "Gaz vanasının açık olduğunu kontrol edin. Gaz giriş basıncını ölçün. Reset tuşuna basın."
    },
    {
        kod: "F.29",
        baslik: "İşletim Sırasında Alev Sönmesi",
        aciklama: "Cihaz çalışırken gaz beslemesi kesildi veya iyonizasyon sinyali kararsız.",
        cozum: "Gaz beslemesini kontrol edin. İyonizasyon elektrodunu temizleyin veya değiştirin."
    },
    {
        kod: "F.32",
        baslik: "Fan Arızası",
        aciklama: "Fan hızı tolerans dışı veya fan bloke olmuş.",
        cozum: "Fan kablo bağlantılarını kontrol edin. Gerekirse fanı değiştirin."
    },
    {
        kod: "F.49",
        baslik: "eBUS Voltaj Hatası",
        aciklama: "Haberleşme hattında (eBUS) kısa devre veya aşırı yüklenme.",
        cozum: "Dış hava sensörü veya oda termostatı bağlantılarını kontrol edin."
    },
    {
        kod: "F.73 - F.74",
        baslik: "Su Basınç Sensörü Hatası",
        aciklama: "Su basınç sensörü bağlı değil, kısa devre yapmış veya sinyal aralığı dışında.",
        cozum: "Sensör kablo bağlantılarını kontrol edin. Gerekirse sensörü yenisiyle değiştirin."
    },
    {
        kod: "F.75",
        baslik: "Basınç Sensörü / Pompa Algılama Hatası",
        aciklama: "Pompa çalışmasına rağmen basınçta artış algılanmıyor.",
        cozum: "Pompa sıkışmış olabilir veya sistemde hava var. Pompa ve sensör kontrolü yapın."
    }
];

// ─── SLUG FONKSİYONU ─────────────────────────────────────────────────────────

function slugOlustur(str) {
    return str
        .toLowerCase()
        .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
        .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
        .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── ANA FONKSİYON ───────────────────────────────────────────────────────────

async function seed() {
    await mongoose.connect(process.env.DB_URI);
    console.log("MongoDB bağlantısı başarılı.");

    // 1. Marka oluştur veya bul
    let marka = await Marka.findOne({ slug: slugOlustur(markaAdi) });
    if (!marka) {
        marka = await Marka.create({
            name: markaAdi,
            slug: slugOlustur(markaAdi)
        });
        console.log(`Marka oluşturuldu: ${marka.name}`);
    } else {
        console.log(`Marka zaten var: ${marka.name}`);
    }

    // 2. Modelleri oluştur veya bul
    const modelMap = {}; // { modelAdı: modelDoc }

    for (const modelAdi of modelListesi) {
        const slug = slugOlustur(modelAdi);
        let model = await Model.findOne({ slug, marka: marka._id });
        if (!model) {
            model = await Model.create({ name: modelAdi, slug, marka: marka._id });
            console.log(`  Model oluşturuldu: ${model.name}`);
        }
        modelMap[modelAdi] = model;
    }

    // 3. Her model için hata kodlarını ekle
    let eklenen = 0;
    let atlanan = 0;

    for (const modelAdi of modelListesi) {
        const model = modelMap[modelAdi];

        for (const hata of hatalar) {
            const varMi = await Ariza.findOne({
                kod: hata.kod,
                marka: marka._id,
                model: model._id
            });

            if (!varMi) {
                await Ariza.create({
                    kod: hata.kod,
                    baslik: hata.baslik,
                    aciklama: hata.aciklama,
                    cozum: hata.cozum,
                    marka: marka._id,
                    model: model._id,
                    tarih: new Date()
                });
                eklenen++;
            } else {
                atlanan++;
            }
        }
    }

    console.log(`\nTamamlandı!`);
    console.log(`Eklenen arıza: ${eklenen}`);
    console.log(`Zaten var (atlandı): ${atlanan}`);
    console.log(`Toplam model: ${modelListesi.length}`);
    console.log(`Toplam hata kodu çeşidi: ${hatalar.length}`);

    await mongoose.disconnect();
    console.log("Bağlantı kapatıldı.");
}

seed().catch(err => {
    console.error("Seed hatası:", err);
    process.exit(1);
});