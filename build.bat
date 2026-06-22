@echo off
echo ============================================
echo   Shape Animator - ZXP Paketleme
echo ============================================
echo.

:: ZXPSignCmd'nin yolunu ayarla (Adobe CEP SDK ile gelir)
:: https://github.com/Adobe-CEP/CEP-Resources
set ZXPSIGNCMD="C:\Program Files (x86)\Adobe\Adobe Creative Cloud\Utils\ZXPSignCmd.exe"

if not exist %ZXPSIGNCMD% (
    echo [!] ZXPSignCmd bulunamadi!
    echo     Lutfen Adobe CEP SDK'dan ZXPSignCmd'yi indirin:
    echo     https://github.com/Adobe-CEP/CEP-Resources
    echo.
    echo [?] Alternatif: Uzantiyi debug modunda yuklemek icin .debug dosyasini kullanin.
    echo     .debug dosyasini suraya kopyalayin:
    echo     C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.shapeanimator.panel\
    pause
    exit /b 1
)

echo [*] Gecici sertifika olusturuluyor...
if not exist cert.p12 (
    %ZXPSIGNCMD% -selfSignedCert TR Istanbul ShapeAnimator cert.p12 password123
)

echo [*] ZXP paketi olusturuluyor...
%ZXPSIGNCMD% -sign "." "ShapeAnimator.zxp" cert.p12 password123 -tsa http://timestamp.digicert.com

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [√] Basariyla olusturuldu: ShapeAnimator.zxp
    echo [√] Bu dosyayi After Effects'e surukle-birak veya
    echo     Anastar UX / Extension Manager ile yukleyin.
) else (
    echo [X] Hata olustu!
    echo     Manuel ZXP icin tum dosyalari ZIPleyip .zxp olarak yeniden adlandirin.
)

pause
