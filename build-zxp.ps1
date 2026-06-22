# Shape Animator - ZXP Paketleme (PowerShell)
# ZXP = imzali ZIP, bu script unsigned .zxp olusturur

$source = "c:\Users\Ocosar\Desktop\my_kod\my_kod_23\ae-shape-animator"
$output = "c:\Users\Ocosar\Desktop\my_kod\my_kod_23\ShapeAnimator.zxp"
$tempZip = "c:\Users\Ocosar\Desktop\my_kod\my_kod_23\_temp_shapeanimator.zip"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Shape Animator - ZXP Paketleme" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Eski dosyalari temizle
if (Test-Path $output) { Remove-Item $output -Force }
if (Test-Path $tempZip) { Remove-Item $tempZip -Force }

# Gerekli dosyalari topla
$files = @(
    "CSXS\manifest.xml",
    "index.html",
    "style.css",
    ".debug",
    "js\CSInterface.js",
    "js\main.js",
    "ExtendScript\ae_functions.jsx"
)

# Gecici bir klasor olustur
$tempDir = "$env:TEMP\shapeanimator_build"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "[*] Dosyalar kopyalaniyor..." -ForegroundColor Yellow

foreach ($file in $files) {
    $src = Join-Path $source $file
    $dst = Join-Path $tempDir $file
    $dstDir = Split-Path $dst -Parent
    if (!(Test-Path $dstDir)) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    }
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "    + $file" -ForegroundColor Gray
    } else {
        Write-Host "    ! $file (bulunamadi)" -ForegroundColor Red
    }
}

# ZIP olustur
Write-Host ""
Write-Host "[*] ZIP olusturuluyor..." -ForegroundColor Yellow

Set-Location $tempDir
Compress-Archive -Path "*" -DestinationPath $tempZip -Force
Set-Location $source

# .zxp olarak yeniden adlandir
Move-Item $tempZip $output -Force

# Gecici dizini temizle
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "[√] Basariyla olusturuldu!" -ForegroundColor Green
Write-Host "    $output" -ForegroundColor Green
Write-Host ""
Write-Host "[i] Kurulum:" -ForegroundColor Cyan
Write-Host "    1. ZXP'yi Anastar UX ile yukleyin, VEYA" -ForegroundColor White
Write-Host "    2. Manuel olarak suraya kopyalayin:" -ForegroundColor White
Write-Host "       C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.shapeanimator.panel\" -ForegroundColor Gray
Write-Host "       .debug dosyasini da ekleyin." -ForegroundColor Gray

Read-Host "Devam etmek icin bir tusa basin..."
