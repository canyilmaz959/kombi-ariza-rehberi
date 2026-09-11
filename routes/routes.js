const Ariza = require("../models/Ariza");
const Marka = require("../models/Marka");
const Model = require("../models/Model");
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const loginAttempts = new Map();
const maxLoginAttempts = 5;
const loginLockoutMs = 15 * 60 * 1000;

function getLoginAttemptKey(req, user) {
    return `${req.ip}:${user.trim().toLowerCase()}`;
}

function getLoginIpKey(req) {
    return `ip:${req.ip}`;
}

function getLoginAttemptState(key) {
    const state = loginAttempts.get(key);
    if (!state) {
        return { failures: 0, lockedUntil: 0 };
    }

    if (state.lockedUntil && state.lockedUntil <= Date.now()) {
        loginAttempts.delete(key);
        return { failures: 0, lockedUntil: 0 };
    }

    return state;
}

function clearExpiredLoginAttempts() {
    const now = Date.now();
    for (const [key, state] of loginAttempts) {
        if (state.lockedUntil && state.lockedUntil <= now) {
            loginAttempts.delete(key);
        }
    }
}

setInterval(clearExpiredLoginAttempts, loginLockoutMs).unref();

function csrfProtection(req, res, next) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }

    res.locals.csrfToken = req.session.csrfToken;

    if (req.method !== 'POST') {
        return next();
    }

    const submittedToken = req.body && req.body._csrf;
    const expectedToken = req.session.csrfToken;
    const submittedBuffer = Buffer.from(typeof submittedToken === 'string' ? submittedToken : '');
    const expectedBuffer = Buffer.from(expectedToken);

    if (submittedBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(submittedBuffer, expectedBuffer)) {
        return res.status(403).send('Geçersiz CSRF token.');
    }

    next();
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.use(csrfProtection);

//admin paneli
router.get("/admin",adminAuth, async (req, res) => {
    const markalar = await Marka.find();
    const modeller = await Model.find();
    res.render("admin", { markalar, modeller});
});

router.get("/admin/admin-arizalar",adminAuth, async (req, res) => {
    const arizalar = await Ariza.find().populate("marka").populate("model");
    res.render("admin-arizalar", { arizalar });
});

router.get("/admin/ariza-duzenle/:id",adminAuth, async (req, res) => {
    const ariza = await Ariza.findById(req.params.id);
    res.render("ariza-duzenle", { ariza });
});



router.post("/admin", adminAuth, async (req, res) => {
    try {
        const { kod, model, baslik, aciklama, cozum, marka, tarih} = req.body;

        await Ariza.create({
            kod,
            model,
            baslik,
            aciklama,
            cozum,
            marka,
            tarih,
        });

        res.redirect("/admin");
    } catch (err) {
        console.error("Arıza ekleme hatası:", err);
        res.send("Arıza eklenirken bir hata oluştu.");
    }
});


router.post("/marka-ekle", adminAuth, async (req, res) => {
    try {

        if (!req.body.name || req.body.name.trim() === "") {
            return res.send("Marka adı boş olamaz.");
        }


        const name = req.body.name.trim();
        await Marka.create({
            name,
            slug: name
            .toLowerCase()
            .replace(/ğ/g, "g")
            .replace(/ü/g, "u")
            .replace(/ş/g, "s")
            .replace(/ı/g, "i")
            .replace(/ö/g, "o")
            .replace(/ç/g, "c")
            .replace(/\s+/g, "-")
        });

        res.redirect("/admin");
    } catch (err) {
        console.error("Marka ekleme hatası:", err);
        res.send("Marka eklenirken bir hata oluştu.");
    }
});

router.post("/admin/ariza-duzenle/:id", adminAuth, async (req, res) => {
    try {
        const { baslik, aciklama, cozum } = req.body;
        await Ariza.findByIdAndUpdate(req.params.id, { baslik, aciklama, cozum });
        res.redirect("/admin/admin-arizalar");
    } catch (err) {
        console.error("Arıza düzenleme hatası:", err);
        res.send("Arıza düzenlenirken bir hata oluştu.");
    }
});

//Admin Paneli bitiş



//--------------------------------------------------------------------------//





// Ana sayfa ve diğer sayfalar
router.get("/", async (req, res) => {
    try {
        const markalar = await Marka.find().sort({ name: 1 });
        res.render("index", { markalar });
    } catch (err) {
        console.error("Markalar getirme hatası:", err);
        res.send("Markalar getirilirken bir hata oluştu.");
    }
});


