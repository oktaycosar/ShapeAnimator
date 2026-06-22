# 🎬 Shape Animator - After Effects CEP Panel

PowerPoint tarzı shape animasyonlarını After Effects'te tek tıkla oluşturan CEP paneli.

> A one-click CEP panel for creating PowerPoint-style shape animations in After Effects.

---

## ✨ Özellikler / Features

| Özellik | Açıklama |
|---------|----------|
| 🔷 **Shape Tipleri** | Yuvarlak Kutu, Dikdörtgen, Elips, Bezier Path, Poligon, Yıldız |
| 📐 **Grid Layout** | Grid düzeninde toplu shape oluşturma (kolon × satır) |
| 🎯 **9 Animasyon** | Scatter, Fade-In, Slide, Scale, Bounce, Rotate, Wipe, Typewriter, Pop |
| ⏱️ **Stagger** | Her shape sırayla gecikmeli animasyon |
| 🔢 **Numaralandırma** | Shape üstüne bold numara (punto ve renk ayarlı) |
| 🎨 **Gradient Dolgu** | Linear ve Radial gradient desteği |
| 🌑 **Drop Shadow** | Seçili shape'lere gölge ekle/çıkar |
| 📋 **Çoğaltma** | Seçili shape'leri ofsetli çoğalt |
| ⚡ **Presetler** | 35 Kutu Scatter, 20 Fade-In, 12 Grid Slide, 16 Bounce |
| 🔺🔻 **Sıralama** | Layer sırasını değiştir (öne/arkaya/ileri/geri) |

---

## 📸 Ekran Görüntüsü

![Shape Animator Panel](icons/panel.png)

---

## 📦 Kurulum / Installation

### Yöntem 1: ZXP ile (Önerilen)
1. [Releases](https://github.com/KULLANICI/ShapeAnimator/releases)'ten `ShapeAnimator.zxp` indir
2. [ZXP Installer](https://aescripts.com/learn/zxp-installer/) ile yükle
3. After Effects'i yeniden başlat
4. `Window > Extensions > Shape Animator`

### Yöntem 2: Manuel (Geliştirici)
```powershell
# Klasörü CEP uzantı dizinine kopyala
Copy-Item -Recurse "ae-shape-animator" "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.shapeanimator.panel\"
```
`.debug` dosyasının hedef klasörde olduğundan emin ol.

---

## 🛠️ ZXP Oluşturma / Build

```bat
# Windows
build.bat

# veya PowerShell
.\build-zxp.ps1
```

Gereksinim: [ZXPSignCmd](https://github.com/Adobe-CEP/CEP-Resources)

---

## 📁 Dosya Yapısı / Structure

```
ShapeAnimator/
├── CSXS/
│   └── manifest.xml          # CEP extension manifest (AE 16.0+)
├── ExtendScript/
│   └── ae_functions.jsx      # Tüm AE komutları (~1000 satır)
├── js/
│   ├── CSInterface.js        # Adobe CEP bridge
│   └── main.js               # Panel mantığı & UI bağlantısı
├── icons/                    # Panel ikonları
├── index.html                # Panel arayüzü
├── style.css                 # Koyu tema CSS
├── ShapeAnimator.zxp         # Derlenmiş paket
├── .debug                    # Geliştirici modu
├── build.bat / build-zxp.ps1 # Derleme betikleri
└── README.md
```

---

## 🎮 Kullanım

1. **Kompozisyon Oluştur** → İsim, çözünürlük, FPS, süre ayarla
2. **Shape Tipi Seç** → Bezier Path 🔷 gerçek vektörel (vertex düzenlenebilir)
3. **Grid Oluştur** → Kolon × Satır, boyut, renk, gradient
4. **Animasyon Ekle** → Tip, süre, stagger, yön seç
5. **Numaralandır** → Bold otomatik numara (punto ayarlı)

---

## 📋 Gereksinimler

- Adobe After Effects CC 2019+ (v16.0+)
- Windows / macOS
- CEP 8.0+

---

## 🤝 Katkı / Contributing

PR ve önerilere açık! Issue açmaktan çekinmeyin.

---

## 📜 Lisans

MIT License - feel free to use and modify.

---

⭐ **Beğendiysen yıldızlamayı unutma!**
