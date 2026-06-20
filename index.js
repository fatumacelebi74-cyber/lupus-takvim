const express = require('express');
const path = require('path');
const fs = require('fs'); 
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const VERI_DOSYASI = path.join(__dirname, 'gorevler.json');
const UYE_DOSYASI = path.join(__dirname, 'uyeler.json');
const TAKIM_DOSYASI = path.join(__dirname, 'takimlar.json');

let gorevlerListesi = [];
let uyelerListesi = [];
let takimlarListesi = [];

if (fs.existsSync(VERI_DOSYASI)) {
    try { gorevlerListesi = JSON.parse(fs.readFileSync(VERI_DOSYASI, 'utf8')); } catch (e) { gorevlerListesi = []; }
}
if (fs.existsSync(UYE_DOSYASI)) {
    try { uyelerListesi = JSON.parse(fs.readFileSync(UYE_DOSYASI, 'utf8')); } catch (e) { uyelerListesi = []; }
}
if (fs.existsSync(TAKIM_DOSYASI)) {
    try { takimlarListesi = JSON.parse(fs.readFileSync(TAKIM_DOSYASI, 'utf8')); } catch (e) { takimlarListesi = []; }
}

function gorevleriKaydet() { fs.writeFileSync(VERI_DOSYASI, JSON.stringify(gorevlerListesi, null, 2), 'utf8'); }
function uyeleriKaydet() { fs.writeFileSync(UYE_DOSYASI, JSON.stringify(uyelerListesi, null, 2), 'utf8'); }
function takimlariKaydet() { fs.writeFileSync(TAKIM_DOSYASI, JSON.stringify(takimlarListesi, null, 2), 'utf8'); }

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// --- Gelişmiş Takım API'leri ---
app.get('/takimlari-getir', (req, res) => { res.json(takimlarListesi); });

app.post('/takim-ekle', (req, res) => {
    const yeniTakim = req.body;
    const isim = yeniTakim.takimAdi.trim();
    
    // 🎯 KONTROL: Aynı isimde takım var mı?
    const varMi = takimlarListesi.some(t => t.takimAdi.toLowerCase() === isim.toLowerCase());
    if (varMi) {
        return res.status(400).send("Bu takım zaten sistemde kayıtlı!");
    }

    yeniTakim.takimAdi = isim;
    yeniTakim.id = "takim_" + Date.now().toString();
    takimlarListesi.push(yeniTakim);
    takimlariKaydet();
    res.sendStatus(200);
});

// 🎯 YENİ: Takımı Havuzdan Kökten Silme
app.delete('/takim-sil/:id', (req, res) => {
    const silinecekId = req.params.id;
    const bulunanTakim = takimlarListesi.find(t => t.id === silinecekId);
    
    if (bulunanTakim) {
        // Takım silindiğinde ona bağlı görevler de temizlensin
        gorevlerListesi = gorevlerListesi.filter(g => g.takimAdi !== bulunanTakim.takimAdi && g.displayName !== bulunanTakim.takimAdi);
        takimlarListesi = takimlarListesi.filter(t => t.id !== silinecekId);
        takimlariKaydet();
        gorevleriKaydet();
    }
    res.sendStatus(200);
});


// --- Gelişmiş Üye API'leri ---
app.get('/uyeleri-getir', (req, res) => { res.json(uyelerListesi); });

app.post('/uye-ekle', (req, res) => {
    const yeniUye = req.body;
    const isim = yeniUye.adSoyad.trim();

    // 🎯 KONTROL: Aynı isimde üye var mı?
    const varMi = uyelerListesi.some(u => u.adSoyad.toLowerCase() === isim.toLowerCase());
    if (varMi) {
        return res.status(400).send("Bu üye zaten sistemde kayıtlı!");
    }

    yeniUye.adSoyad = isim;
    yeniUye.id = "uye_" + Date.now().toString();
    uyelerListesi.push(yeniUye);
    uyeleriKaydet();
    res.sendStatus(200);
});

// 🎯 YENİ: Üyeyi Havuzdan Kökten Silme
app.delete('/uye-sil/:id', (req, res) => {
    const silinecekId = req.params.id;
    const bulunanUye = uyelerListesi.find(u => u.id === silinecekId);
    
    if (bulunanUye) {
        // Üye silindiğinde ona ait görevler de takvimden temizlensin
        gorevlerListesi = gorevlerListesi.filter(g => g.displayName !== bulunanUye.adSoyad);
        uyelerListesi = uyelerListesi.filter(u => u.id !== silinecekId);
        uyeleriKaydet();
        gorevleriKaydet();
    }
    res.sendStatus(200);
});


// --- Görev API'leri ---
app.get('/gorevleri-getir', (req, res) => { res.json(gorevlerListesi); });
app.post('/gorev-ekle', (req, res) => {
    const yeniGorev = req.body;
    yeniGorev.id = Date.now().toString() + Math.random().toString().substring(2, 6);
    gorevlerListesi.push(yeniGorev);
    gorevleriKaydet(); 
    res.sendStatus(200);
});
app.delete('/gorev-sil/:id', (req, res) => {
    const silinecekId = req.params.id;
    gorevlerListesi = gorevlerListesi.filter(gorev => gorev.id !== silinecekId);
    gorevleriKaydet(); 
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Sunucu kökten silme desteği ile çalışıyor! Port: ${PORT}`);
});
