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

// 🎯 YENİ: DOSYA OKUMA MOTORUNU VE VERİLERİ KORUYAN GÜVENLİ ALTYAPI
if (fs.existsSync(VERI_DOSYASI)) {
    try { 
        const veri = fs.readFileSync(VERI_DOSYASI, 'utf8').trim();
        gorevlerListesi = veri ? JSON.parse(veri) : []; 
    } catch (e) { console.error("⚠️ Görevler dosyası okunamadı, sıfırlandı:", e); gorevlerListesi = []; }
}
if (fs.existsSync(UYE_DOSYASI)) {
    try { 
        const veri = fs.readFileSync(UYE_DOSYASI, 'utf8').trim();
        uyelerListesi = veri ? JSON.parse(veri) : []; 
    } catch (e) { console.error("⚠️ Üyeler dosyası okunamadı, sıfırlandı:", e); uyelerListesi = []; }
}
if (fs.existsSync(TAKIM_DOSYASI)) {
    try { 
        const veri = fs.readFileSync(TAKIM_DOSYASI, 'utf8').trim();
        takimlarListesi = veri ? JSON.parse(veri) : []; 
    } catch (e) { console.error("⚠️ Takımlar dosyası okunamadı, sıfırlandı:", e); takimlarListesi = []; }
}


function gorevleriKaydet() { fs.writeFileSync(VERI_DOSYASI, JSON.stringify(gorevlerListesi, null, 2), 'utf8'); }
function uyeleriKaydet() { fs.writeFileSync(UYE_DOSYASI, JSON.stringify(uyelerListesi, null, 2), 'utf8'); }
function takimlariKaydet() { fs.writeFileSync(TAKIM_DOSYASI, JSON.stringify(takimlarListesi, null, 2), 'utf8'); }

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// --- 👥 GELİŞMİŞ TAKIM API'LERİ ---
app.get('/takimlari-getir', (req, res) => { res.json(takimlarListesi); });

app.post('/takim-ekle', (req, res) => {
    const yeniTakim = req.body;
    if (!yeniTakim.takimAdi) return res.status(400).send("Takım adı boş olamaz!");
    const isim = yeniTakim.takimAdi.trim();
    
    // 🎯 KONTROL: Aynı isimde takım şirket havuzunda zaten var mı?
    const varMi = takimlarListesi.some(t => t.takimAdi.toLowerCase() === isim.toLowerCase());
    if (varMi) {
        return res.status(400).send("Bu takım zaten şirket bünyesinde kayıtlı!");
    }

    yeniTakim.takimAdi = isim;
    yeniTakim.id = "takim_" + Date.now().toString();
    takimlarListesi.push(yeniTakim);
    takimlariKaydet();
    res.sendStatus(200);
});

app.delete('/takim-sil/:id', (req, res) => {
    const silinecekId = req.params.id;
    const bulunanTakim = takimlarListesi.find(t => t.id === silinecekId);
    
    if (bulunanTakim) {
        // Takım silindiğinde o takıma ait girilmiş ortak takım süreçleri takvimden temizlenir
        gorevlerListesi = gorevlerListesi.filter(g => g.recordType === 'team' ? g.displayName !== bulunanTakim.takimAdi : g.takimAdi !== bulunanTakim.takimAdi);
        
        // Üyelerin çoklu takımlar listesinden bu silinen takım adı düşürülür
        uyelerListesi.forEach(u => {
            if (u.takimlar) { u.takimlar = u.takimlar.filter(t => t !== bulunanTakim.takimAdi); }
        });
        
        takimlarListesi = takimlarListesi.filter(t => t.id !== silinecekId);
        takimlariKaydet();
        uyeleriKaydet();
        gorevleriKaydet();
    }
    res.sendStatus(200);
});


// --- 👤 GELİŞMİŞ ÇOKLU TAKIM DESTEKLİ ÜYE API'LERİ ---
app.get('/uyeleri-getir', (req, res) => { res.json(uyelerListesi); });

app.post('/browse/uye-ekle', (req, res) => { res.sendStatus(404); }); // Eski bağımlı rotaları körletiyoruz

// 🎯 DEĞİŞKEN HATASI DÜZELTİLMİŞ EN GÜVENLİ PERSONEL KAYIT MOTORU
app.post('/uye-ekle', (req, res) => {
    try {
        const yeniUye = req.body;
        if (!yeniUye || !yeniUye.adSoyad) {
            return res.status(400).send("Personel adı boş olamaz!");
        }
        
        const isim = yeniUye.adSoyad.trim();
        // 🎯 Değişkeni burada hatasız ve temiz bir şekilde tanımlıyoruz:
        const gonderilenTakimlar = Array.isArray(yeniUye.takimlar) ? yeniUye.takimlar : [];

        // Personel havuzda zaten var mı kontrolü
        const varOlanIndex = uyelerListesi.findIndex(u => u.adSoyad.toLowerCase() === isim.toLowerCase());

        if (varOlanIndex !== -1) {
            uyelerListesi[varOlanIndex].takimlar = gonderilenTakimlar;
            uyeleriKaydet();
            return res.status(200).send("güncellendi");
        }

        // Yoksa sıfırdan ekle
        const uModel = {
            adSoyad: isim,
            takimlar: gonderilenTakimlar,
            id: "uye_" + Date.now().toString()
        };
        
        uyelerListesi.push(uModel);
        uyeleriKaydet();
        return res.status(200).send("eklendi");
    } catch (err) {
        console.error("❌ Sunucu İç Hatası:", err);
        return res.status(500).send("Sunucu hatası");
    }
});


app.delete('/uye-sil/:id', (req, res) => {
    const silinecekId = req.params.id;
    const bulunanUye = uyelerListesi.find(u => u.id === silinecekId);
    
    if (bulunanUye) {
        // Personel silindiğinde takvimdeki ona ait tüm bireysel görevler temizlenir
        gorevlerListesi = gorevlerListesi.filter(g => g.recordType === 'member' ? g.displayName !== bulunanUye.adSoyad : true);
        uyelerListesi = uyelerListesi.filter(u => u.id !== silinecekId);
        uyeleriKaydet();
        gorevleriKaydet();
    }
    res.sendStatus(200);
});


// --- 📅 GÖREV / SÜREÇ PLANLAMA API'LERİ ---
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
    console.log(`🚀 Şirketsel ERP Paneli Altyapısı Aktif! Port: ${PORT}`);
});
