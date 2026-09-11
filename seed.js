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
    "Isofast HK 35 (Hermetik)",
    "Isofast C 28 (Hermetik)",
    "Isofast C 35 (Hermetik)"
];

// Hata kodları (sayfa 28-29-30'dan alındı)
// Her kod tüm modeller için geçerlidir.
const hatalar = [
    {
        kod: "F01, F04",
        baslik: "Ateşleme ve İyonizasyon Arızası",
        aciklama: "Kombinin ateşleme işlemini gerçekleştiremediğini veya alevin algılanmadığını belirten hata kodudur.",
        cozum: "Dairenizdeki gaz akışını kontrol edin ve gaz vanalarının açık olduğundan emin olun. Kombiyi resetlemeyi deneyin; sorun devam ederse iyonizasyon elektrodu veya gaz valfi kontrolü için servis çağırılmalıdır."
    },
    {
        kod: "F02",
        baslik: "Hava Akış Sorunu (Prosestat)",
        aciklama: "Atık gaz tahliye sisteminde hava akışının sağlanamadığını gösterir. Genellikle prosestat arızasından kaynaklanır.",
        cozum: "Kombinin baca bağlantılarını kontrol edin. Cihazı resetleyin. Sorun düzelmezse fan veya prosestat değişimi gerekebilir."
    },
    {
        kod: "F03",
        baslik: "Tekrarlayan Hava Akış Hatası",
        aciklama: "Hava akış sorununun kısa süre içerisinde (2-3 saat) tekrarladığını ve sistemin kendini emniyete aldığını belirtir.",
        cozum: "Prosestat veya anakart üzerinde teknik bir arıza olabilir. Kalıcı çözüm için yetkili servis müdahalesi gerekmektedir."
    },
    {
        kod: "F05",
        baslik: "Aşırı Isınma Emniyet Kilidi",
        aciklama: "Kombi içindeki su sıcaklığının tehlikeli seviyeye ulaşması sonucu limit sensörünün devreyi kesmesidir.",
        cozum: "Tesisat vanalarının açık olduğunu kontrol edin. Cihazın soğumasını bekleyip resetleyin. Arıza tekrarlarsa pompa veya ana eşanjör kontrol edilmelidir."
    },
    {
        kod: "F06",
        baslik: "Kalorifer Devresi Sensör Arızası",
        aciklama: "Isıtma sistemindeki peteklerin ısınmasını sağlayan NTC sensöründe hata algılandığını bildirir.",
        cozum: "Sensör veya kablo bağlantılarında sorun olabilir. Peteklerin sağlıklı ısınması için sensör değişimi gerekebilir."
    },
    {
        kod: "F07, F09",
        baslik: "Sıcak Kullanım Suyu Sensör Hatası",
        aciklama: "Sıcak su devresinde görev yapan sensörün arızalı olduğunu, bu nedenle kombiden sıcak su alınamadığını belirtir.",
        cozum: "Musluklardan sıcak su akmıyorsa NTC sensörü arızalanmış olabilir. Teknik servis desteği ile parça değişimi yapılmalıdır."
    },
    {
        kod: "F08",
        baslik: "Çoklu Kalorifer Sensör Arızası",
        aciklama: "Birden fazla kalorifer sensöründe veya sensör grubunda tutarsızlık algılandığını ifade eder.",
        cozum: "Hangi sensörün hatalı olduğunun tespiti için uzman teknisyen müdahalesi şarttır."
    },
    {
        kod: "F10",
        baslik: "Dönüş Suyu Sıcaklık Sensör Hatası",
        aciklama: "Tesisattan kombiye dönen suyun sıcaklığını ölçen sensörün görevini yapamadığını belirtir.",
        cozum: "Isınma konforunu etkileyen bir durumdur; sensör ve kablo grubunun kontrolü için servis çağırılmalıdır."
    },
    {
        kod: "F11, F13",
        baslik: "Anakart Haberleşme ve Devre Arızası",
        aciklama: "Kombinin ana kartından (beyninden) sinyal alınamadığını veya kart üzerinde donanımsal sorun olduğunu gösterir.",
        cozum: "Cihazı birkaç kez resetlemeyi deneyin. Eğer düzelme olmazsa anakart tamiri veya değişimi için teknik ekip desteği alın."
    },
    {
        kod: "F12",
        baslik: "Ekran Kartı Sinyal Hatası",
        aciklama: "Kullanıcı arayüzü olan ekran kartından sinyal alınamadığı durumlarda beliren uyarı kodudur.",
        cozum: "Ekran kartının onarılması veya yenisiyle değiştirilmesi gerekebilir."
    },
    {
        kod: "F14",
        baslik: "Yüksek Sıcaklık Uyarısı (95°C Üstü)",
        aciklama: "Tesisat su sıcaklığının 95 dereceyi aşarak kritik seviyeye ulaştığını bildiren emniyet uyarısıdır.",
        cozum: "Cihaza müdahale etmeden bir süre bekleyin ve soğuduktan sonra resetleyin. Derece kendiliğinden yükseliyorsa servise başvurun."
    },
    {
        kod: "F15",
        baslik: "Step Motor (Üç Yollu Vana) Hatası",
        aciklama: "Sıcak su ve kalorifer geçişini yöneten step motorun veya üç yollu vana mekanizmasının arızalı olduğunu belirtir.",
        cozum: "Cihaz sıcak suyu peteklere kaçırabilir. Step motor değişimi için uzman yardımı alınmalıdır."
    },
    {
        kod: "F16",
        baslik: "İyonizasyon (Sönmeyen Alev) Arızası",
        aciklama: "Brülör sönmesine rağmen ateşleme sinyalinin devam ettiğini bildiren güvenlik hatasıdır.",
        cozum: "İyonizasyon elektrodu veya anakart kaynaklı olabilir; güvenlik için servis müdahalesi gereklidir."
    },
    {
        kod: "F17",
        baslik: "Düşük Voltaj Hatası (170V Altı)",
        aciklama: "Şebeke geriliminin 170 Voltun altına düşerek cihazın sağlıklı çalışmasını engellediği durumdur.",
        cozum: "Voltaj normale dönene kadar bekleyin. Sorun sürekli tekrarlanıyorsa anakartı korumak adına regülatör kullanılması önerilir."
    },
    {
        kod: "F18",
        baslik: "Ekran Kartı Parametre Hatası",
        aciklama: "Ekran kartında teknik sorun olduğunu veya kart ayarlarının yapılmadığını gösterir.",
        cozum: "Yeni kart değişiminde ayar yapılması gerekir. Müdahale edilmediyse kart değişimi gerekebilir."
    },
    {
        kod: "F19",
        baslik: "Kalorifer Sensör Bağlantı Kopukluğu",
        aciklama: "Isıtma sensörünün bağlı olmadığını veya kablo hattında kopukluk olduğunu ifade eder.",
        cozum: "Petekler az ısınır veya hiç ısınmaz. Kablo onarımı veya sensör montajı için servis desteği alın."
    },
    {
        kod: "F20",
        baslik: "Kart Uyumsuzluk Hatası",
        aciklama: "Ana kart ile ekran kartının birbiriyle uyum sağlamadığını veya yanlış eşleştirildiğini belirtir.",
        cozum: "Parça değişimi sonrası ayar gereklidir. Parça değişimi yapılmadıysa elektronik kart arızası ihtimali yüksektir."
    },
    {
        kod: "F21",
        baslik: "Su Sirkülasyon Problemi",
        aciklama: "Tesisattaki suyun dolaşımında engel olduğunu veya sirkülasyonun sağlanamadığını bildiren koddur.",
        cozum: "Pompa arızası veya tesisat tıkanıklığı olabilir. Teknik servis müdahalesi gereklidir."
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