router.get("/markalar/:markaslug", async (req, res) => {
    const marka  = await Marka.findOne({ slug: req.params.markaslug });

    if (!marka) {
        return res.status(404).send("Marka bulunamadı.");
    }

    const modeller = await Model.find({ marka: marka._id });
    
    res.render("marka-detay", {marka, modeller });
});

router.get("/markalar/:markaslug/:modelslug", async (req, res) => {
    const marka = await Marka.findOne({ slug : req.params.markaslug });
    if (!marka) {
        return res.status(404).send("Marka bulunamadı.");
    }

    const model = await Model.findOne({ slug: req.params.modelslug, marka: marka._id });
    if (!model) {
        return res.status(404).send("Model bulunamadı.");
    }

    const arizalar = await Ariza.find({ marka: marka._id, model: model._id })
    .populate("marka")
    .populate("model");
    

    res.render("model-detay", { marka, model, arizalar });
});



router.get("/markalar/:markaslug/:modelslug/:kod", async (req, res) => {

    const marka  = await Marka.findOne({ slug: req.params.markaslug });

    if (!marka) {
        return res.status(404).send("Marka bulunamadı.");
    }

    const model = await Model.findOne({ slug: req.params.modelslug, marka: marka._id });

    if (!model) {
        return res.status(404).send("Model bulunamadı.");
    }

    const ariza = await Ariza.findOne({ 
        kod: req.params.kod, 
        marka: marka._id,
        model: model._id })
        .populate("marka")
        .populate("model");


        res.render("ariza-detay", { ariza });
        
});

router.post("/model-ekle",adminAuth, async (req, res) => {
    try {
        const { name, marka } = req.body;

        const slug = name
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/\s+/g, "-");

        await Model.create({
            name,
            slug,
            marka
        });

        res.redirect("/admin");
    } catch (err) {
        console.error("Model ekleme hatası:", err);
        res.send("Model eklenirken bir hata oluştu.");
    }
});







//silme işlemleri
router.post("/marka-sil", adminAuth, async (req, res) => {
    try {
         const markaId = req.body.markaId;

        await Model.deleteMany({ marka: markaId });
        await Ariza.deleteMany({ marka: markaId });
        await Marka.findByIdAndDelete(markaId);

        res.redirect("/admin");

    } catch (err) {
        console.error("Marka silme hatası:", err);
        res.send("Marka silinirken bir hata oluştu.");
    }
});

router.post("/model-sil", adminAuth, async (req, res) => {
    try {
        const modelId = req.body.modelId;

        await Ariza.deleteMany({ model: modelId });
        await Model.findByIdAndDelete(modelId);

        res.redirect("/admin");
    } catch (err) {
        console.error("Model silme hatası:", err);
        res.send("Model silinirken bir hata oluştu.");
    }
});

router.post("/admin/admin-arizalar/:id", adminAuth, async (req, res) => {
    try {
        const arizaId = req.params.id;
        await Ariza.findByIdAndDelete(arizaId);
        res.redirect("/admin/admin-arizalar");
    } catch (err) {
        console.error("Arıza silme hatası:", err);
        res.send("Arıza silinirken bir hata oluştu.");
    }
});


//login işlemleri

router.get("/admin-login", (req, res) => {
    res.render("admin-login");
});

