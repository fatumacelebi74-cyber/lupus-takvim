const express = require('express');
const path = require('path');
const fs = require('fs'); // Dosya yazıp okumak için gerekli paket
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verilerin kaydedileceği gerçek dosya yolu
const VERI_DOSYASI = path.join(__dirname, 'gorevler.json');

// Sunucu her açıldığında dosyadan verileri oku, dosya yoksa boş liste başlat
let gorevlerListesi = [];
if (fs.existsSync(VERI_DOSYASI)) {
    try {
        const dosyaIcerigi = fs.readFileSync(VERI_DOSYASI, 'utf8');
        gorevlerListesi = JSON.parse(dosyaIcerigi);
    } catch (e) {
        console.log("Veri dosyası okunurken hata oluştu, temiz liste başlatılıyor.");
        gorevlerListesi = [];
    }
}

// Verileri dosyaya kalıcı olarak yazan yardımcı fonksiyon
function verilereKaydet() {
    fs.writeFileSync(VERI_DOSYASI, JSON.stringify(gorevlerListesi, null, 2), 'utf8');
}

// Fotoğraftaki tüm 2026 yılı akademik faaliyetlerinin eksiksiz listesi
const hazirAkademikTakvim = [
    // GÜZ DÖNEMİNDEN 2026'YA SARKANLAR
    { recordType: 'academic', displayName: '📅 Ortak Zorunlu Dersler Finali', startDate: '2026-01-05', endDate: '2026-01-05', description: 'Güz Dönemi Ortak Zorunlu Derslerin Final Sınavı' },
    { recordType: 'academic', displayName: '📝 Güz Dönemi Finalleri', startDate: '2026-01-03', endDate: '2026-01-11', description: 'Güz Yarıyılı Dönem Sonu Sınavları' },
    { recordType: 'academic', displayName: '📅 Ortak Zorunlu Bütünleme', startDate: '2026-01-19', endDate: '2026-01-19', description: 'Güz Dönemi Ortak Zorunlu Derslerin Bütünleme Sınavı' },
    { recordType: 'academic', displayName: '🔄 Güz Dönemi Bütünlemeleri', startDate: '2026-01-19', endDate: '2026-01-25', description: 'Güz Yarıyılı Bütünleme Sınavları' },

    // BAHAR YARIYILI SÜREÇLERİ
    { recordType: 'academic', displayName: '🎓 Kayıt Yenileme (Bahar)', startDate: '2026-01-26', endDate: '2026-02-02', description: 'Bahar Yarıyılı Kayıt Yenileme Dönemi' },
    { recordType: 'academic', displayName: '📋 Danışman Onayı (Bahar)', startDate: '2026-01-26', endDate: '2026-02-04', description: 'Ders Kayıtları Danışman Onay Dönemi' },
    { recordType: 'academic', displayName: '📚 Derslerin Başlaması (Bahar)', startDate: '2026-02-02', endDate: '2026-02-02', description: 'Bahar Dönemi İlk Ders Günü' },
    { recordType: 'academic', displayName: '🔄 Ders Ekleme - Bırakma', startDate: '2026-02-05', endDate: '2026-02-06', description: 'Bahar Dönemi Ekle-Sil Günleri' },
    { recordType: 'academic', displayName: '❌ Mazeretli Geç Kayıt Son Başvuru', startDate: '2026-02-13', endDate: '2026-02-13', description: 'Bahar Dönemi Mazeretli Kayıt Başvurusu' },
    { recordType: 'academic', displayName: '🔄 Bahar Ek Sınav Bütünlemesi', startDate: '2026-02-16', endDate: '2026-02-20', description: 'Bahar Dönemi Ek Sınav Bütünleme Sınavları' },
    { recordType: 'academic', displayName: '📅 Ortak Zorunlu Vize Sınavı', startDate: '2026-03-30', endDate: '2026-03-30', description: 'Ortak Zorunlu Dersler Ara Sınavı' },
    { recordType: 'academic', displayName: '📝 Ara Sınavlar (Vizeler)', startDate: '2026-03-30', endDate: '2026-04-05', description: 'Bahar Dönemi Vize Sınav Haftası' },
    { recordType: 'academic', displayName: '📚 Derslerin Bitişi (Bahar)', startDate: '2026-05-22', endDate: '2026-05-22', description: 'Bahar Yarıyılı Son Ders Günü' },
    { recordType: 'academic', displayName: '📅 Ortak Zorunlu Final Sınavı', startDate: '2026-06-01', endDate: '2026-06-01', description: 'Ortak Zorunlu Dersler Final Sınavı' },
    { recordType: 'academic', displayName: '📖 Final Sınavları', startDate: '2026-06-01', endDate: '2026-06-08', description: 'Bahar Dönemi Dönem Sonu Sınavları' },
    { recordType: 'academic', displayName: '📅 Ortak Zorunlu Bütünleme', startDate: '2026-06-15', endDate: '2026-06-15', description: 'Ortak Zorunlu Dersler Bütünleme Sınavı' },
    { recordType: 'academic', displayName: '🔄 Bütünleme Sınavları', startDate: '2026-06-15', endDate: '2026-06-21', description: 'Bahar Dönemi Büt Haftası' }
];



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/gorevleri-getir', (req, res) => {
    res.json(gorevlerListesi);
});

app.post('/gorev-ekle', (req, res) => {
    const yeniGorev = req.body;
    yeniGorev.id = Date.now().toString() + Math.random().toString().substring(2, 6);
    gorevlerListesi.push(yeniGorev);
    
    verilereKaydet(); // VERİYİ DOSYAYA YAZ (ASLA SİLİNMEYECEK)
    res.sendStatus(200);
});

app.delete('/gorev-sil/:id', (req, res) => {
    const silinecekId = req.params.id;
    gorevlerListesi = gorevlerListesi.filter(gorev => gorev.id !== silinecekId);
    
    verilereKaydet(); // SİLİNDİKTEN SONRA DOSYAYI GÜNCELLE
    res.sendStatus(200);
});



app.listen(PORT, () => {
    console.log(`Sunucu kalıcı hafıza ile başlatıldı! http://localhost:${PORT}`);
});