router.post("/admin-login", (req, res) => {
    const body = req.body || {};
    const user = typeof body.user === 'string' ? body.user : '';
    const pass = typeof body.pass === 'string' ? body.pass : '';
    const attemptKey = getLoginAttemptKey(req, user);
    const ipAttemptKey = getLoginIpKey(req);
    const attemptState = getLoginAttemptState(attemptKey);
    const ipAttemptState = getLoginAttemptState(ipAttemptKey);
    const lockedState = attemptState.lockedUntil > Date.now()
        ? attemptState
        : ipAttemptState;

    if (lockedState.lockedUntil > Date.now()) {
        const retryAfterSeconds = Math.ceil((lockedState.lockedUntil - Date.now()) / 1000);
        res.set('Retry-After', retryAfterSeconds.toString());
        return res.status(429).send('Çok fazla başarısız giriş denemesi. Daha sonra tekrar deneyin.');
    }

    if(user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASSWORD) {
        loginAttempts.delete(attemptKey);
        loginAttempts.delete(ipAttemptKey);
        return req.session.regenerate(err => {
            if (err) {
                console.error("Oturum oluşturma hatası:", err);
                return res.status(500).send('Giriş yapılırken bir hata oluştu.');
            }

            req.session.isAdmin = true;
            res.redirect("/admin");
        });
    } else {
        attemptState.failures += 1;
        ipAttemptState.failures += 1;
        if (attemptState.failures >= maxLoginAttempts) {
            attemptState.lockedUntil = Date.now() + loginLockoutMs;
        }
        if (ipAttemptState.failures >= maxLoginAttempts) {
            ipAttemptState.lockedUntil = Date.now() + loginLockoutMs;
        }
        loginAttempts.set(attemptKey, attemptState);
        loginAttempts.set(ipAttemptKey, ipAttemptState);
        res.status(401).send("Geçersiz kullanıcı adı veya şifre.");
    }
});

function adminAuth(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect("/admin-login");
    }
}

router.get("/admin-logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Oturum kapatma hatası:", err);
            res.send("Oturum kapatılırken bir hata oluştu.");
        } else {
            res.redirect("/admin-login");
        }
    });
});



//arama işlemi
router.get("/tum-markalar", async (req, res) => {
    const mevcutSayfa = parseInt(req.query.sayfa) || 1;
    const limit = 10;
    const skip = (mevcutSayfa - 1) * limit;
    const toplam = await Marka.countDocuments();
    const toplamSayfa = Math.ceil(toplam / limit);
    const markalar = await Marka.find()
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);
    res.render("tum-markalar", { markalar, mevcutSayfa, limit, toplamSayfa });
});

router.get("/tum-modeller", async (req, res) => {
    const mevcutSayfa = parseInt(req.query.sayfa) || 1;
    const limit = 10;
    const skip = (mevcutSayfa - 1) * limit;

    const toplam = await Model.countDocuments();
    const toplamSayfa = Math.ceil(toplam / limit);

    const modeller = await Model.find()
    .populate("marka")
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);
    res.render("tum-modeller", { modeller, mevcutSayfa, limit, toplamSayfa });
});

router.get("/tum-arizalar", async (req, res) => {
    const mevcutSayfa = parseInt(req.query.sayfa) || 1;
    const limit = 10;
    const skip = (mevcutSayfa - 1) * limit;
    const toplam = await Ariza.countDocuments();
    const toplamSayfa = Math.ceil(toplam / limit);
    const arizalar = await Ariza.find()
    .populate("marka")
    .populate("model")
    .sort({ kod: 1 })
    .skip(skip)
    .limit(limit);
    res.render("tum-arizalar", { arizalar, mevcutSayfa, limit, toplamSayfa });
});

router.get("/arama", async (req, res) => {
    const q = req.query.q;

    if (typeof q !== 'string' || q.length > 100 || q.trim() === "") {
            return res.redirect("/");
        }

    const dizi = ["hatalar", "hata kodları", "hata kodu", "arızalar", "ariza kodları", "ariza kodu", "kodlar", "kod", "hata", "ariza"];
    
    const temizq = q.trim().toLowerCase();
    const aramaMetni = escapeRegExp(temizq);

    try{    
        //özel arama
        if(temizq == "markalar"){
            res.redirect("/tum-markalar");
            return;
        }else if(temizq == "modeller"){
            res.redirect("/tum-modeller");
            return;
        }else if(dizi.includes(temizq)){
            res.redirect("./tum-arizalar");
            return;
        }




        //genel arama
        const arizalar = await Ariza.find({
            $or: [
                { kod : new RegExp(aramaMetni, "i") },
                { baslik : new RegExp(aramaMetni, "i") },
                { aciklama : new RegExp(aramaMetni, "i") },
                { cozum : new RegExp(aramaMetni, "i") }
                
            ]
        }).populate("marka").populate("model");

        const markalar = await Marka.find({ name: new RegExp(aramaMetni, "i") });
        const modeller = await Model.find({ name: new RegExp(aramaMetni, "i") }).populate("marka");

        res.render("arama-sonuc", { arizalar, markalar, modeller, q });
    }catch(err){
        console.error("Arama hatası:", err);
        res.send("Arama yapılırken bir hata oluştu.");
    }
});


module.exports = router;